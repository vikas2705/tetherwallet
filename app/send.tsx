/**
 * Send screen - complete send flow with address input, amount, fee estimation, and confirmation
 */
import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../src/theme/colors'
import { PrimaryButton } from '../src/components/PrimaryButton'
import { NetworkIcon } from '../src/components/NetworkIcon'
import { useWalletStore } from '../src/store/walletStore'
import { TOKENS, NETWORKS } from '../src/config/networks'
import type { TokenConfig, NetworkId } from '../src/config/networks'
import { isValidAddress } from '../src/utils/validation'
import { parseAmount, formatBalance, formatFee, isValidAmount } from '../src/utils/formatters'
import * as wdk from '../src/services/wdkService'

type Step = 'address' | 'amount' | 'confirm' | 'sent'

export default function SendScreen() {
  const params = useLocalSearchParams<{ address?: string; network?: string; tokenId?: string }>()
  const { addresses, balances } = useWalletStore()

  const [step, setStep] = useState<Step>('address')
  const [toAddress, setToAddress] = useState(params.address ?? '')
  const [amount, setAmount] = useState('')
  const [selectedTokenId, setSelectedTokenId] = useState(
    params.tokenId ?? 'usdt-erc20',
  )
  const [isLoadingFee, setIsLoadingFee] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [feeQuote, setFeeQuote] = useState<wdk.FeeQuote | null>(null)
  const [txHash, setTxHash] = useState('')

  const selectedToken = TOKENS.find((t) => t.id === selectedTokenId) ?? TOKENS[0]
  const balance = balances[selectedTokenId]
  const formattedBalance = balance
    ? formatBalance(balance.raw, selectedToken.decimals, 6)
    : '0'

  // If address is passed from QR scan, pre-detect the right token
  useEffect(() => {
    if (params.address && params.network) {
      const network = params.network as NetworkId
      // Select the native token for the detected network
      const nativeToken = TOKENS.find((t) => t.network === network && t.isNative)
      if (nativeToken) setSelectedTokenId(nativeToken.id)
    }
  }, [params.address, params.network])

  const handleAddressContinue = useCallback(() => {
    if (!toAddress.trim()) {
      Alert.alert('Address Required', 'Please enter a recipient address.')
      return
    }
    if (!isValidAddress(toAddress.trim(), selectedToken.network)) {
      Alert.alert(
        'Invalid Address',
        `Please enter a valid ${NETWORKS[selectedToken.network].name} address.`,
      )
      return
    }
    setStep('amount')
  }, [toAddress, selectedToken])

  const handleGetFeeQuote = useCallback(async () => {
    if (!isValidAmount(amount)) return

    setIsLoadingFee(true)
    setFeeQuote(null)

    try {
      const amountBig = parseAmount(amount, selectedToken.decimals)
      const quote = await wdk.quoteSend(
        selectedToken.network,
        toAddress,
        amountBig,
        selectedToken.isNative ? undefined : selectedToken.contractAddress,
      )
      setFeeQuote(quote)
    } catch (err) {
      console.warn('Fee estimation failed:', err)
      // Provide fallback
      const nativeDecimals = selectedToken.network === 'bitcoin' ? 8 :
        selectedToken.network === 'tron' ? 6 : 18
      const feeSymbol = selectedToken.network === 'bitcoin' ? 'BTC' :
        selectedToken.network === 'tron' ? 'TRX' : 'ETH'
      setFeeQuote({
        fee: 0n,
        feeFormatted: 'Unknown',
        feeSymbol,
        feeDecimals: nativeDecimals,
      })
    } finally {
      setIsLoadingFee(false)
    }
  }, [amount, selectedToken, toAddress])

  const handleAmountContinue = useCallback(async () => {
    if (!isValidAmount(amount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.')
      return
    }

    await handleGetFeeQuote()
    setStep('confirm')
  }, [amount, handleGetFeeQuote])

  const handleSend = useCallback(async () => {
    setIsSending(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)

    try {
      const amountBig = parseAmount(amount, selectedToken.decimals)
      const result = await wdk.sendTransaction(
        selectedToken.network,
        toAddress,
        amountBig,
        selectedToken.isNative ? undefined : selectedToken.contractAddress,
      )

      setTxHash(result.hash)
      setStep('sent')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      const message = String(err).includes('insufficient')
        ? 'Insufficient balance to complete this transaction.'
        : `Transaction failed: ${err}`
      Alert.alert('Transaction Failed', message)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setIsSending(false)
    }
  }, [amount, selectedToken, toAddress])

  const handleUseMax = useCallback(() => {
    if (!balance || balance.raw === 0n) return
    const maxAmount = formatBalance(balance.raw, selectedToken.decimals, 8)
    setAmount(maxAmount)
  }, [balance, selectedToken])

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (step === 'amount') setStep('address')
            else if (step === 'confirm') setStep('amount')
            else router.back()
          }}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Step Indicators */}
        <View style={styles.stepBar}>
          {(['address', 'amount', 'confirm'] as const).map((s, i) => (
            <View key={s} style={styles.stepIndicator}>
              <View style={[
                styles.stepDot,
                step === s && styles.stepDotActive,
                ['amount', 'confirm', 'sent'].indexOf(step) > i && styles.stepDotDone,
              ]}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, step === s && styles.stepLabelActive]}>
                {s === 'address' ? 'To' : s === 'amount' ? 'Amount' : 'Confirm'}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'address' && (
            <StepAddress
              toAddress={toAddress}
              onChangeAddress={setToAddress}
              selectedTokenId={selectedTokenId}
              onSelectToken={setSelectedTokenId}
              tokens={TOKENS}
              onScan={() => router.push('/scan')}
              onContinue={handleAddressContinue}
            />
          )}

          {step === 'amount' && (
            <StepAmount
              amount={amount}
              onChangeAmount={setAmount}
              token={selectedToken}
              balance={formattedBalance}
              onUseMax={handleUseMax}
              onContinue={handleAmountContinue}
              isLoading={isLoadingFee}
            />
          )}

          {step === 'confirm' && (
            <StepConfirm
              toAddress={toAddress}
              amount={amount}
              token={selectedToken}
              feeQuote={feeQuote}
              isLoadingFee={isLoadingFee}
              isSending={isSending}
              onRefreshFee={handleGetFeeQuote}
              onSend={handleSend}
            />
          )}

          {step === 'sent' && (
            <StepSent
              txHash={txHash}
              token={selectedToken}
              amount={amount}
              onDone={() => router.replace('/(tabs)')}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// Step 1: Address
function StepAddress({ toAddress, onChangeAddress, selectedTokenId, onSelectToken, tokens, onScan, onContinue }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Send To</Text>

      {/* Token selector */}
      <View style={styles.tokenSelectorRow}>
        {tokens.map((t: TokenConfig) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tokenChip, selectedTokenId === t.id && styles.tokenChipActive]}
            onPress={() => onSelectToken(t.id)}
          >
            <NetworkIcon network={t.id} size={20} />
            <Text style={[styles.tokenChipText, selectedTokenId === t.id && styles.tokenChipTextActive]}>
              {t.symbol}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.addressInputContainer}>
        <TextInput
          style={styles.addressInput}
          value={toAddress}
          onChangeText={onChangeAddress}
          placeholder="Enter or paste wallet address"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          multiline
        />
        <TouchableOpacity style={styles.scanBtn} onPress={onScan}>
          <Text style={styles.scanIcon}>⊡</Text>
          <Text style={styles.scanBtnText}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      <PrimaryButton
        title="Continue"
        onPress={onContinue}
        disabled={!toAddress.trim()}
        size="lg"
        style={{ marginTop: 16 }}
      />
    </View>
  )
}

