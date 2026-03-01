/**
 * WDK Service - Core wallet operations using Tether WDK.
 * Manages WDK instances for each active wallet session.
 *
 * Uses direct WDK module integration (no Bare thread).
 * Networks: Ethereum (ETH + USDT-ERC20), Bitcoin (BTC), TRON (TRX + USDT-TRC20)
 */

import type { NetworkId } from '../config/networks'
import { NETWORKS } from '../config/networks'

// These will be dynamically imported to avoid issues with polyfills loading order
let WDK: any = null
let WalletManagerEvm: any = null
let WalletManagerBtc: any = null
let WalletManagerTron: any = null
let ElectrumWs: any = null

async function loadModules() {
  if (WDK) return
  const wdkModule = await import('@tetherto/wdk')
  WDK = wdkModule.default
  const evmModule = await import('@tetherto/wdk-wallet-evm')
  WalletManagerEvm = evmModule.default

  try {
    const btcModule = await import('@tetherto/wdk-wallet-btc')
    WalletManagerBtc = btcModule.default
    ElectrumWs = btcModule.ElectrumWs
  } catch (e) {
    console.warn(
      '[WDK] Bitcoin wallet module failed to load (React Native Buffer/stream polyfill issue). BTC disabled.',
      e,
    )
    WalletManagerBtc = null
    ElectrumWs = null
  }

  const tronModule = await import('@tetherto/wdk-wallet-tron')
  WalletManagerTron = tronModule.default
}

export interface Balance {
  tokenId: string
  network: NetworkId
  raw: bigint
  formatted: string
  decimals: number
  symbol: string
}

export interface SendParams {
  network: NetworkId
  tokenId: string
  to: string
  amount: bigint
  feeRate?: bigint
}

export interface FeeQuote {
  fee: bigint
  feeFormatted: string
  feeSymbol: string
  feeDecimals: number
}

export interface TxTransfer {
  id: string
  hash: string
  direction: 'incoming' | 'outgoing'
  amount: bigint
  fee: bigint
  timestamp: number
  from?: string
  to?: string
  confirmed: boolean
  network: NetworkId
  tokenId: string
}

// Singleton WDK instance per seed phrase session
let wdkInstance: any = null
let currentSeed: string | null = null
let sepoliaRegistered = false

async function ensureSepoliaRegistered(): Promise<void> {
  if (!wdkInstance || sepoliaRegistered) return
  try {
    wdkInstance.registerWallet('sepolia', WalletManagerEvm, {
      provider: NETWORKS.sepolia.rpcUrl,
    })
    sepoliaRegistered = true
  } catch (e) {
    console.warn('Sepolia registration failed:', e)
    throw e
  }
}

/**
 * Initialize WDK with the given seed phrase
 */
export async function initWDK(seedPhrase: string): Promise<void> {
  await loadModules()

  // Dispose previous instance if different seed
  if (wdkInstance && currentSeed !== seedPhrase) {
    wdkInstance.dispose()
    wdkInstance = null
  }

  if (wdkInstance) return

  sepoliaRegistered = false
  wdkInstance = new WDK(seedPhrase)

  // Register Ethereum (WDK expects RPC URL string; it creates the provider internally)
  wdkInstance.registerWallet('ethereum', WalletManagerEvm, {
    provider: NETWORKS.ethereum.rpcUrl,
  })

  // Sepolia is registered lazily on first use (ensureSepoliaRegistered) to avoid
  // JsonRpcProvider network-detection failures on startup when the RPC is slow/unreachable.

  // Register Bitcoin only if the module loaded (can fail in RN due to Buffer/stream deps)
  if (WalletManagerBtc && ElectrumWs) {
    try {
      const wsTransport = new ElectrumWs({
        url: NETWORKS.bitcoin.btcWsUrl,
      })
      wdkInstance.registerWallet('bitcoin', WalletManagerBtc, {
        client: wsTransport,
        network: 'bitcoin',
      })
    } catch (e) {
      console.warn('BTC wallet registration failed (may need network):', e)
    }
  }

  // Register TRON
  wdkInstance.registerWallet('tron', WalletManagerTron, {
    provider: NETWORKS.tron.tronProvider,
  })

  currentSeed = seedPhrase
}

/**
 * Dispose the current WDK instance (clears keys from memory)
 */
export function disposeWDK(): void {
  if (wdkInstance) {
    wdkInstance.dispose()
    wdkInstance = null
    currentSeed = null
    sepoliaRegistered = false
  }
}

/**
 * Check if WDK is initialized
 */
export function isWDKInitialized(): boolean {
  return wdkInstance !== null
}

