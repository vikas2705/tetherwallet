/**
 * Activity / Transaction History screen
 */
import React, { useEffect, useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native'
import { Colors } from '../../src/theme/colors'
import { TransactionItem } from '../../src/components/TransactionItem'
import { useTransactions } from '../../src/hooks/useTransactions'
import { useWalletStore } from '../../src/store/walletStore'
import type { TxTransfer } from '../../src/services/wdkService'
import type { NetworkId } from '../../src/config/networks'
import { shortenTxHash } from '../../src/utils/formatters'
import * as Haptics from 'expo-haptics'

type Filter = 'all' | NetworkId

const EXPLORER_URLS: Record<NetworkId, string> = {
  ethereum: 'https://etherscan.io/tx/',
  sepolia: 'https://sepolia.etherscan.io/tx/',
  bitcoin: 'https://mempool.space/tx/',
  tron: 'https://tronscan.org/#/transaction/',
}

export default function ActivityScreen() {
  const { transactions, transactionsLoading, refreshTransactions } = useTransactions()
  const { addresses } = useWalletStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (Object.keys(addresses).length > 0) {
      refreshTransactions()
    }
  }, [addresses])

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await refreshTransactions()
    setIsRefreshing(false)
  }, [refreshTransactions])

  const handleTxPress = useCallback((tx: TxTransfer) => {
    const baseUrl = EXPLORER_URLS[tx.network]
    if (!baseUrl) return

    Alert.alert(
      'Transaction Details',
      `Hash: ${shortenTxHash(tx.hash, 10)}\nNetwork: ${tx.network}\nDirection: ${tx.direction}`,
      [
        { text: 'View in Explorer', onPress: () => Linking.openURL(baseUrl + tx.hash) },
        { text: 'Close', style: 'cancel' },
      ],
    )
  }, [])

  const filteredTxs = filter === 'all'
    ? transactions
    : transactions.filter((tx) => tx.network === filter)

  const renderItem = useCallback(
    ({ item }: { item: TxTransfer }) => (
      <TransactionItem transaction={item} onPress={() => handleTxPress(item)} />
    ),
    [handleTxPress],
  )

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        {transactionsLoading && (
          <ActivityIndicator size="small" color={Colors.primary} />
        )}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
            onPress={() => setFilter(f.id as Filter)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTxs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {transactionsLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : (
              <>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No Transactions</Text>
                <Text style={styles.emptySubtitle}>
                  {Object.keys(addresses).length === 0
                    ? 'Load your wallet to see transactions'
                    : 'Your transaction history will appear here'}
                </Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  )
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ethereum', label: 'ETH' },
  { id: 'sepolia', label: 'Sepolia' },
  { id: 'bitcoin', label: 'BTC' },
  { id: 'tron', label: 'TRX' },
]

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary + '60',
  },
  filterText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
})
