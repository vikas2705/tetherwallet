/**
 * Wallet store - manages wallet state using Zustand.
 * Handles: wallet list, active wallet, balances, addresses, transactions.
 */

import { create } from 'zustand'
import type { NetworkId } from '../config/networks'
import type { TxTransfer } from '../services/wdkService'
import type { WalletMeta } from '../services/secureStorage'

export interface WalletBalance {
  tokenId: string
  network: NetworkId
  raw: bigint
  symbol: string
  decimals: number
  isLoading: boolean
  error?: string
}

export interface WalletState {
  // Wallet list
  wallets: WalletMeta[]
  activeWalletId: string | null

  // Addresses per network for current wallet
  addresses: Partial<Record<NetworkId, string>>

  // Balances - keyed by tokenId
  balances: Record<string, WalletBalance>

  // Transactions
  transactions: TxTransfer[]
  transactionsLoading: boolean

  // App state
  isUnlocked: boolean
  isInitialized: boolean
  isLoading: boolean

  // Actions
  setWallets: (wallets: WalletMeta[]) => void
  setActiveWalletId: (id: string | null) => void
  addWallet: (wallet: WalletMeta) => void
  removeWallet: (id: string) => void
  setAddresses: (addresses: Partial<Record<NetworkId, string>>) => void
  setBalance: (tokenId: string, balance: Partial<WalletBalance>) => void
  setBalancesLoading: (tokenIds: string[]) => void
  setTransactions: (txs: TxTransfer[]) => void
  setTransactionsLoading: (loading: boolean) => void
  setUnlocked: (unlocked: boolean) => void
  setInitialized: (initialized: boolean) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const initialState = {
  wallets: [],
  activeWalletId: null,
  addresses: {},
  balances: {},
  transactions: [],
  transactionsLoading: false,
  isUnlocked: false,
  isInitialized: false,
  isLoading: false,
}

export const useWalletStore = create<WalletState>((set) => ({
  ...initialState,

  setWallets: (wallets) => set({ wallets }),

  setActiveWalletId: (id) => set({ activeWalletId: id }),

  addWallet: (wallet) =>
    set((state) => ({
      wallets: [...state.wallets.filter((w) => w.id !== wallet.id), wallet],
    })),

  removeWallet: (id) =>
    set((state) => ({
      wallets: state.wallets.filter((w) => w.id !== id),
      activeWalletId: state.activeWalletId === id ? null : state.activeWalletId,
    })),

  setAddresses: (addresses) => set({ addresses }),

  setBalance: (tokenId, balance) =>
    set((state) => ({
      balances: {
        ...state.balances,
        [tokenId]: {
          ...state.balances[tokenId],
          ...balance,
        },
      },
    })),

  setBalancesLoading: (tokenIds) =>
    set((state) => {
      const updates: Record<string, WalletBalance> = {}
      for (const id of tokenIds) {
        updates[id] = {
          ...state.balances[id],
          tokenId: id,
          network: state.balances[id]?.network ?? 'ethereum',
          raw: state.balances[id]?.raw ?? 0n,
          symbol: state.balances[id]?.symbol ?? '',
          decimals: state.balances[id]?.decimals ?? 18,
          isLoading: true,
        }
      }
      return { balances: { ...state.balances, ...updates } }
    }),

  setTransactions: (transactions) => set({ transactions }),

  setTransactionsLoading: (loading) => set({ transactionsLoading: loading }),

  setUnlocked: (isUnlocked) => set({ isUnlocked }),

  setInitialized: (isInitialized) => set({ isInitialized }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({ ...initialState }),
}))

// Selector helpers
export const selectActiveWallet = (state: WalletState) =>
  state.wallets.find((w) => w.id === state.activeWalletId) ?? null

export const selectBalance = (tokenId: string) => (state: WalletState) =>
  state.balances[tokenId]

export const selectAddress = (network: NetworkId) => (state: WalletState) =>
  state.addresses[network] ?? ''
