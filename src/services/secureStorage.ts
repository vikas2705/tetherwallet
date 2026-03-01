/**
 * Secure storage service for wallet seed phrases and metadata.
 * Uses expo-secure-store for sensitive data and AsyncStorage for metadata.
 */
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SEED_KEY_PREFIX = 'wallet_seed_'
const WALLETS_LIST_KEY = 'wallets_list'
const ACTIVE_WALLET_KEY = 'active_wallet_id'
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled'

export interface WalletMeta {
  id: string
  name: string
  createdAt: number
}

/**
 * Save a wallet seed phrase securely
 */
export async function saveSeedPhrase(walletId: string, seedPhrase: string): Promise<void> {
  await SecureStore.setItemAsync(`${SEED_KEY_PREFIX}${walletId}`, seedPhrase, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  })
}

/**
 * Retrieve a wallet seed phrase
 */
export async function getSeedPhrase(walletId: string): Promise<string | null> {
  return SecureStore.getItemAsync(`${SEED_KEY_PREFIX}${walletId}`)
}

/**
 * Delete a wallet seed phrase
 */
export async function deleteSeedPhrase(walletId: string): Promise<void> {
  await SecureStore.deleteItemAsync(`${SEED_KEY_PREFIX}${walletId}`)
}

/**
 * Get all wallet metadata
 */
export async function getWalletsList(): Promise<WalletMeta[]> {
  const raw = await AsyncStorage.getItem(WALLETS_LIST_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

/**
 * Save wallet metadata to the list
 */
export async function saveWalletMeta(meta: WalletMeta): Promise<void> {
  const list = await getWalletsList()
  const existing = list.findIndex((w) => w.id === meta.id)
  if (existing >= 0) {
    list[existing] = meta
  } else {
    list.push(meta)
  }
  await AsyncStorage.setItem(WALLETS_LIST_KEY, JSON.stringify(list))
}

/**
 * Remove wallet from the list
 */
export async function removeWalletMeta(walletId: string): Promise<void> {
  const list = await getWalletsList()
  const filtered = list.filter((w) => w.id !== walletId)
  await AsyncStorage.setItem(WALLETS_LIST_KEY, JSON.stringify(filtered))
}

/**
 * Get the active wallet ID
 */
export async function getActiveWalletId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_WALLET_KEY)
}

/**
 * Set the active wallet ID
 */
export async function setActiveWalletId(walletId: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_WALLET_KEY, walletId)
}

/**
 * Check if biometric auth is enabled
 */
export async function isBiometricEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)
  return val === 'true'
}

/**
 * Set biometric auth preference
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, String(enabled))
}

/**
 * Generate a unique wallet ID
 */
export function generateWalletId(): string {
  return `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Check if any wallets exist
 */
export async function hasWallets(): Promise<boolean> {
  const list = await getWalletsList()
  return list.length > 0
}

/**
 * Delete all data for a wallet (seed + metadata)
 */
export async function deleteWallet(walletId: string): Promise<void> {
  await deleteSeedPhrase(walletId)
  await removeWalletMeta(walletId)
  const activeId = await getActiveWalletId()
  if (activeId === walletId) {
    const remaining = await getWalletsList()
    if (remaining.length > 0) {
      await setActiveWalletId(remaining[0].id)
    } else {
      await AsyncStorage.removeItem(ACTIVE_WALLET_KEY)
    }
  }
}
