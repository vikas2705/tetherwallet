/**
 * Receive screen - shows QR code and wallet address for a specific network/token
 */
import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import QRCode from 'react-native-qrcode-svg'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { Colors } from '../src/theme/colors'
import { PrimaryButton } from '../src/components/PrimaryButton'
import { useWalletStore } from '../src/store/walletStore'
import { TOKENS, NETWORKS } from '../src/config/networks'
import { NetworkIcon } from '../src/components/NetworkIcon'
import type { NetworkId } from '../src/config/networks'

export default function ReceiveScreen() {
  const params = useLocalSearchParams<{ tokenId?: string; network?: string }>()
  const { addresses } = useWalletStore()
  const [copied, setCopied] = useState(false)

  // Determine which network/token to show
  const tokenId = params.tokenId ?? 'usdt-erc20'
  const token = TOKENS.find((t) => t.id === tokenId) ?? TOKENS[0]
  const network = (params.network as NetworkId) ?? token.network
  const address = addresses[network] ?? ''

  const [selectedTokenId, setSelectedTokenId] = useState(tokenId)
  const selectedToken = TOKENS.find((t) => t.id === selectedTokenId) ?? token
  const selectedAddress = addresses[selectedToken.network] ?? ''

  const handleCopy = useCallback(async () => {
    if (!selectedAddress) return
    await Clipboard.setStringAsync(selectedAddress)
    setCopied(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setTimeout(() => setCopied(false), 2000)
  }, [selectedAddress])

  const handleShare = useCallback(async () => {
    if (!selectedAddress) return
    try {
      await Share.share({
        message: `My ${selectedToken.symbol} address: ${selectedAddress}`,
        title: `${selectedToken.symbol} Address`,
      })
    } catch (err) {
      // User cancelled
    }
  }, [selectedAddress, selectedToken])

  const networkConfig = NETWORKS[selectedToken.network]

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Token selector */}
        <View style={styles.tokenSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TOKENS.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.tokenTab,
                  selectedTokenId === t.id && styles.tokenTabActive,
                ]}
                onPress={() => setSelectedTokenId(t.id)}
              >
                <NetworkIcon network={t.id} size={24} />
                <Text style={[styles.tokenTabText, selectedTokenId === t.id && styles.tokenTabTextActive]}>
                  {t.symbol}
                </Text>
                {t.network !== 'bitcoin' && (
                  <Text style={styles.tokenTabNetwork}>
                    {t.network === 'ethereum' ? 'ERC-20' : 'TRC-20'}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedAddress ? (
          <>
            {/* QR Code */}
            <View style={styles.qrCard}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={selectedAddress}
                  size={220}
                  backgroundColor="white"
                  color="black"
                />
              </View>
              <View style={styles.tokenInfo}>
                <NetworkIcon network={selectedToken.id} size={32} />
                <View>
                  <Text style={styles.tokenName}>{selectedToken.name}</Text>
                  <Text style={styles.networkName}>
                    {networkConfig?.name} Network
                  </Text>
                </View>
              </View>
            </View>

            {/* Address */}
            <View style={styles.addressCard}>
              <Text style={styles.addressLabel}>Wallet Address</Text>
              <Text style={styles.addressText} selectable>
                {selectedAddress}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <PrimaryButton
                title={copied ? '✓ Copied!' : 'Copy Address'}
                onPress={handleCopy}
                size="lg"
              />
              <PrimaryButton
                title="Share"
                onPress={handleShare}
                variant="outline"
                size="lg"
              />
            </View>

            {/* Warning */}
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                ⚠️ Only send {selectedToken.symbol} on the{' '}
                <Text style={{ color: Colors.primary, fontWeight: '700' }}>
                  {networkConfig?.name}
                </Text>{' '}
                network to this address. Sending other tokens or using wrong networks
                may result in permanent loss.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.noAddress}>
            <Text style={styles.noAddressTitle}>Address Not Available</Text>
            <Text style={styles.noAddressText}>
              Load your wallet to see the {selectedToken.name} address
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

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
    paddingVertical: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  tokenSelector: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  tokenTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginRight: 8,
  },
  tokenTabActive: {
    borderColor: Colors.primary + '60',
    backgroundColor: Colors.primaryMuted,
  },
  tokenTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tokenTabTextActive: {
    color: Colors.primary,
  },
  tokenTabNetwork: {
    fontSize: 11,
    color: Colors.textTertiary,
    backgroundColor: Colors.border,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qrCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrWrapper: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  networkName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addressCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addressText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    fontFamily: 'monospace',
    letterSpacing: 0.3,
  },
  actions: {
    gap: 10,
  },
  warning: {
    backgroundColor: Colors.warningMuted,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  warningText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  noAddress: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  noAddressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  noAddressText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
})
