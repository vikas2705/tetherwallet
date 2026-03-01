/**
 * Wallets management screen - create, switch, and delete wallets
 */
import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../src/theme/colors'
import { WalletCard } from '../../src/components/WalletCard'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { useWalletStore, selectActiveWallet } from '../../src/store/walletStore'
import * as storage from '../../src/services/secureStorage'
import * as wdk from '../../src/services/wdkService'
import { loadWalletData } from '../../src/hooks/useWalletInit'
import { useBiometric } from '../../src/hooks/useBiometric'
import { useBalances } from '../../src/hooks/useBalances'

export default function WalletsScreen() {
  const {
    wallets,
    activeWalletId,
    setActiveWalletId,
    removeWallet,
    setAddresses,
    setUnlocked,
  } = useWalletStore()
  const activeWallet = useWalletStore(selectActiveWallet)
  const { refreshBalances } = useBalances()
  const biometric = useBiometric()
  const [isSwitching, setIsSwitching] = useState(false)
  const [switchingTo, setSwitchingTo] = useState<string | null>(null)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [checkingNetworks, setCheckingNetworks] = useState(false)

  useEffect(() => {
    biometric.checkAvailability()
    storage.isBiometricEnabled().then(setBiometricEnabled)
  }, [])

  const handleSwitchWallet = useCallback(async (walletId: string) => {
    if (walletId === activeWalletId || isSwitching) return

    setSwitchingTo(walletId)
    setIsSwitching(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      // Dispose current WDK instance
      wdk.disposeWDK()

      // Update active wallet
      await storage.setActiveWalletId(walletId)
      setActiveWalletId(walletId)
      setAddresses({})

      // Load new wallet data
      await loadWalletData(walletId)
      await refreshBalances()
    } catch (err) {
      Alert.alert('Error', `Failed to switch wallet: ${err}`)
    } finally {
      setIsSwitching(false)
      setSwitchingTo(null)
    }
  }, [activeWalletId, isSwitching, setActiveWalletId, setAddresses, refreshBalances])

  const handleDeleteWallet = useCallback((walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId)
    if (!wallet) return

    Alert.alert(
      'Remove Wallet',
      `Are you sure you want to remove "${wallet.name}"? This will delete the wallet from this device. Make sure you have your seed phrase backed up.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (walletId === activeWalletId) {
                wdk.disposeWDK()
              }
              await storage.deleteWallet(walletId)
              removeWallet(walletId)

              if (walletId === activeWalletId) {
                const remaining = wallets.filter((w) => w.id !== walletId)
                if (remaining.length > 0) {
                  const nextId = remaining[0].id
                  setActiveWalletId(nextId)
                  await loadWalletData(nextId)
                  await refreshBalances()
                } else {
                  setUnlocked(false)
                  router.replace('/(auth)/welcome')
                }
              }
            } catch (err) {
              Alert.alert('Error', `Failed to remove wallet: ${err}`)
            }
          },
        },
      ],
    )
  }, [wallets, activeWalletId, removeWallet, setActiveWalletId, setUnlocked, refreshBalances])

  const handleToggleBiometric = useCallback(async (enabled: boolean) => {
    if (enabled && !biometric.isAvailable) {
      Alert.alert(
        'Biometric Unavailable',
        'Biometric authentication is not available on this device. Please set up Face ID or fingerprint in your device settings.',
      )
      return
    }

    await storage.setBiometricEnabled(enabled)
    setBiometricEnabled(enabled)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [biometric.isAvailable])

  const biometricLabel = biometric.biometricType === 'facial'
    ? 'Face ID'
    : biometric.biometricType === 'fingerprint'
    ? 'Fingerprint'
    : 'Biometric'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Wallets</Text>

        {/* Wallet list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Wallets</Text>
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              isActive={wallet.id === activeWalletId}
              onPress={() => handleSwitchWallet(wallet.id)}
              onDelete={wallets.length > 1 ? () => handleDeleteWallet(wallet.id) : undefined}
            />
          ))}
        </View>

        {/* Add wallet buttons */}
        <View style={styles.addSection}>
          <PrimaryButton
            title="Create New Wallet"
            onPress={() => router.push('/(auth)/create-wallet')}
            variant="outline"
            size="md"
          />
          <PrimaryButton
            title="Import Wallet"
            onPress={() => router.push('/(auth)/import-wallet')}
            variant="secondary"
            size="md"
          />
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{biometricLabel} Unlock</Text>
                <Text style={styles.settingDesc}>
                  {biometric.isAvailable
                    ? `Use ${biometricLabel} to unlock your wallet`
                    : 'Not available on this device'}
                </Text>
              </View>
              <Switch
                value={biometricEnabled && biometric.isAvailable}
                onValueChange={handleToggleBiometric}
                disabled={!biometric.isAvailable}
                trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                thumbColor={biometricEnabled ? Colors.primary : Colors.textSecondary}
                ios_backgroundColor={Colors.border}
              />
            </View>
          </View>
        </View>

        {/* Network status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <TouchableOpacity
            style={styles.networkStatusBtn}
            onPress={async () => {
              setCheckingNetworks(true)
              try {
                const results = await wdk.checkNetworkConnectivity()
                const lines = results.map(
                  (r) => `${r.network}: ${r.ok ? '✓ Connected' + (r.detail ? ` (${r.detail})` : '') : '✗ ' + (r.error ?? 'Failed')}`,
                )
                Alert.alert('Network status', lines.join('\n'))
              } catch (e) {
                Alert.alert('Network check failed', e instanceof Error ? e.message : String(e))
              } finally {
                setCheckingNetworks(false)
              }
            }}
            disabled={checkingNetworks}
          >
            {checkingNetworks ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.networkStatusBtnText}>Check network connectivity</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Tether Wallet</Text>
            <Text style={styles.aboutText}>
              Built with Tether WDK — open source, self-custodial, multi-chain.
            </Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    paddingTop: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  addSection: {
    gap: 10,
    marginBottom: 24,
  },
  settingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  settingDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  aboutCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  aboutVersion: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  networkStatusBtn: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  networkStatusBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
})
