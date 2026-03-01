/**
 * WDK Indexer API client for fetching EVM and TRON transaction history.
 * Documentation: https://docs.wdk.tether.io/tools/indexer-api
 *
 * Base URL: https://wdk-api.tether.io
 */

import axios from 'axios'
import type { NetworkId } from '../config/networks'
import { getTokenById } from '../config/networks'
import type { TxTransfer } from './wdkService'

const SEPOLIA_ETHERSCAN_API = 'https://api-sepolia.etherscan.io/api'

const INDEXER_BASE_URL = 'https://wdk-api.tether.io'
// API key - set via environment variable
const API_KEY = process.env.EXPO_PUBLIC_WDK_INDEXER_API_KEY ?? ''

const api = axios.create({
  baseURL: INDEXER_BASE_URL,
  // timeout: 30000,
  headers: {
    'x-api-key': API_KEY,
    // 'Content-Type': 'application/json',
  },
})

// Map our network IDs to indexer blockchain identifiers
const NETWORK_TO_BLOCKCHAIN: Partial<Record<NetworkId, string>> = {
  ethereum: 'ethereum',
  tron: 'tron',
  sepolia: 'sepolia', // WDK indexer testnet identifier (falls back gracefully if unsupported)
}

// Map token symbols to indexer token identifiers
const TOKEN_TO_INDEXER: Record<string, string> = {
  'usdt-erc20': 'usdt',
  'eth': 'eth',
  'usdt-trc20': 'usdt',
  'trx': 'trx',
  'usdt-sepolia': 'usdt',
  'sepolia-eth': 'eth',
}

export interface IndexerTransfer {
  transaction_hash: string
  block_number: number
  block_timestamp: number
  from_address: string
  to_address: string
  value: string
  token_symbol: string
  token_decimals: number
  direction: 'incoming' | 'outgoing'
}

export interface IndexerBalanceResponse {
  amount: string
  denomination: string
}

/**
 * Fetch token transfers from the indexer API
 */
export async function fetchTokenTransfers(
  network: NetworkId,
  tokenId: string,
  address: string,
  limit = 20,
): Promise<TxTransfer[]> {
  const blockchain = NETWORK_TO_BLOCKCHAIN[network]
  const token = TOKEN_TO_INDEXER[tokenId]

  if (!blockchain || !token || !address) return []

  try {
    const response = await api.get(
      `/api/v1/${blockchain}/${token}/${address}/token-transfers`,
      {
        params: { limit },
      },
    )

    const data: IndexerTransfer[] = response.data?.transfers ?? response.data ?? []

    return data.map((tx): TxTransfer => ({
      id: `${network}_${tx.transaction_hash}`,
      hash: tx.transaction_hash,
      direction: tx.direction,
      amount: BigInt(tx.value || '0'),
      fee: 0n,
      timestamp: tx.block_timestamp,
      from: tx.from_address,
      to: tx.to_address,
      confirmed: tx.block_number > 0,
      network,
      tokenId,
    }))
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        console.warn('Indexer API: Unauthorized - check API key')
      } else if (err.response?.status === 429) {
        console.warn('Indexer API: Rate limited')
      }
    }
    return []
  }
}

/**
 * Fetch token balance from the indexer API
 */
