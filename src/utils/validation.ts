import type { NetworkId } from '../config/networks'

/**
 * Validate an Ethereum address
 */
export function isValidEthAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address)
}

/**
 * Validate a Bitcoin address (mainnet - supports legacy, P2SH, bech32, bech32m)
 */
export function isValidBtcAddress(address: string): boolean {
  // Legacy (P2PKH)
  if (/^1[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) return true
  // P2SH
  if (/^3[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) return true
  // Bech32 (SegWit)
  if (/^bc1[0-9a-z]{39,59}$/.test(address)) return true
  // Bech32m (Taproot)
  if (/^bc1p[0-9a-z]{58}$/.test(address)) return true
  return false
}

/**
 * Validate a TRON address (base58, starts with T)
 */
export function isValidTronAddress(address: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)
}

/**
 * Validate an address for a specific network
 */
export function isValidAddress(address: string, network: NetworkId): boolean {
  switch (network) {
    case 'ethereum':
      return isValidEthAddress(address)
    case 'bitcoin':
      return isValidBtcAddress(address)
    case 'tron':
      return isValidTronAddress(address)
    default:
      return false
  }
}

/**
 * Validate a BIP-39 seed phrase (12 or 24 words)
 */
export function isValidSeedPhrase(phrase: string): boolean {
  const words = phrase.trim().split(/\s+/)
  return words.length === 12 || words.length === 24
}

/**
 * Detect the network from an address format
 */
export function detectNetworkFromAddress(address: string): NetworkId | null {
  if (isValidEthAddress(address)) return 'ethereum'
  if (isValidBtcAddress(address)) return 'bitcoin'
  if (isValidTronAddress(address)) return 'tron'
  return null
}
