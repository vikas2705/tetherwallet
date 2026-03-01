/**
 * Polyfills required for WDK and crypto libraries to work in React Native (Hermes).
 * Must be imported at the very top of the app entry point.
 */

// Crypto random values (required by ethers.js, bip39, etc.)
import 'react-native-get-random-values'

// URL polyfill (required for URL parsing in some libraries)
import 'react-native-url-polyfill/auto'

// Buffer polyfill - expose Buffer globally
import { Buffer as BufferPolyfill } from '@craftzdog/react-native-buffer'

declare global {
  // eslint-disable-next-line no-var
  var Buffer: typeof BufferPolyfill
  // eslint-disable-next-line no-var
  var process: typeof import('process')
}

if (typeof global.Buffer === 'undefined') {
  global.Buffer = BufferPolyfill
}

// Process polyfill
if (typeof global.process === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  global.process = require('process')
}
