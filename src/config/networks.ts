export type NetworkId = 'ethereum' | 'bitcoin' | 'tron' | 'sepolia'

export interface NetworkConfig {
  id: NetworkId
  name: string
  symbol: string
  decimals: number
  color: string
  icon: string
  // EVM config
  chainId?: number
  rpcUrl?: string
  // BTC config
  btcHost?: string
  btcPort?: number
  btcWsUrl?: string
  // TRON config
  tronProvider?: string
}

export interface TokenConfig {
  id: string
  name: string
  symbol: string
  decimals: number
  network: NetworkId
  contractAddress?: string
  isNative: boolean
  color: string
  icon: string
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    color: '#627EEA',
    icon: 'eth',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
  },
  sepolia: {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    decimals: 18,
    color: '#A78BF5',
    icon: 'eth',
    chainId: 11155111,
    rpcUrl: 'https://ethereum-sepolia.publicnode.com',
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    color: '#F7931A',
    icon: 'btc',
    // Use WSS Electrum endpoint for React Native WebSocket compatibility
    btcWsUrl: 'wss://electrum.blockstream.info:50004',
    btcHost: 'electrum.blockstream.info',
    btcPort: 50001,
  },
  tron: {
    id: 'tron',
    name: 'TRON',
    symbol: 'TRX',
    decimals: 6,
    color: '#FF0013',
    icon: 'trx',
    tronProvider: 'https://api.trongrid.io',
  },
}

export const TOKENS: TokenConfig[] = [
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    network: 'ethereum',
    isNative: true,
    color: '#627EEA',
    icon: 'eth',
  },
  {
    id: 'usdt-erc20',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    network: 'ethereum',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    isNative: false,
    color: '#26A17B',
    icon: 'usdt',
  },
  {
    id: 'sepolia-eth',
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
    network: 'sepolia',
    isNative: true,
    color: '#A78BF5',
    icon: 'eth',
  },
  {
    id: 'usdt-sepolia',
    name: 'Tether USD (Sepolia)',
    symbol: 'USDT',
    decimals: 6,
    network: 'sepolia',
    // Official Tether USDT on Sepolia testnet
    contractAddress: '0xd077a400968890eacc75cdc901f0356c943e4fdb',
    isNative: false,
    color: '#26A17B',
    icon: 'usdt',
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    network: 'bitcoin',
    isNative: true,
    color: '#F7931A',
    icon: 'btc',
  },
  {
    id: 'trx',
    name: 'TRON',
    symbol: 'TRX',
    decimals: 6,
    network: 'tron',
    isNative: true,
    color: '#FF0013',
    icon: 'trx',
  },
  {
    id: 'usdt-trc20',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    network: 'tron',
    contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    isNative: false,
    color: '#26A17B',
    icon: 'usdt',
  },
]

export function getNetworkTokens(networkId: NetworkId): TokenConfig[] {
  return TOKENS.filter((t) => t.network === networkId)
}

export function getTokenById(tokenId: string): TokenConfig | undefined {
  return TOKENS.find((t) => t.id === tokenId)
}
