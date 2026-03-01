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
  const btcModule = await import('@tetherto/wdk-wallet-btc')
  WalletManagerBtc = btcModule.default
  ElectrumWs = btcModule.ElectrumWs
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

  wdkInstance = new WDK(seedPhrase)

  // Register Ethereum
  wdkInstance.registerWallet('ethereum', WalletManagerEvm, {
    provider: NETWORKS.ethereum.rpcUrl,
  })

  // Register Bitcoin with WebSocket transport for React Native compatibility
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
  }
}

/**
 * Check if WDK is initialized
 */
export function isWDKInitialized(): boolean {
  return wdkInstance !== null
}

/**
 * Get address for a network
 */
export async function getAddress(network: NetworkId, index = 0): Promise<string> {
  if (!wdkInstance) throw new Error('WDK not initialized')
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

  return {
    ethereum: ethAddress.status === 'fulfilled' ? ethAddress.value : '',
    bitcoin: btcAddress.status === 'fulfilled' ? btcAddress.value : '',
    tron: tronAddress.status === 'fulfilled' ? tronAddress.value : '',
  }
}

/**
 * Get native token balance for a network
 */
export async function getNativeBalance(network: NetworkId, index = 0): Promise<bigint> {
  if (!wdkInstance) throw new Error('WDK not initialized')
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
  const feeSymbol = network === 'bitcoin' ? 'BTC' : network === 'tron' ? 'TRX' : 'ETH'

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

// Internal helper
function formatFeeInternal(fee: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const whole = fee / divisor
  const remainder = fee % divisor
  if (remainder === 0n) return whole.toString()
  const remStr = remainder.toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${whole}.${remStr}`
}
