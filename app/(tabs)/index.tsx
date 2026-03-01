/**
 * Home / Portfolio screen
 * Shows wallet balances, quick actions, and network overview
 */
import React, { useEffect, useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../src/theme/colors'
import { TokenRow } from '../../src/components/TokenRow'
import { useWalletStore, selectActiveWallet } from '../../src/store/walletStore'
import { useBalances } from '../../src/hooks/useBalances'
import { loadWalletData } from '../../src/hooks/useWalletInit'
import * as wdk from '../../src/services/wdkService'
import { TOKENS } from '../../src/config/networks'
import { formatBalance } from '../../src/utils/formatters'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import axios from 'axios'

export default function HomeScreen() {
  const { addresses, balances, isUnlocked, activeWalletId, wallets } = useWalletStore()
  const activeWallet = useWalletStore(selectActiveWallet)
  const { refreshBalances } = useBalances()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingWallet, setIsLoadingWallet] = useState(false)

  // Initialize wallet data when unlocked
  useEffect(() => {
    if (!wdk.isWDKInitialized() && activeWalletId && !isLoadingWallet) {
      const load = async () => {
        setIsLoadingWallet(true)
        try {
          await loadWalletData(activeWalletId)
          await refreshBalances()
        } catch (err) {
          console.error('Failed to load wallet:', err)
        } finally {
          setIsLoadingWallet(false)
        }
      }
      load()
    }
  }, [activeWalletId])

  // useEffect(() => {
  //   const makeApiCall = async () => {
  //     // Android emulator: 127.0.0.1 is the emulator itself; use 10.0.2.2 to reach host machine's localhost.
  //     const host = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1'
  //     const url = `http://${host}:3000/api/sepolia/token-balances`
  //     console.log('vikas url', url)
  //     try {
  //       console.log('🚀 ~ makeApiCall vikass ~ url:', url)
  //       console.log('🚀 ~ makeApiCall 222 ~ url:', url)
  //       fetch(url, { method: 'GET' })
  //         .then((response) => {
  //           console.log('🚀 ~ makeApiCall 444 ~ response:', response)
  //           return response.text()
  //         })
  //         .then((result) => console.log('vikas result', result))
  //         .catch((error) => console.error('vikas error', error))
  //     } catch (error) {
  //       console.log('🚀 ~ makeApiCall 333~ error:', error)
  //     }
  //   }
  //   makeApiCall()
  // }, [])

  // Refresh balances when addresses are loaded
  useEffect(() => {
    if (Object.keys(addresses).length > 0) {
      refreshBalances()
    }
  }, [addresses])

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await refreshBalances()
    setIsRefreshing(false)
  }, [refreshBalances])

  // Calculate total portfolio value (simplified - no price feed)
  const ethBalance = balances['eth']
  const btcBalance = balances['btc']
  const usdtErcBalance = balances['usdt-erc20']
  const trxBalance = balances['trx']
  const usdtTrcBalance = balances['usdt-trc20']
  const sepoliaEthBalance = balances['sepolia-eth']
  const usdtSepoliaBalance = balances['usdt-sepolia']


  if (wallets.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Wallet Found</Text>
          <Text style={styles.emptySubtitle}>Create or import a wallet to get started</Text>
          <PrimaryButton
            title="Get Started"
            onPress={() => router.push('/(auth)/welcome')}
            size="lg"
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {activeWallet?.name ?? 'My Wallet'}
            </Text>
            <Text style={styles.headerSub}>Portfolio Overview</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        </View>

        {isLoadingWallet ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading wallet...</Text>
          </View>
        ) : (
          <>
            {/* Total Balance Card */}
            <LinearGradient
              colors={[Colors.primary + '25', Colors.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceSymbol}>₮</Text>
                <Text style={styles.balanceTether}>
                  {formatBalance(
                    (usdtErcBalance?.raw ?? 0n) + (usdtTrcBalance?.raw ?? 0n) + (usdtSepoliaBalance?.raw ?? 0n),
                    6,
                    2,
                  )}
                </Text>
                <Text style={styles.balanceCurrency}> USDT</Text>
              </View>
              <Text style={styles.balanceAddresses}>
                {Object.values(addresses).filter(Boolean).length} networks active
              </Text>
            </LinearGradient>

            {/* Quick Actions */}
            <View style={styles.actions}>
              <QuickAction
                icon="↑"
                label="Send"
                color={Colors.ethereum}
                onPress={() => router.push('/send')}
              />
              <QuickAction
                icon="↓"
                label="Receive"
                color={Colors.success}
                onPress={() => router.push('/receive')}
              />
              <QuickAction
                icon="⊡"
                label="Scan"
                color={Colors.secondary}
                onPress={() => router.push('/scan')}
              />
            </View>

            {/* USDT Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tether (USDT)</Text>
              <View style={styles.tokenList}>
                <TokenRow
                  token={TOKENS.find((t) => t.id === 'usdt-erc20')!}
                  balance={usdtErcBalance}
                  onPress={() => router.push({ pathname: '/receive', params: { tokenId: 'usdt-erc20' } })}
                />
                <TokenRow
                  token={TOKENS.find((t) => t.id === 'usdt-trc20')!}
                  balance={usdtTrcBalance}
                  onPress={() => router.push({ pathname: '/receive', params: { tokenId: 'usdt-trc20' } })}
                />
                <TokenRow
                  token={TOKENS.find((t) => t.id === 'usdt-sepolia')!}
                  balance={usdtSepoliaBalance}
                  onPress={() => router.push({ pathname: '/receive', params: { tokenId: 'usdt-sepolia' } })}
                />
              </View>
            </View>

            {/* Other Assets */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Other Assets</Text>
              <View style={styles.tokenList}>
                <TokenRow
                  token={TOKENS.find((t) => t.id === 'eth')!}
                  balance={ethBalance}
                  onPress={() => router.push({ pathname: '/receive', params: { tokenId: 'eth' } })}
                />
                <TokenRow
                  token={TOKENS.find((t) => t.id === 'sepolia-eth')!}
                  balance={sepoliaEthBalance}
                  onPress={() => router.push({ pathname: '/receive', params: { tokenId: 'sepolia-eth' } })}
                />
                <TokenRow
                  token={TOKENS.find((t) => t.id === 'btc')!}
                  balance={btcBalance}
                  onPress={() => router.push({ pathname: '/receive', params: { tokenId: 'btc' } })}
                />
                <TokenRow
                  token={TOKENS.find((t) => t.id === 'trx')!}
                  balance={trxBalance}
                  onPress={() => router.push({ pathname: '/receive', params: { tokenId: 'trx' } })}
                  showArrow={false}
                />
              </View>
            </View>

            {/* Network Addresses Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wallet Addresses</Text>
              <View style={styles.addressList}>
                {Object.entries(addresses).map(([network, address]) =>
                  address ? (
                    <TouchableOpacity
                      key={network}
                      style={styles.addressRow}
                      onPress={() =>
                        router.push({
                          pathname: '/receive',
                          params: { network },
                        })
                      }
                    >
                      <View style={[styles.networkDot, { backgroundColor: NETWORK_COLORS[network] }]} />
                      <View style={styles.addressInfo}>
                        <Text style={styles.networkName}>{NETWORK_NAMES[network]}</Text>
                        <Text style={styles.addressText} numberOfLines={1}>
                          {(address && typeof address === 'string') ? `${address?.slice(0, 8)}...${address?.slice(-6)}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.addressArrow}>›</Text>
                    </TouchableOpacity>
                  ) : null,
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function QuickAction({ icon, label, color, onPress }: {
  icon: string; label: string; color: string; onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20', borderColor: color + '40' }]}>
        <Text style={[styles.quickActionIconText, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

const NETWORK_COLORS: Record<string, string> = {
  ethereum: Colors.ethereum,
  sepolia: Colors.sepolia,
  bitcoin: Colors.bitcoin,
  tron: Colors.tron,
}
const NETWORK_NAMES: Record<string, string> = {
  ethereum: 'Ethereum',
  sepolia: 'Sepolia Testnet',
  bitcoin: 'Bitcoin',
  tron: 'TRON',
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  refreshIcon: {
    fontSize: 20,
    color: Colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  balanceCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  balanceSymbol: {
    fontSize: 28,
    color: Colors.primary,
    fontWeight: '800',
    marginRight: 4,
    marginBottom: 2,
  },
  balanceTether: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
  },
  balanceCurrency: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  balanceAddresses: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quickActionIconText: {
    fontSize: 24,
    fontWeight: '700',
  },
  quickActionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tokenList: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  addressList: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  networkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  addressInfo: {
    flex: 1,
  },
  networkName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  addressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  addressArrow: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
})
