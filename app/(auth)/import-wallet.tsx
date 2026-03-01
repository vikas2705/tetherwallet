import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../src/theme/colors'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { validateSeedPhrase } from '../../src/services/wdkService'
import * as storage from '../../src/services/secureStorage'
import { useWalletStore } from '../../src/store/walletStore'

export default function ImportWalletScreen() {
  const [seedInput, setSeedInput] = useState('')
  const [walletName, setWalletName] = useState('Imported Wallet')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'seed' | 'name'>('seed')
  const [wordCount, setWordCount] = useState(0)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const { addWallet, setActiveWalletId } = useWalletStore()

  const handleSeedChange = useCallback((text: string) => {
    setSeedInput(text)
    const trimmed = text.trim()
    const count = trimmed ? trimmed.split(/\s+/).length : 0
    setWordCount(count)
    setIsValid(null) // Reset validation
  }, [])

  const handleValidateSeed = useCallback(async () => {
    const trimmed = seedInput.trim().toLowerCase()
    const valid = await validateSeedPhrase(trimmed)
    setIsValid(valid)

    if (!valid) {
      Alert.alert(
        'Invalid Seed Phrase',
        'Please check your seed phrase. It should be 12 or 24 valid BIP-39 words separated by spaces.',
      )
      return
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setStep('name')
  }, [seedInput])

  const handleImport = useCallback(async () => {
    if (!walletName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your wallet.')
      return
    }

    setIsLoading(true)
    try {
      const trimmedSeed = seedInput.trim().toLowerCase()
      const walletId = storage.generateWalletId()
      const meta: storage.WalletMeta = {
        id: walletId,
        name: walletName.trim(),
        createdAt: Date.now(),
      }

      await storage.saveSeedPhrase(walletId, trimmedSeed)
      await storage.saveWalletMeta(meta)
      await storage.setActiveWalletId(walletId)

      addWallet(meta)
      setActiveWalletId(walletId)

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } catch (err) {
      Alert.alert('Import Failed', `Could not import wallet: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }, [walletName, seedInput, addWallet, setActiveWalletId])

  const wordCountColor =
    wordCount === 12 || wordCount === 24
      ? Colors.success
      : wordCount > 0
      ? Colors.warning
      : Colors.textTertiary

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (step === 'name') setStep('seed')
            else router.back()
          }}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 'seed' ? 'Import Wallet' : 'Name Wallet'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'seed' ? (
            <View style={styles.section}>
              <Text style={styles.title}>Enter Recovery Phrase</Text>
              <Text style={styles.subtitle}>
                Enter your 12 or 24-word BIP-39 seed phrase to restore your wallet.
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.seedInput}
                  value={seedInput}
                  onChangeText={handleSeedChange}
                  placeholder="Enter your seed phrase words separated by spaces..."
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  numberOfLines={6}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  secureTextEntry={false}
                />
                <View style={styles.wordCountRow}>
                  <Text style={[styles.wordCount, { color: wordCountColor }]}>
                    {wordCount} words
                    {wordCount === 12 ? ' ✓' : wordCount === 24 ? ' ✓' : ''}
                  </Text>
                  {isValid === false && (
                    <Text style={styles.invalidText}>Invalid phrase</Text>
                  )}
                </View>
              </View>

              {/* Word grid preview */}
              {wordCount > 0 && (
                <View style={styles.wordPreview}>
                  {seedInput.trim().split(/\s+/).map((word, i) => (
                    <View key={i} style={styles.wordTag}>
                      <Text style={styles.wordTagNum}>{i + 1}</Text>
                      <Text style={styles.wordTagText}>{word}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  🔒 Your seed phrase is stored encrypted on your device only.
                  It never leaves your device.
                </Text>
              </View>

              <PrimaryButton
                title="Continue"
                onPress={handleValidateSeed}
                disabled={wordCount !== 12 && wordCount !== 24}
                size="lg"
                style={{ marginTop: 8 }}
              />
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.title}>Name Your Wallet</Text>
              <Text style={styles.subtitle}>
                Give your imported wallet a name to identify it.
              </Text>

              <View style={styles.nameContainer}>
                <Text style={styles.inputLabel}>Wallet Name</Text>
                <TextInput
                  style={styles.nameInput}
                  value={walletName}
                  onChangeText={setWalletName}
                  placeholder="e.g. My Hardware Backup"
                  placeholderTextColor={Colors.textTertiary}
                  maxLength={30}
                  autoFocus
                />
              </View>

              <PrimaryButton
                title="Import Wallet"
                onPress={handleImport}
                loading={isLoading}
                size="lg"
                style={{ marginTop: 24 }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  back: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    paddingBottom: 60,
  },
  section: {
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  inputContainer: {
    gap: 8,
  },
  seedInput: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 130,
    textAlignVertical: 'top',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  wordCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  invalidText: {
    fontSize: 13,
    color: Colors.error,
  },
  wordPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  wordTag: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wordTagNum: {
    fontSize: 10,
    color: Colors.textTertiary,
    width: 14,
  },
  wordTagText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  warningBox: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  warningText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  nameContainer: {
    gap: 8,
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  nameInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
})