/**
 * Return the RPC / provider URLs the WDK is configured to use (from NETWORKS).
 * Useful for debugging and verifying which endpoints are in use.
 */
export function getWDKRpcUrls(): {
  ethereum: string | undefined
  sepolia: string | undefined
  bitcoin: string | undefined
  tron: string | undefined
} {
  return {
    ethereum: NETWORKS.ethereum.rpcUrl,
    sepolia: NETWORKS.sepolia.rpcUrl,
    bitcoin: NETWORKS.bitcoin.btcWsUrl,
    tron: NETWORKS.tron.tronProvider,
  }
}

/**
 * Get address for a network
 */
export async function getAddress(network: NetworkId, index = 0): Promise<string> {
  if (!wdkInstance) throw new Error('WDK not initialized')
  if (network === 'sepolia') {
    await ensureSepoliaRegistered()
  }
  const account = await wdkInstance.getAccount(network, index)
  return account.getAddress()
}

/**
 * Get all addresses for the current wallet
 */
export async function getAllAddresses(index = 0): Promise<Record<NetworkId, string>> {
  if (!wdkInstance) throw new Error('WDK not initialized')

  const [ethAddress, btcAddress, tronAddress] = await Promise.allSettled([
    wdkInstance.getAccount('ethereum', index).then((a: any) => a.getAddress()),
    wdkInstance.getAccount('bitcoin', index).then((a: any) => a.getAddress()),
    wdkInstance.getAccount('tron', index).then((a: any) => a.getAddress()),
  ])

  const eth = ethAddress.status === 'fulfilled' ? ethAddress.value : ''
  const btc = btcAddress.status === 'fulfilled' ? btcAddress.value : ''
  const tron = tronAddress.status === 'fulfilled' ? tronAddress.value : ''

  // Sepolia uses same EVM address as Ethereum; avoid registering Sepolia at startup
  return {
    ethereum: eth,
    bitcoin: btc,
    tron,
    sepolia: eth,
  }
}

/**
 * Get native token balance for a network
 */
export async function getNativeBalance(network: NetworkId, index = 0): Promise<bigint> {
  if (!wdkInstance) throw new Error('WDK not initialized')
  if (network === 'sepolia') {
    await ensureSepoliaRegistered()
  }
  const account = await wdkInstance.getAccount(network, index)
  return account.getBalance()
}

/**
 * Get ERC-20 / TRC-20 token balance
 */
export async function getTokenBalance(
  network: NetworkId,
  contractAddress: string,
  index = 0,
): Promise<bigint> {
  if (!wdkInstance) throw new Error('WDK not initialized')
  if (network === 'sepolia') {
    await ensureSepoliaRegistered()
  }
  const account = await wdkInstance.getAccount(network, index)
  return account.getTokenBalance(contractAddress)
}

/**
 * Quote a send transaction (fee estimation without sending)
 */
export async function quoteSend(
  network: NetworkId,
  to: string,
  amount: bigint,
  tokenContractAddress?: string,
  index = 0,
): Promise<FeeQuote> {
  if (!wdkInstance) throw new Error('WDK not initialized')
  if (network === 'sepolia') {
    await ensureSepoliaRegistered()
  }
  const account = await wdkInstance.getAccount(network, index)

  let feeRaw: bigint

  if (tokenContractAddress && network !== 'bitcoin') {
    const quote = await account.quoteTransfer({
      token: tokenContractAddress,
      recipient: to,
      amount: amount,
    })
    feeRaw = quote.fee
  } else {
    const quote = await account.quoteSendTransaction({ to, value: amount })
    feeRaw = quote.fee
  }

  const nativeDecimals = network === 'bitcoin' ? 8 : network === 'tron' ? 6 : 18
  const feeSymbol = network === 'bitcoin' ? 'BTC' : network === 'tron' ? 'TRX' : 'ETH' // ETH covers both mainnet and Sepolia

  return {
    fee: feeRaw,
    feeFormatted: formatFeeInternal(feeRaw, nativeDecimals),
    feeSymbol,
    feeDecimals: nativeDecimals,
  }
}

/**
 * Send a transaction
 */
export async function sendTransaction(
  network: NetworkId,
  to: string,
  amount: bigint,
  tokenContractAddress?: string,
  index = 0,
): Promise<{ hash: string; fee: bigint }> {
  if (!wdkInstance) throw new Error('WDK not initialized')
  if (network === 'sepolia') {
    await ensureSepoliaRegistered()
  }
  const account = await wdkInstance.getAccount(network, index)

  let result: { hash: string; fee: bigint }

  if (tokenContractAddress && network !== 'bitcoin') {
    result = await account.transfer({
      token: tokenContractAddress,
      recipient: to,
      amount: amount,
    })
  } else {
    result = await account.sendTransaction({ to, value: amount })
  }

  return { hash: result.hash, fee: result.fee }
}