export async function fetchIndexerBalance(
  network: NetworkId,
  tokenId: string,
  address: string,
): Promise<bigint> {
  const blockchain = NETWORK_TO_BLOCKCHAIN[network]
  const token = TOKEN_TO_INDEXER[tokenId]

  console.log('network-vikas-', blockchain)
  console.log('tokenId-vikas-', tokenId)
  console.log('address-vikas-', address)
  console.log('blockchain--vikas-', blockchain)
  console.log('blockchain--vikas-', blockchain)
  console.log('token--vikas-', token)
  console.log('address--vikas-', address)

  // if (!blockchain || !token || !address) return 0n

  try {
    // DEBUG: hardcoded URL for quick debugging
    const debugUrl =
      'https://wdk-api.tether.io/api/v1/sepolia/usdt/0x9858effd232b4033e47d90003d41ec34ecaeda94/token-balances'
    const response = await fetch(debugUrl, {
      headers: {
        'x-api-key': 'ee3ed5a39c9e449213c78e3684329a5de8cfd93839547b327b9d90d3ca4ab541',
        'Content-Type': 'application/json',
      },
    })
    const data: any = await response.json()
    console.log("🚀 ~ fetchIndexerBalance ~ data:", data)
    return BigInt(data.amount ?? '0')
  } catch (error) {
    console.log("🚀 ~ fetchIndexerBalance ~ error:", error)
    return 0n
  }
}

/**
 * Fetch Sepolia native ETH balance from Etherscan (so wallet shows balance without WDK Sepolia provider).
 */
export async function fetchSepoliaNativeBalance(address: string): Promise<bigint> {
  const addr = (address || '').trim()
  if (!addr) return 0n

  try {
    const params: Record<string, string> = {
      module: 'account',
      action: 'balance',
      address: addr,
      tag: 'latest',
    }
    const apiKey = process.env.EXPO_PUBLIC_ETHERSCAN_API_KEY
    if (apiKey) params.apikey = apiKey

    const res = await axios.get(SEPOLIA_ETHERSCAN_API, {
      params,
      timeout: 15000,
    })
    if (res.data?.status === '1' && res.data?.result != null) {
      return BigInt(String(res.data.result))
    }
    return 0n
  } catch {
    return 0n
  }
}

/**
 * Fetch Sepolia ERC-20 token balance from Etherscan.
 * Contract 0xd077a400968890eacc75cdc901f0356c943e4fdb = Tether USD (Sepolia).
 */
export async function fetchSepoliaTokenBalance(
  address: string,
  contractAddress: string,
): Promise<bigint> {
  const addr = (address || '').trim()
  const contract = (contractAddress || '').trim()
  if (!addr || !contract) return 0n

  try {
    const params: Record<string, string> = {
      module: 'account',
      action: 'tokenbalance',
      contractaddress: contract,
      address: addr,
      tag: 'latest',
    }
    const apiKey = process.env.EXPO_PUBLIC_ETHERSCAN_API_KEY
    if (apiKey) params.apikey = apiKey

    const res = await axios.get(SEPOLIA_ETHERSCAN_API, {
      params,
      timeout: 15000,
    })

    const status = res.data?.status
    const result = res.data?.result
    const message = res.data?.message

    if (status === '1' && result !== undefined && result !== null) {
      const value = BigInt(String(result))
      return value
    }
    if (typeof __DEV__ !== 'undefined' && __DEV__ && (status !== '1' || message)) {
      console.warn('[Sepolia balance]', status, message || result, { address: addr.slice(0, 10) + '...' })
    }
    return 0n
  } catch (err) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[Sepolia token balance]', err instanceof Error ? err.message : err)
    }
    return 0n
  }
}

/**
 * Fetch Sepolia transaction history from Etherscan (fallback when WDK indexer doesn't support Sepolia).
 */
