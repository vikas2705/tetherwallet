import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../theme/colors'
import type { WalletMeta } from '../services/secureStorage'

interface Props {
  wallet: WalletMeta
  isActive?: boolean
  onPress?: () => void
  onDelete?: () => void
  compact?: boolean
}

export function WalletCard({ wallet, isActive, onPress, onDelete, compact }: Props) {
  const initial = wallet.name.charAt(0).toUpperCase()

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, isActive && styles.compactCardActive]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, isActive && styles.avatarActive]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={[styles.compactName, isActive && styles.compactNameActive]} numberOfLines={1}>
          {wallet.name}
        </Text>
        {isActive && <View style={styles.activeDot} />}
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={isActive ? [Colors.primary + '20', Colors.card] : [Colors.card, Colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, isActive && styles.cardActive]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, isActive && styles.avatarActive]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.walletName}>{wallet.name}</Text>
            <Text style={styles.walletDate}>
              Created {new Date(wallet.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>

        {onDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteText}>Remove</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardActive: {
    borderColor: Colors.primary + '60',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary + '50',
  },
  avatarActive: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary + '70',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  cardInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  walletDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  activeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  // Compact styles for header switcher
  compactCard: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  compactCardActive: {
    backgroundColor: Colors.primaryMuted,
  },
  compactName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    maxWidth: 70,
  },
  compactNameActive: {
    color: Colors.primary,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
})