/**
 * Get Bitcoin transaction history (built into WDK-BTC)
 */
export async function getBtcTransactions(
  direction: 'all' | 'incoming' | 'outgoing' = 'all',
  limit = 20,
  index = 0,
): Promise<TxTransfer[]> {
  if (!wdkInstance) throw new Error('WDK not initialized')
  const account = await wdkInstance.getAccount('bitcoin', index)
  const transfers = await account.getTransfers({ direction, limit })

  return transfers.map((t: any) => ({
    id: `btc_${t.txid}`,
    hash: t.txid,
    direction: t.direction,
    amount: BigInt(t.value),
    fee: t.fee ? BigInt(t.fee) : 0n,
    timestamp: 0, // BTC electrum doesn't always return timestamp
    confirmed: t.height > 0,
    network: 'bitcoin' as NetworkId,
    tokenId: 'btc',
  }))
}

/**
 * Generate a new seed phrase
 */
export async function generateSeedPhrase(): Promise<string> {
  await loadModules()
  return WDK.getRandomSeedPhrase()
}

/**
 * Validate a seed phrase
 */
export async function validateSeedPhrase(phrase: string): Promise<boolean> {
  await loadModules()
  return WDK.isValidSeed(phrase)
}

/** Result of pinging a network's RPC/endpoint (does not require wallet to be initialized). */
export interface NetworkConnectivityResult {
  network: NetworkId
  ok: boolean
  /** Present when ok is false and we have an error message. */
  error?: string
  /** EVM: chainId from node; TRON: block number. */
  detail?: string
}

/**
 * Check if the Tether SDK can reach each network's RPC/endpoint.
 * Call this to verify connectivity (e.g. after init or in a debug screen).
 * Does not require the wallet to be initialized.
 */
export async function checkNetworkConnectivity(): Promise<NetworkConnectivityResult[]> {
  const results: NetworkConnectivityResult[] = []

  for (const [networkId, config] of Object.entries(NETWORKS) as [NetworkId, (typeof NETWORKS)[NetworkId]][]) {
    if (config.rpcUrl != null) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10_000)
        const res = await fetch(config.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1,
          }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        const data = await res.json()
        const chainIdHex = data?.result
        const ok = !!chainIdHex
        const expectedChainId = config.chainId != null ? `0x${Number(config.chainId).toString(16)}` : undefined
        const detail = chainIdHex ? `chainId ${chainIdHex}` : data?.error?.message ?? 'no result'
        if (ok && expectedChainId && chainIdHex !== expectedChainId) {
          results.push({
            network: networkId,
            ok: false,
            error: `chainId mismatch: got ${chainIdHex}, expected ${expectedChainId}`,
            detail: chainIdHex,
          })
        } else {
          results.push({ network: networkId, ok, error: ok ? undefined : detail, detail: chainIdHex })
        }
      } catch (e) {
        results.push({
          network: networkId,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        })
      }
      continue
    }

    if (config.tronProvider != null) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10_000)
        const res = await fetch(`${config.tronProvider}/wallet/getnowblock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visible: false }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        const data = await res.json()
        const blockNum = data?.block_header?.raw_data?.number
        const ok = typeof blockNum === 'number'
        results.push({
          network: networkId,
          ok,
          error: ok ? undefined : (data?.Error ?? 'no block'),
          detail: ok ? `block #${blockNum}` : undefined,
        })
      } catch (e) {
        results.push({
          network: networkId,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        })
      }
      continue
    }

    if (networkId === 'bitcoin') {
      results.push({
        network: 'bitcoin',
        ok: false,
        error: 'Bitcoin uses Electrum WebSocket; connectivity not checked here',
      })
    }
  }

  return results
}

/**
 * Check connectivity for a single network by ID.
 */
export async function checkNetworkConnectivityFor(
  networkId: NetworkId,
): Promise<NetworkConnectivityResult> {
  const list = await checkNetworkConnectivity()
  return list.find((r) => r.network === networkId) ?? { network: networkId, ok: false, error: 'Unknown network' }
}

// Internal helper
function formatFeeInternal(fee: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const whole = fee / divisor
  const remainder = fee % divisor
  if (remainder === 0n) return whole.toString()
  const remStr = remainder.toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${whole}.${remStr}`
}
