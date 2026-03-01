import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import * as Clipboard from 'expo-clipboard'
import { Colors } from '../../src/theme/colors'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { generateSeedPhrase } from '../../src/services/wdkService'
import * as storage from '../../src/services/secureStorage'
import { useWalletStore } from '../../src/store/walletStore'

type Step = 'generate' | 'backup' | 'verify' | 'name'

export default function CreateWalletScreen() {
  const [step, setStep] = useState<Step>('generate')
  const [seedPhrase, setSeedPhrase] = useState('')
  const [words, setWords] = useState<string[]>([])
  const [walletName, setWalletName] = useState('My Wallet')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(true)
  const [verifyWords, setVerifyWords] = useState<{ index: number; word: string; answer: string }[]>([])
  const [copied, setCopied] = useState(false)

  const { addWallet, setActiveWalletId, setWallets } = useWalletStore()

  // Generate seed phrase on mount
  useEffect(() => {
    const generate = async () => {
      setIsGenerating(true)
      const phrase = await generateSeedPhrase()
      setSeedPhrase(phrase)
      setWords(phrase.split(' '))
      setIsGenerating(false)
    }
    generate()
  }, [])

  // Set up verification words (verify 3 random words)
  useEffect(() => {
    if (step === 'verify' && words.length > 0) {
      const indices = getRandomIndices(words.length, 3)
      setVerifyWords(
        indices.map((i) => ({ index: i, word: words[i], answer: '' })),
      )
    }
  }, [step, words])

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(seedPhrase)
    setCopied(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setTimeout(() => setCopied(false), 2000)
  }, [seedPhrase])

  const handleVerify = useCallback(() => {
    const allCorrect = verifyWords.every(
      (w) => w.answer.trim().toLowerCase() === w.word.toLowerCase(),
    )
    if (!allCorrect) {
      Alert.alert('Incorrect', 'Some words are wrong. Please check your seed phrase and try again.')
      return
    }
    setStep('name')
  }, [verifyWords])

  const handleCreate = useCallback(async () => {
    if (!walletName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your wallet.')
      return
    }

    setIsLoading(true)
    try {
      const walletId = storage.generateWalletId()
      const meta: storage.WalletMeta = {
        id: walletId,
        name: walletName.trim(),
        createdAt: Date.now(),
      }

      await storage.saveSeedPhrase(walletId, seedPhrase)
      await storage.saveWalletMeta(meta)
      await storage.setActiveWalletId(walletId)

      addWallet(meta)
      setActiveWalletId(walletId)

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Navigate to main app
      router.replace('/(tabs)')
    } catch (err) {
      Alert.alert('Error', `Failed to create wallet: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }, [walletName, seedPhrase, addWallet, setActiveWalletId])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (step === 'backup') setStep('generate')
          else if (step === 'verify') setStep('backup')
          else if (step === 'name') setStep('verify')
          else router.back()
        }}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.steps}>
          {(['generate', 'backup', 'verify', 'name'] as Step[]).map((s, i) => (
            <View
              key={s}
              style={[
                styles.step,
                step === s && styles.stepActive,
                ['backup', 'verify', 'name'].indexOf(step) > i && styles.stepDone,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'generate' && (
          <StepGenerate
            isGenerating={isGenerating}
            words={words}
            onCopy={handleCopy}
            copied={copied}
            onContinue={() => setStep('backup')}
          />
        )}

        {step === 'backup' && (
          <StepBackup
            words={words}
            onCopy={handleCopy}
            copied={copied}
            onContinue={() => setStep('verify')}
          />
        )}

        {step === 'verify' && (
          <StepVerify
            verifyWords={verifyWords}
            onUpdateAnswer={(index: number, answer: string) =>
              setVerifyWords((prev) =>
                prev.map((w) => (w.index === index ? { ...w, answer } : w)),
              )
            }
            onContinue={handleVerify}
          />
        )}

        {step === 'name' && (
          <StepName
            walletName={walletName}
            onChangeName={setWalletName}
            onCreate={handleCreate}
            isLoading={isLoading}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// Step: Generate - show seed phrase
function StepGenerate({ isGenerating, words, onCopy, copied, onContinue }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Recovery Phrase</Text>
      <Text style={styles.stepSubtitle}>
        Write down these 12 words in order. This is the only way to recover your wallet.
      </Text>

      {isGenerating ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
      ) : (
        <>
          <View style={styles.seedGrid}>
            {words.map((word: string, i: number) => (
              <View key={i} style={styles.wordCard}>
                <Text style={styles.wordNum}>{i + 1}</Text>
                <Text style={styles.wordText}>{word}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.copyBtn} onPress={onCopy}>
            <Text style={styles.copyBtnText}>{copied ? '✓ Copied!' : 'Copy to Clipboard'}</Text>
          </TouchableOpacity>

          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Never Share This Phrase</Text>
            <Text style={styles.warningText}>
              Anyone with your recovery phrase has full access to your funds.
              Store it safely offline.
            </Text>
          </View>

          <PrimaryButton
            title="I've Saved My Phrase"
            onPress={onContinue}
            size="lg"
            style={{ marginTop: 8 }}
          />
        </>
      )}
    </View>
  )
}

// Step: Backup confirmation
function StepBackup({ words, onCopy, copied, onContinue }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Backup</Text>
      <Text style={styles.stepSubtitle}>
        Make sure you've written down all 12 words before proceeding. You'll need to verify them next.
      </Text>

      <View style={styles.seedGrid}>
        {words.map((word: string, i: number) => (
          <View key={i} style={styles.wordCard}>
            <Text style={styles.wordNum}>{i + 1}</Text>
            <Text style={styles.wordText}>{word}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton
        title="Verify My Backup"
        onPress={onContinue}
        size="lg"
        style={{ marginTop: 16 }}
      />
    </View>
  )
}

// Step: Verify seed phrase
function StepVerify({ verifyWords, onUpdateAnswer, onContinue }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Verify Recovery Phrase</Text>
      <Text style={styles.stepSubtitle}>
        Enter the missing words from your recovery phrase to confirm you've backed it up.
      </Text>

      <View style={styles.verifyContainer}>
        {verifyWords.map((item: any) => (
          <View key={item.index} style={styles.verifyItem}>
            <Text style={styles.verifyLabel}>Word #{item.index + 1}</Text>
            <TextInput
              style={styles.verifyInput}
              value={item.answer}
              onChangeText={(text) => onUpdateAnswer(item.index, text)}
              placeholder={`Enter word ${item.index + 1}`}
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ))}
      </View>

      <PrimaryButton
        title="Verify & Continue"
        onPress={onContinue}
        size="lg"
        style={{ marginTop: 24 }}
      />
    </View>
  )
}

// Step: Name wallet
function StepName({ walletName, onChangeName, onCreate, isLoading }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Name Your Wallet</Text>
      <Text style={styles.stepSubtitle}>
        Give your wallet a name to identify it. You can create multiple wallets.
      </Text>

      <View style={styles.nameContainer}>
        <Text style={styles.inputLabel}>Wallet Name</Text>
        <TextInput
          style={styles.nameInput}
          value={walletName}
          onChangeText={onChangeName}
          placeholder="e.g. My Main Wallet"
          placeholderTextColor={Colors.textTertiary}
          maxLength={30}
          autoFocus
        />
      </View>

      <PrimaryButton
        title="Create Wallet"
        onPress={onCreate}
        loading={isLoading}
        size="lg"
        style={{ marginTop: 24 }}
      />
    </View>
  )
}

function getRandomIndices(max: number, count: number): number[] {
  const indices: number[] = []
  while (indices.length < count) {
    const i = Math.floor(Math.random() * max)
    if (!indices.includes(i)) indices.push(i)
  }
  return indices.sort((a, b) => a - b)
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
  },
  steps: {
    flexDirection: 'row',
    gap: 6,
  },
  step: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  stepActive: {
    backgroundColor: Colors.primary,
  },
  stepDone: {
    backgroundColor: Colors.primary + '80',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  seedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  wordCard: {
    width: '30%',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordNum: {
    fontSize: 11,
    color: Colors.textTertiary,
    width: 16,
  },
  wordText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  copyBtn: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  copyBtnText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: Colors.warningMuted,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
    gap: 6,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.warning,
  },
  warningText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  verifyContainer: {
    gap: 16,
    marginTop: 8,
  },
  verifyItem: {
    gap: 6,
  },
  verifyLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  verifyInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
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
