/**
 * Hook for fetching transaction history using WDK and Indexer API.
 */

import { useCallback } from 'react'
import { useWalletStore } from '../store/walletStore'
import * as wdk from '../services/wdkService'
import * as indexer from '../services/indexerApi'
import type { NetworkId } from '../config/networks'
import type { TxTransfer } from '../services/wdkService'

export function useTransactions() {
  const {
    transactions,
    transactionsLoading,
    setTransactions,
    setTransactionsLoading,
    addresses,
  } = useWalletStore()

  const refreshTransactions = useCallback(async () => {
    if (!wdk.isWDKInitialized()) return

    setTransactionsLoading(true)

    try {
      const allTxs: TxTransfer[] = []

      // Fetch BTC transactions (from WDK built-in)
      if (addresses.bitcoin) {
        try {
          const btcTxs = await wdk.getBtcTransactions('all', 20)
          allTxs.push(...btcTxs)
        } catch {
          // BTC might fail if network unavailable
        }
      }

      // Fetch EVM and TRON transactions from Indexer API
      const indexerTxs = await indexer.fetchAllTransactions({
        ethereum: addresses.ethereum,
        tron: addresses.tron,
      })
      allTxs.push(...indexerTxs)

      // Sort all by timestamp descending
      allTxs.sort((a, b) => b.timestamp - a.timestamp)

      setTransactions(allTxs)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setTransactionsLoading(false)
    }
  }, [addresses, setTransactions, setTransactionsLoading])

  const getNetworkTransactions = useCallback(
    (network: NetworkId) =>
      transactions.filter((tx) => tx.network === network),
    [transactions],
  )

  return {
    transactions,
    transactionsLoading,
    refreshTransactions,
    getNetworkTransactions,
  }
}
