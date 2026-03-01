import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../../src/theme/colors'
import { PrimaryButton } from '../../src/components/PrimaryButton'

const { width, height } = Dimensions.get('window')

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[Colors.background, '#0D1A16', Colors.background]}
        locations={[0, 0.5, 1]}
        style={styles.container}
      >
        {/* Logo / Hero */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.logo}
            >
              <Text style={styles.logoText}>₮</Text>
            </LinearGradient>
          </View>

          <Text style={styles.appName}>Tether Wallet</Text>
          <Text style={styles.tagline}>
            Your self-custodial multi-chain crypto wallet
          </Text>

          {/* Feature list */}
          <View style={styles.features}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.feature}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <PrimaryButton
            title="Create New Wallet"
            onPress={() => router.push('/(auth)/create-wallet')}
            size="lg"
          />
          <PrimaryButton
            title="Import Existing Wallet"
            onPress={() => router.push('/(auth)/import-wallet')}
            variant="outline"
            size="lg"
            style={styles.importBtn}
          />

          <Text style={styles.disclaimer}>
            Your keys, your crypto. WDK ensures your seed phrase never leaves your device.
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const FEATURES = [
  'ETH, BTC, TRX & USDT support',
  'Biometric authentication',
  'Multiple wallets',
  'Self-custodial — you own your keys',
]

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoContainer: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 8,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 52,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    marginTop: 24,
    gap: 12,
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  featureText: {
    fontSize: 15,
    color: Colors.text,
  },
  actions: {
    gap: 12,
  },
  importBtn: {
    marginTop: 0,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
})
