/**
 * QR Code Scanner screen - used to scan recipient addresses
 */
import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { Colors } from '../src/theme/colors'
import { detectNetworkFromAddress } from '../src/utils/validation'

const { width, height } = Dimensions.get('window')
const SCAN_FRAME_SIZE = width * 0.7

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [torch, setTorch] = useState(false)
  const params = useLocalSearchParams<{ returnTo?: string }>()

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission()
    }
  }, [])

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return
      setScanned(true)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Parse the scanned data
      let address = data.trim()

      // Handle payment URIs: bitcoin:bc1q..., ethereum:0x..., tron:T...
      const uriMatch = address.match(/^(?:bitcoin|ethereum|tron):([A-Za-z0-9]+)/i)
      if (uriMatch) {
        address = uriMatch[1]
      }

      const network = detectNetworkFromAddress(address)

      if (network) {
        // Navigate to send screen with the address
        router.replace({
          pathname: '/send',
          params: { address, network },
        })
      } else {
        Alert.alert(
          'Invalid Address',
          'The scanned QR code does not contain a valid crypto address.',
          [
            {
              text: 'Scan Again',
              onPress: () => setScanned(false),
            },
            {
              text: 'Cancel',
              onPress: () => router.back(),
              style: 'cancel',
            },
          ],
        )
      }
    },
    [scanned],
  )

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Allow camera access to scan QR codes for wallet addresses
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      {/* Dark overlay with scan frame cutout */}
      <View style={styles.overlay}>
        {/* Top overlay */}
        <View style={styles.overlayTop} />

        {/* Middle row */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          {/* Scan frame */}
          <View style={styles.scanFrame}>
            {/* Corner decorations */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Scan line */}
            <View style={styles.scanLine} />
          </View>
          <View style={styles.overlaySide} />
        </View>

        {/* Bottom overlay */}
        <View style={styles.overlayBottom}>
          <Text style={styles.scanHint}>
            Point your camera at a crypto wallet QR code
          </Text>
        </View>
      </View>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <TouchableOpacity
          style={[styles.torchBtn, torch && styles.torchBtnActive]}
          onPress={() => setTorch(!torch)}
        >
          <Text style={styles.torchIcon}>{torch ? '💡' : '🔦'}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Manual input option */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.manualBtn}
          onPress={() => router.replace('/send')}
        >
          <Text style={styles.manualBtnText}>Enter Address Manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const CORNER_SIZE = 28
const CORNER_THICKNESS = 4

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  permissionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permissionIcon: {
    fontSize: 60,
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  permissionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  cancelBtn: {
    padding: 12,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    paddingTop: 24,
  },
  scanHint: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: '50%',
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  closeText: {
    fontSize: 16,
    color: '#fff',
  },
  torchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  torchBtnActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  torchIcon: {
    fontSize: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  manualBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  manualBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
})
