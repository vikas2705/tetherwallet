/**
 * App entry point - determines where to route the user.
 * Checks for existing wallets and biometric settings to decide initial screen.
 */
import React, { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '../src/theme/colors'
import { useWalletInit } from '../src/hooks/useWalletInit'
import { useWalletStore } from '../src/store/walletStore'
import * as storage from '../src/services/secureStorage'
import { canUseBiometric } from '../src/hooks/useBiometric'

export default function IndexScreen() {
  const { isInitialized, wallets } = useWalletStore()

  useWalletInit()

  useEffect(() => {
    if (!isInitialized) return

    const navigate = async () => {
      if (wallets.length === 0) {
        // No wallets - go to welcome screen
        router.replace('/(auth)/welcome')
        return
      }

      // Has wallets - check if biometric is enabled
      const useBio = await canUseBiometric()
      if (useBio) {
        router.replace('/(auth)/biometric')
      } else {
        // Skip biometric, go straight to main app
        router.replace('/(tabs)')
      }
    }

    navigate()
  }, [isInitialized, wallets.length])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
