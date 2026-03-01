# Tether Wallet — Process & AI Tools Documentation

## AI Tools Used

**Claude Code (claude-sonnet-4-6)** by Anthropic — an agentic coding assistant that works in the terminal, reads documentation, writes and edits files, and runs commands.

---

## How I Approached the Challenge

### 1. Breaking Down Requirements

Before writing any code, I had Claude fetch and analyze the complete Tether WDK documentation at `docs.wdk.tether.io` and the `wdk-react-native-core` GitHub repository. This gave a clear picture of:

- Available WDK packages and their APIs
- Two integration paths (direct modules vs. Bare thread/worklet)
- Transaction history via the Indexer API
- Network support (Ethereum, Bitcoin, TRON)

### 2. Key Architectural Decision: Direct WDK Integration

The task note explicitly mentioned that WDK can be used *without* a Bare thread by installing modules directly. After testing the WDK in Node.js and verifying all three wallet managers (EVM, BTC, TRON) worked correctly, I chose the direct integration approach because:

- Simpler dependency graph (no `react-native-bare-kit` native module)
- Works in Expo managed workflow without ejecting
- Metro bundler handles polyfill resolution cleanly

**Critical polyfill solution**: The BTC wallet uses `sodium-universal` which has a `browser` field in package.json mapping `sodium-native → sodium-javascript`. This means Metro automatically uses the pure-JS fallback — no custom patching required. For Bitcoin networking, I used `ElectrumWs` (WebSocket transport) instead of TCP/TLS, which is natively supported in React Native.

### 3. Implementation Order

1. **Project scaffolding** — Expo 55 blank TypeScript template, configured `expo-router` for file-based routing
2. **Dependency installation** — WDK modules + Expo libraries + polyfills
3. **Metro config** — `browserField: true`, `unstable_enablePackageExports: true`, sodium-native → sodium-javascript resolver override
4. **Core services** — `wdkService.ts` (WDK wrapper with lazy dynamic imports), `secureStorage.ts` (Expo SecureStore + AsyncStorage), `indexerApi.ts` (Indexer REST client)
5. **State management** — Zustand store for wallets, balances, addresses, transactions
6. **Theme & config** — Color palette, network/token configs
7. **Screens** — Auth flow → Main tabs → Modal screens
8. **TypeScript validation** — Zero-error `tsc --noEmit` check

### 4. Notable WDK Feedback

**Positives:**
- Clean, chainable API (`wdk.registerWallet(...).registerWallet(...)`)
- `ElectrumWs` transport for BTC is well-designed for browser/RN environments
- Excellent documentation with concrete Node.js examples
- `quoteSendTransaction` / `quoteTransfer` for fee estimation is a great DX pattern

**Pain Points:**
- `wdk-react-native-core` requires `react-native-bare-kit` (native module), making it harder to use in Expo managed workflow. The "direct integration" tip in the task description was crucial for finding a simpler path.
- The `@tetherto/wdk-react-native-core` package is GitHub-only (not on npm), making installation less discoverable.
- ESM-only modules require `unstable_enablePackageExports: true` in Metro, which isn't obvious.
- Transaction history for EVM/TRON requires a separate Indexer API key — there's no built-in `getTransfers()` like BTC has.

### 5. Key Challenges

**Challenge 1: ESM Modules in Metro Bundler**
The WDK packages are pure ESM (`"type": "module"`). Metro has historically been CommonJS-first. The fix was enabling `unstable_enablePackageExports: true` in `metro.config.js`, which makes Metro respect the `exports` field in `package.json`. This is now stable in Expo 53+.

**Challenge 2: Crypto Polyfills**
WDK's BTC wallet uses `sodium-universal` for BIP32 key derivation, which normally requires native bindings. The solution was:
1. Install `sodium-javascript` explicitly
2. Add a custom `resolveRequest` in Metro config to map `sodium-native → sodium-javascript`
3. This combines with `sodium-universal`'s own `browser` field that already does this mapping in webpack/Metro with `browserField: true`

---

## Code Quality Notes

- **Strict TypeScript** — `tsc --noEmit` passes with zero errors
- **Separation of concerns** — services, hooks, store, and UI are clearly separated
- **Error handling** — Network failures are caught and reported without crashing
- **Security** — Seed phrases stored in Expo SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` access level
- **Memory safety** — `wdk.dispose()` called when switching wallets to clear private keys from memory
- **Self-custodial** — No seed phrases sent to any server; all key operations are local
