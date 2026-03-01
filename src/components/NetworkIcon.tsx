import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { NetworkId } from '../config/networks'
import { Colors } from '../theme/colors'

interface Props {
  network: NetworkId | string
  size?: number
  style?: object
}

const NETWORK_COLORS: Record<string, string> = {
  ethereum: Colors.ethereum,
  bitcoin: Colors.bitcoin,
  tron: Colors.tron,
  eth: Colors.ethereum,
  btc: Colors.bitcoin,
  trx: Colors.tron,
  usdt: Colors.usdt,
}

const NETWORK_SYMBOLS: Record<string, string> = {
  ethereum: 'Ξ',
  bitcoin: '₿',
  tron: '⚡',
  eth: 'Ξ',
  btc: '₿',
  trx: '⚡',
  usdt: '₮',
  'usdt-erc20': '₮',
  'usdt-trc20': '₮',
}

const NETWORK_LABELS: Record<string, string> = {
  ethereum: 'ETH',
  bitcoin: 'BTC',
  tron: 'TRX',
  'usdt-erc20': 'U',
  'usdt-trc20': 'U',
}

export function NetworkIcon({ network, size = 40, style }: Props) {
  const color = NETWORK_COLORS[network] ?? Colors.textSecondary
  const symbol = NETWORK_SYMBOLS[network] ?? NETWORK_LABELS[network] ?? '?'
  const fontSize = size * 0.45

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + '25',
          borderColor: color + '50',
        },
        style,
      ]}
    >
      <Text style={[styles.symbol, { fontSize, color }]}>{symbol}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  symbol: {
    fontWeight: '700',
  },
})
