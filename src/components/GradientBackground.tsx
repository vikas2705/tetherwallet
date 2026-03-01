import React from 'react'
import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../theme/colors'

interface Props {
  children: React.ReactNode
  style?: object
  variant?: 'default' | 'card' | 'header'
}

export function GradientBackground({ children, style, variant = 'default' }: Props) {
  if (variant === 'card') {
    return (
      <LinearGradient
        colors={['#1C1C2A', '#13131E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, style]}
      >
        {children}
      </LinearGradient>
    )
  }

  if (variant === 'header') {
    return (
      <LinearGradient
        colors={[Colors.primary + '20', Colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.container, style]}
      >
        {children}
      </LinearGradient>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
