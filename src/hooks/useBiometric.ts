/**
 * Biometric authentication hook using expo-local-authentication.
 */

import { useState, useCallback } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import * as storage from '../services/secureStorage'

export interface BiometricState {
  isAvailable: boolean
  isEnabled: boolean
  biometricType: 'fingerprint' | 'facial' | 'iris' | 'none'
  authenticate: () => Promise<boolean>
  checkAvailability: () => Promise<void>
}

export function useBiometric(): BiometricState {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [biometricType, setBiometricType] = useState<BiometricState['biometricType']>('none')

  const checkAvailability = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()
    const available = hasHardware && isEnrolled
    setIsAvailable(available)

    if (available) {
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('facial')
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint')
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('iris')
      }
    }

    const enabled = await storage.isBiometricEnabled()
    setIsEnabled(enabled && available)
  }, [])

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return true // If biometric not available, skip

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your Tether Wallet',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    })

    return result.success
  }, [isAvailable])

  return {
    isAvailable,
    isEnabled,
    biometricType,
    authenticate,
    checkAvailability,
  }
}

/**
 * Check if biometric authentication is possible and enabled
 */
export async function canUseBiometric(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  const isEnrolled = await LocalAuthentication.isEnrolledAsync()
  const enabled = await storage.isBiometricEnabled()
  return hasHardware && isEnrolled && enabled
}

/**
 * Perform biometric authentication
 */
export async function performBiometricAuth(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock your Tether Wallet',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    })
    return result.success
  } catch {
    return false
  }
}
