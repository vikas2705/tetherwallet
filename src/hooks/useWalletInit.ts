/**
 * Hook for initializing the wallet on app startup.
 * Checks for existing wallets, loads active wallet, sets up state.
 */

import { useEffect, useCallback } from 'react'
import { useWalletStore } from '../store/walletStore'
import * as storage from '../services/secureStorage'
import * as wdk from '../services/wdkService'

export function useWalletInit() {
  const {
    setWallets,
    setActiveWalletId,
    setInitialized,
    setLoading,
    setAddresses,
  } = useWalletStore()

  const initialize = useCallback(async () => {
    try {
      setLoading(true)

      // Load wallet list
      const wallets = await storage.getWalletsList()
      setWallets(wallets)

      if (wallets.length === 0) {
        setInitialized(true)
        setLoading(false)
        return
      }

      // Load active wallet ID
      let activeId = await storage.getActiveWalletId()
      if (!activeId || !wallets.find((w) => w.id === activeId)) {
        activeId = wallets[0].id
        await storage.setActiveWalletId(activeId)
      }
      setActiveWalletId(activeId)
      setInitialized(true)
    } catch (err) {
      console.error('Wallet init error:', err)
      setInitialized(true)
    } finally {
      setLoading(false)
    }
  }, [setWallets, setActiveWalletId, setInitialized, setLoading])

  useEffect(() => {
    initialize()
  }, [initialize])

  return { reinitialize: initialize }
}

/**
 * Load wallet data (addresses, balances) after unlock
 */
export async function loadWalletData(walletId: string): Promise<void> {
  const seedPhrase = await storage.getSeedPhrase(walletId)
  if (!seedPhrase) throw new Error('Seed phrase not found')

  await wdk.initWDK(seedPhrase)
  const addresses = await wdk.getAllAddresses(0)

  useWalletStore.getState().setAddresses(addresses)
}