async function fetchSepoliaTransactionsFromEtherscan(
  address: string,
  limit = 20,
): Promise<TxTransfer[]> {
  const usdtToken = getTokenById('usdt-sepolia')
  const usdtContract = usdtToken?.contractAddress?.toLowerCase()

  const txs: TxTransfer[] = []
  try {
    // Normal ETH transactions
    const txListRes = await axios.get(SEPOLIA_ETHERSCAN_API, {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: limit,
        sort: 'desc',
      },
      timeout: 15000,
    })
    const txList: Array<{ hash: string; from: string; to: string; value: string; timeStamp: string; blockNumber: string }> =
      txListRes.data?.result ?? []
    if (Array.isArray(txList) && txList.length > 0 && !txList[0].message) {
      for (const tx of txList) {
        const isIncoming = (tx.to || '').toLowerCase() === address.toLowerCase()
        txs.push({
          id: `sepolia_${tx.hash}`,
          hash: tx.hash,
          direction: isIncoming ? 'incoming' : 'outgoing',
          amount: BigInt(tx.value || '0'),
          fee: 0n,
          timestamp: parseInt(tx.timeStamp || '0', 10),
          from: tx.from,
          to: tx.to,
          confirmed: parseInt(tx.blockNumber || '0', 10) > 0,
          network: 'sepolia',
          tokenId: 'sepolia-eth',
        })
      }
    }

    // ERC-20 token transfers (e.g. USDT)
    const tokenTxRes = await axios.get(SEPOLIA_ETHERSCAN_API, {
      params: {
        module: 'account',
        action: 'tokentx',
        address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: limit,
        sort: 'desc',
      },
      timeout: 15000,
    })
    const tokenTxList: Array<{
      hash: string
      from: string
      to: string
      value: string
      timeStamp: string
      blockNumber: string
      contractAddress: string
    }> = tokenTxRes.data?.result ?? []
    if (Array.isArray(tokenTxList) && tokenTxList.length > 0 && !tokenTxList[0].message) {
      for (const tx of tokenTxList) {
        const contract = (tx.contractAddress || '').toLowerCase()
        const tokenId = contract === usdtContract ? 'usdt-sepolia' : 'sepolia-eth'
        if (tokenId === 'sepolia-eth') continue // only include known tokens (USDT) for now
        const isIncoming = (tx.to || '').toLowerCase() === address.toLowerCase()
        txs.push({
          id: `sepolia_${tx.hash}`,
          hash: tx.hash,
          direction: isIncoming ? 'incoming' : 'outgoing',
          amount: BigInt(tx.value || '0'),
          fee: 0n,
          timestamp: parseInt(tx.timeStamp || '0', 10),
          from: tx.from,
          to: tx.to,
          confirmed: parseInt(tx.blockNumber || '0', 10) > 0,
          network: 'sepolia',
          tokenId,
        })
      }
    }

    // Dedupe by hash: same tx can appear in txlist (ETH) and tokentx (ERC-20); keep token transfer when both exist
    const byHash = new Map<string, TxTransfer>()
    for (const tx of txs) {
      const existing = byHash.get(tx.hash)
      if (!existing || tx.tokenId === 'usdt-sepolia') byHash.set(tx.hash, tx)
    }
    return Array.from(byHash.values()).sort((a, b) => b.timestamp - a.timestamp)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.warn('Sepolia Etherscan API error:', err.message)
    }
    return []
  }
}

/**
 * Fetch transfers for multiple tokens/networks in batch
 */
export async function fetchAllTransactions(
  addressMap: Partial<Record<NetworkId, string>>,
): Promise<TxTransfer[]> {
  const requests: Promise<TxTransfer[]>[] = []

  // ETH transfers
  if (addressMap.ethereum) {
    requests.push(fetchTokenTransfers('ethereum', 'eth', addressMap.ethereum))
    requests.push(fetchTokenTransfers('ethereum', 'usdt-erc20', addressMap.ethereum))
  }

  // Sepolia: use Etherscan so Sepolia txs always show (WDK indexer may not support Sepolia)
  if (addressMap.sepolia) {
    requests.push(fetchSepoliaTransactionsFromEtherscan(addressMap.sepolia))
  }

  // TRON transfers
  if (addressMap.tron) {
    requests.push(fetchTokenTransfers('tron', 'trx', addressMap.tron))
    requests.push(fetchTokenTransfers('tron', 'usdt-trc20', addressMap.tron))
  }

  const results = await Promise.allSettled(requests)
  const allTxs: TxTransfer[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allTxs.push(...result.value)
    }
  }

  // Sort by timestamp descending
  return allTxs.sort((a, b) => b.timestamp - a.timestamp)
}
