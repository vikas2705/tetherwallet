import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../../src/theme/colors'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { performBiometricAuth } from '../../src/hooks/useBiometric'
import { useWalletStore } from '../../src/store/walletStore'
import { loadWalletData } from '../../src/hooks/useWalletInit'

export default function BiometricScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const { setUnlocked, activeWalletId } = useWalletStore()

  const authenticate = useCallback(async () => {
    if (isAuthenticating) return
    setIsAuthenticating(true)

    try {
      const success = await performBiometricAuth()

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

        // Load wallet data
        if (activeWalletId) {
          try {
            await loadWalletData(activeWalletId)
          } catch (err) {
            console.warn('Could not load wallet data:', err)
          }
        }

        setUnlocked(true)
        router.replace('/(tabs)')
      } else {
        setAttempts((prev) => prev + 1)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

        if (attempts >= 2) {
          Alert.alert(
            'Too Many Attempts',
            'Biometric authentication failed multiple times.',
            [
              {
                text: 'Use Passcode',
                onPress: handleSkip,
              },
            ],
          )
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
    } finally {
      setIsAuthenticating(false)
    }
  }, [isAuthenticating, attempts, activeWalletId, setUnlocked])

  const handleSkip = useCallback(async () => {
    // Allow access without biometric (user has device passcode as fallback)
    if (activeWalletId) {
      try {
        await loadWalletData(activeWalletId)
      } catch (err) {
        console.warn('Could not load wallet data:', err)
      }
    }
    setUnlocked(true)
    router.replace('/(tabs)')
  }, [activeWalletId, setUnlocked])

  // Auto-trigger biometric on mount
  useEffect(() => {
    const timer = setTimeout(authenticate, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[Colors.background, '#0D1A16', Colors.background]}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[Colors.primary + '30', Colors.primary + '10']}
              style={styles.iconBg}
            >
              <Text style={styles.icon}>🔐</Text>
            </LinearGradient>
            <View style={[styles.ripple, styles.ripple1]} />
            <View style={[styles.ripple, styles.ripple2]} />
          </View>

          <Text style={styles.title}>Unlock Your Wallet</Text>
          <Text style={styles.subtitle}>
            Use biometrics to securely access your Tether Wallet
          </Text>

          {attempts > 0 && (
            <View style={styles.attemptsBox}>
              <Text style={styles.attemptsText}>
                Authentication failed. {3 - attempts} attempts remaining.
              </Text>
            </View>
          )}

          <PrimaryButton
            title={isAuthenticating ? 'Authenticating...' : 'Authenticate'}
            onPress={authenticate}
            loading={isAuthenticating}
            size="lg"
            style={{ marginTop: 16 }}
          />

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Use Passcode Instead</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  icon: {
    fontSize: 44,
  },
  ripple: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  ripple1: {
    width: 140,
    height: 140,
  },
  ripple2: {
    width: 180,
    height: 180,
    borderColor: Colors.primary + '10',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  attemptsBox: {
    backgroundColor: Colors.errorMuted,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  attemptsText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  skipBtn: {
    marginTop: 12,
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
})
