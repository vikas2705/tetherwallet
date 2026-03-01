import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Colors } from '../theme/colors'
import { NetworkIcon } from './NetworkIcon'
import { formatBalance } from '../utils/formatters'
import type { WalletBalance } from '../store/walletStore'
import type { TokenConfig } from '../config/networks'

interface Props {
  token: TokenConfig
  balance?: WalletBalance
  onPress?: () => void
  showArrow?: boolean
}

export function TokenRow({ token, balance, onPress, showArrow = true }: Props) {
  const formattedBalance = balance?.raw !== undefined
    ? formatBalance(balance.raw, token.decimals, 6)
    : '0'

  const networkLabel = token.network === 'ethereum' ? 'ERC-20' :
    token.network === 'tron' ? 'TRC-20' :
    token.network === 'bitcoin' ? 'BTC' : ''

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.left}>
        <NetworkIcon network={token.id} size={44} />
        <View style={styles.info}>
          <Text style={styles.name}>{token.name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.networkBadge}>
              <Text style={styles.networkLabel}>{networkLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        {balance?.isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <View style={styles.balanceContainer}>
            <Text style={styles.balance}>
              {formattedBalance} {token.symbol}
            </Text>
          </View>
        )}
        {showArrow && onPress && (
          <Text style={styles.arrow}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 4,
  },
  networkBadge: {
    backgroundColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  networkLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  arrow: {
    fontSize: 22,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
})
