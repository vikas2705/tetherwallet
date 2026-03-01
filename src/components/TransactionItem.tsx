import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors } from '../theme/colors'
import { NetworkIcon } from './NetworkIcon'
import { formatBalance, formatTxDate, shortenAddress, shortenTxHash } from '../utils/formatters'
import type { TxTransfer } from '../services/wdkService'
import { TOKENS } from '../config/networks'

interface Props {
  transaction: TxTransfer
  onPress?: () => void
}

export function TransactionItem({ transaction, onPress }: Props) {
  const token = TOKENS.find((t) => t.id === transaction.tokenId)
  const decimals = token?.decimals ?? 18
  const symbol = token?.symbol ?? ''

  const isIncoming = transaction.direction === 'incoming'
  const amountColor = isIncoming ? Colors.success : Colors.text
  const amountPrefix = isIncoming ? '+' : '-'

  const formattedAmount = formatBalance(transaction.amount, decimals, 6)
  const counterparty = isIncoming
    ? transaction.from
    : transaction.to

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        <NetworkIcon network={transaction.tokenId} size={40} />
        <View style={[styles.directionBadge, isIncoming ? styles.incoming : styles.outgoing]}>
          <Text style={styles.directionArrow}>{isIncoming ? '↓' : '↑'}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.title}>
          {isIncoming ? 'Received' : 'Sent'} {symbol}
        </Text>
        <Text style={styles.subtitle}>
          {counterparty ? shortenAddress(counterparty) : shortenTxHash(transaction.hash)}
        </Text>
        {transaction.timestamp > 0 && (
          <Text style={styles.time}>{formatTxDate(transaction.timestamp)}</Text>
        )}
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}{formattedAmount} {symbol}
        </Text>
        <View style={[styles.statusBadge, transaction.confirmed ? styles.confirmed : styles.pending]}>
          <Text style={styles.statusText}>
            {transaction.confirmed ? 'Confirmed' : 'Pending'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  iconContainer: {
    position: 'relative',
  },
  directionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incoming: {
    backgroundColor: Colors.successMuted,
    borderColor: Colors.success,
    borderWidth: 1,
  },
  outgoing: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  directionArrow: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '700',
  },
  details: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  time: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  confirmed: {
    backgroundColor: Colors.successMuted,
  },
  pending: {
    backgroundColor: Colors.warningMuted,
  },
  statusText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
})