// Step 2: Amount
function StepAmount({ amount, onChangeAmount, token, balance, onUseMax, onContinue, isLoading }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Amount</Text>

      <View style={styles.amountCard}>
        <View style={styles.amountHeader}>
          <NetworkIcon network={token.id} size={36} />
          <View>
            <Text style={styles.amountTokenName}>{token.name}</Text>
            <Text style={styles.amountBalance}>Balance: {balance} {token.symbol}</Text>
          </View>
        </View>

        <View style={styles.amountInputRow}>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={onChangeAmount}
            placeholder="0.00"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
            autoFocus
          />
          <Text style={styles.amountSymbol}>{token.symbol}</Text>
        </View>

        <TouchableOpacity style={styles.maxBtn} onPress={onUseMax}>
          <Text style={styles.maxBtnText}>MAX</Text>
        </TouchableOpacity>
      </View>

      <PrimaryButton
        title="Preview Transaction"
        onPress={onContinue}
        disabled={!isValidAmount(amount)}
        loading={isLoading}
        size="lg"
        style={{ marginTop: 16 }}
      />
    </View>
  )
}

// Step 3: Confirm
function StepConfirm({ toAddress, amount, token, feeQuote, isLoadingFee, isSending, onRefreshFee, onSend }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Transaction</Text>

      <LinearGradient
        colors={[Colors.card, Colors.surface]}
        style={styles.confirmCard}
      >
        <ConfirmRow label="To" value={toAddress && typeof toAddress === 'string' ? `${toAddress?.slice(0, 8)}...${toAddress?.slice(-6)}` : ''} mono />
        <ConfirmRow label="Amount" value={`${amount} ${token.symbol}`} highlight />
        <ConfirmRow label="Network" value={NETWORKS[token.network as NetworkId]?.name ?? ''} />
        <ConfirmRow
          label="Network Fee"
          value={
            isLoadingFee
              ? 'Estimating...'
              : feeQuote
              ? `${feeQuote.feeFormatted} ${feeQuote.feeSymbol}`
              : 'Unknown'
          }
          isLoading={isLoadingFee}
        />
      </LinearGradient>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ Double-check the recipient address. Crypto transactions are irreversible.
        </Text>
      </View>

      <TouchableOpacity style={styles.refreshFeeBtn} onPress={onRefreshFee}>
        <Text style={styles.refreshFeeText}>↻ Refresh Fee Estimate</Text>
      </TouchableOpacity>

      <PrimaryButton
        title={isSending ? 'Sending...' : `Send ${amount} ${token.symbol}`}
        onPress={onSend}
        loading={isSending}
        size="lg"
        style={{ marginTop: 8 }}
      />
    </View>
  )
}

