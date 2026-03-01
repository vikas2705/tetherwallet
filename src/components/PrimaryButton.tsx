import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../theme/colors'

interface Props {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  style?: object
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon,
  style,
}: Props) {
  const isDisabled = disabled || loading

  const sizeStyles = {
    sm: { height: 40, borderRadius: 10, fontSize: 14 },
    md: { height: 52, borderRadius: 14, fontSize: 16 },
    lg: { height: 60, borderRadius: 16, fontSize: 18 },
  }

  const { height, borderRadius, fontSize } = sizeStyles[size]

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[{ borderRadius }, style]}
      >
        <LinearGradient
          colors={isDisabled ? ['#2A4A42', '#1E3D35'] : [Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, { height, borderRadius }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <View style={styles.content}>
              {icon && <View style={styles.icon}>{icon}</View>}
              <Text style={[styles.text, styles.primaryText, { fontSize }]}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  const variantStyles = {
    secondary: {
      bg: Colors.card,
      border: Colors.border,
      textColor: Colors.text,
    },
    outline: {
      bg: 'transparent',
      border: Colors.primary,
      textColor: Colors.primary,
    },
    danger: {
      bg: Colors.errorMuted,
      border: Colors.error,
      textColor: Colors.error,
    },
  }

  const vs = variantStyles[variant as 'secondary' | 'outline' | 'danger']

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          height,
          borderRadius,
          backgroundColor: vs.bg,
          borderWidth: 1,
          borderColor: vs.border,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.textColor} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, { fontSize, color: vs.textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryText: {
    color: Colors.textInverse,
  },
})
