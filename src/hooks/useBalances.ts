/**
 * Hook for fetching and caching wallet balances.
 */

import { useCallback } from 'react'
import { useWalletStore } from '../store/walletStore'
import * as wdk from '../services/wdkService'
import { TOKENS } from '../config/networks'
import type { NetworkId } from '../config/networks'
import { fetchIndexerBalance } from '@/services/indexerApi'

export function useBalances() {
  const { balances, setBalance, addresses } = useWalletStore()

  const refreshBalances = useCallback(async () => {
    if (!wdk.isWDKInitialized()) return

    await Promise.allSettled(
      TOKENS.map(async (token) => {
        const address = addresses[token.network]
        if (!address) return

        setBalance(token.id, { isLoading: true, tokenId: token.id, network: token.network })

        try {
          let raw: bigint

          // Skip Sepolia balance fetch on startup to avoid JsonRpcProvider errors;
          // Sepolia is registered lazily when user sends on Sepolia.
          if (token.network === 'sepolia') {
            console.log('vikas token.network', token.network)
            console.log('vikas token.id', token.id)
            console.log('vikas address', address)
            raw = await fetchIndexerBalance(token.network, token.id, address)
            console.log('vikas raw', raw)
            console.log('vikas token.toString()', token)
          } else if (token.isNative) {
            raw = await wdk.getNativeBalance(token.network as NetworkId, 0)
          } else if (token.contractAddress) {
            raw = await wdk.getTokenBalance(
              token.network as NetworkId,
              token.contractAddress,
              0,
            )
          } else {
            raw = 0n
          }

          setBalance(token.id, {
            tokenId: token.id,
            network: token.network as NetworkId,
            raw,
            symbol: token.symbol,
            decimals: token.decimals,
            isLoading: false,
          })
        } catch (err) {
          setBalance(token.id, {
            tokenId: token.id,
            network: token.network as NetworkId,
            raw: 0n,
            symbol: token.symbol,
            decimals: token.decimals,
            isLoading: false,
            error: String(err),
          })
        }
      }),
    )
  }, [addresses, setBalance])

  const getBalance = useCallback(
    (tokenId: string) => balances[tokenId],
    [balances],
  )

  return { balances, refreshBalances, getBalance }
}
