/**
 * WDK Indexer API client for fetching EVM and TRON transaction history.
 * Documentation: https://docs.wdk.tether.io/tools/indexer-api
 *
 * Base URL: https://wdk-api.tether.io
 */

import axios from 'axios'
import type { NetworkId } from '../config/networks'
import type { TxTransfer } from './wdkService'

const INDEXER_BASE_URL = 'https://wdk-api.tether.io'
// API key - set via environment variable
const API_KEY = process.env.EXPO_PUBLIC_WDK_INDEXER_API_KEY ?? ''

const api = axios.create({
  baseURL: INDEXER_BASE_URL,
  timeout: 30000,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
})

// Map our network IDs to indexer blockchain identifiers
const NETWORK_TO_BLOCKCHAIN: Partial<Record<NetworkId, string>> = {
  ethereum: 'ethereum',
  tron: 'tron',
}

// Map token symbols to indexer token identifiers
const TOKEN_TO_INDEXER: Record<string, string> = {
  'usdt-erc20': 'usdt',
  'eth': 'eth',
  'usdt-trc20': 'usdt',
  'trx': 'trx',
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

  if (!blockchain || !token || !address) return 0n

  try {
    const response = await api.get(
      `/api/v1/${blockchain}/${token}/${address}/token-balances`,
    )
    const data: IndexerBalanceResponse = response.data
    return BigInt(data.amount ?? '0')
  } catch {
    return 0n
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