function ConfirmRow({ label, value, mono, highlight, isLoading }: {
  label: string; value: string; mono?: boolean; highlight?: boolean; isLoading?: boolean
}) {
  return (
    <View style={styles.confirmRow}>
      <Text style={styles.confirmLabel}>{label}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <Text style={[
          styles.confirmValue,
          mono && styles.confirmValueMono,
          highlight && styles.confirmValueHighlight,
        ]}>
          {value}
        </Text>
      )}
    </View>
  )
}

// Step 4: Sent
function StepSent({ txHash, token, amount, onDone }: any) {
  return (
    <View style={[styles.stepContainer, styles.sentContainer]}>
      <View style={styles.sentIcon}>
        <Text style={styles.sentEmoji}>✓</Text>
      </View>
      <Text style={styles.sentTitle}>Transaction Sent!</Text>
      <Text style={styles.sentSubtitle}>
        {amount} {token.symbol} has been sent successfully
      </Text>

      <View style={styles.txHashCard}>
        <Text style={styles.txHashLabel}>Transaction Hash</Text>
        <Text style={styles.txHashValue} selectable numberOfLines={2}>
          {txHash}
        </Text>
      </View>

      <PrimaryButton
        title="Back to Portfolio"
        onPress={onDone}
        size="lg"
        style={{ marginTop: 24 }}
      />
    </View>
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
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 40,
    gap: 0,
  },
  stepIndicator: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  stepDotDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  stepLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: Colors.primary,
  },
  content: {
    paddingBottom: 60,
  },
  stepContainer: {
    paddingHorizontal: 24,
    gap: 16,
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  tokenSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tokenChipActive: {
    borderColor: Colors.primary + '60',
    backgroundColor: Colors.primaryMuted,
  },
  tokenChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tokenChipTextActive: {
    color: Colors.primary,
  },
  addressInputContainer: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  addressInput: {
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'center',
  },
  scanIcon: {
    fontSize: 18,
    color: Colors.primary,
  },
  scanBtnText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  amountCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountTokenName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  amountBalance: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    padding: 0,
  },
  amountSymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  maxBtn: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  maxBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  confirmCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  confirmValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  confirmValueMono: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  confirmValueHighlight: {
    color: Colors.primary,
    fontSize: 18,
  },
  warningBox: {
    backgroundColor: Colors.warningMuted,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  warningText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  refreshFeeBtn: {
    alignItems: 'center',
    padding: 8,
  },
  refreshFeeText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  sentContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  sentIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.success,
    marginBottom: 16,
  },
  sentEmoji: {
    fontSize: 36,
    color: Colors.success,
  },
  sentTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  sentSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  txHashCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  txHashLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  txHashValue: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
})
