export const Colors = {
  // Backgrounds
  background: '#0A0A0F',
  surface: '#13131A',
  card: '#1C1C27',
  cardHover: '#23233A',
  border: '#2A2A3D',
  borderLight: '#333350',

  // Brand - Tether Green
  primary: '#00D4A9',
  primaryDark: '#00A882',
  primaryLight: '#00FFD0',
  primaryMuted: 'rgba(0,212,169,0.15)',

  // Secondary / Purple accent
  secondary: '#7B61FF',
  secondaryMuted: 'rgba(123,97,255,0.15)',

  // Text
  text: '#FFFFFF',
  textSecondary: '#8A8AA0',
  textTertiary: '#5A5A70',
  textInverse: '#0A0A0F',

  // Status
  success: '#00D4A9',
  successMuted: 'rgba(0,212,169,0.15)',
  error: '#FF4E6A',
  errorMuted: 'rgba(255,78,106,0.15)',
  warning: '#FFB547',
  warningMuted: 'rgba(255,181,71,0.15)',

  // Networks
  ethereum: '#627EEA',
  sepolia: '#A78BF5',
  bitcoin: '#F7931A',
  tron: '#FF0013',
  usdt: '#26A17B',

  // Transparent overlays
  overlay: 'rgba(10,10,15,0.85)',
  overlayLight: 'rgba(28,28,39,0.9)',
} as const

export type ColorKey = keyof typeof Colors
