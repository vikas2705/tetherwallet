# Tether Wallet

A polished, self-custodial multi-chain crypto wallet built with React Native (Expo) and the [Tether WDK](https://docs.wdk.tether.io/).

## Features

- 🔐 **Biometric Unlock** — Face ID / Fingerprint authentication
- 🌱 **Create & Import Wallets** — Generate new seed phrases or import existing ones with backup verification
- 👛 **Multiple Wallets** — Create and switch between unlimited wallets
- 💰 **Multi-Chain Balances** — ETH, USDT (ERC-20), BTC, TRX, USDT (TRC-20)
- 📱 **QR Code Display** — Receive screen with network-specific QR codes
- 📷 **QR Scanner** — Camera-based QR scanning for recipient addresses
- ✈️ **Send Flow** — Complete send flow with real-time fee estimation
- 📋 **Transaction History** — Incoming/outgoing transactions via WDK Indexer API + BTC built-in

## Tech Stack

- **Framework**: Expo ~55.0 (React Native 0.83)
- **WDK**: `@tetherto/wdk`, `@tetherto/wdk-wallet-evm`, `@tetherto/wdk-wallet-btc`, `@tetherto/wdk-wallet-tron`
- **Navigation**: Expo Router (file-based routing)
- **State**: Zustand
- **Storage**: Expo SecureStore (seed phrases) + AsyncStorage (metadata)
- **Biometrics**: `expo-local-authentication`
- **Camera**: `expo-camera` (QR scanning)
- **QR Display**: `react-native-qrcode-svg`
- **Data Fetching**: `@tanstack/react-query`

## Supported Networks

| Network | Native Token | Stable Coin |
|---------|-------------|-------------|
| Ethereum | ETH | USDT (ERC-20) |
| Bitcoin | BTC | — |
| TRON | TRX | USDT (TRC-20) |

## Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd TetherWallet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Add your WDK Indexer API key (get it at https://docs.wdk.tether.io/tools/indexer-api/get-started)
   ```

4. **Run the app**
   ```bash
   # Development
   npm run android  # or npm run ios

   # Build APK
   npx expo prebuild --platform android
   cd android && ./gradlew assembleRelease
   ```

## Architecture

```
app/                    # Expo Router screens
├── _layout.tsx         # Root layout (providers)
├── index.tsx           # Entry point (routing logic)
├── (auth)/             # Auth flow screens
│   ├── welcome.tsx     # Welcome / onboarding
│   ├── create-wallet.tsx  # Multi-step wallet creation
│   ├── import-wallet.tsx  # Seed phrase import
│   └── biometric.tsx   # Biometric unlock
├── (tabs)/             # Main app tabs
│   ├── index.tsx       # Portfolio / balances
│   ├── activity.tsx    # Transaction history
│   └── wallets.tsx     # Wallet management
├── receive.tsx         # Receive / QR code
├── send.tsx            # Send flow
└── scan.tsx            # QR scanner

src/
├── components/         # Reusable UI components
├── config/             # Network & token configs
├── hooks/              # Custom React hooks
├── services/           # WDK service, storage, indexer API
├── store/              # Zustand state management
├── theme/              # Colors & design tokens
└── utils/              # Formatters, validation
```

## WDK Integration

The app uses a **direct WDK module integration** (no separate Bare thread). The WDK modules are imported dynamically and run in the React Native JavaScript thread with appropriate polyfills:

- `react-native-get-random-values` — `crypto.getRandomValues`
- `@craftzdog/react-native-buffer` — Node.js `Buffer`
- `sodium-javascript` — Pure JS crypto (replaces `sodium-native`)
- `stream-browserify` — Node.js streams

For Bitcoin, the `ElectrumWs` WebSocket transport is used (instead of TCP) for React Native compatibility.

## AI Tools Used

Built with **Claude Code (claude-sonnet-4-6)** — an agentic coding assistant that:
1. Fetched and analyzed WDK documentation
2. Planned the architecture (direct WDK integration, screen structure, state management)
3. Generated all source code including services, hooks, and screens
4. Verified WDK APIs in Node.js before writing React Native code

## License

MIT
