const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Enable unstable_enablePackageExports so Metro respects the "exports" field in package.json
config.resolver.unstable_enablePackageExports = true

// Configure resolver to handle browser-compatible builds for crypto packages
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Sodium: use sodium-javascript (pure JS) instead of sodium-native (native bindings)
  if (moduleName === 'sodium-native') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/sodium-javascript/index.js'),
      type: 'sourceFile',
    }
  }
  // tronweb: force the browser bundle instead of the Node.js one
  if (moduleName === 'tronweb') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/tronweb/dist/TronWeb.js'),
      type: 'sourceFile',
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

// Add extra node modules for polyfills
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve('stream-browserify'),
  events: require.resolve('events'),
  process: require.resolve('process'),
  path: require.resolve('path-browserify'),
  buffer: require.resolve('@craftzdog/react-native-buffer'),
  Buffer: require.resolve('@craftzdog/react-native-buffer'),
  // Stubs for Node.js-only modules used by @mempool/electrum-client (TCP transport).
  // We use ElectrumWs (WebSocket) so these are never called at runtime.
  net: path.resolve(__dirname, 'src/stubs/net.js'),
  tls: path.resolve(__dirname, 'src/stubs/tls.js'),
}

// Support for package.json browser field
config.resolver.browserField = true

// Ensure Metro transforms ESM modules
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
}

// Support for .cjs files
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
]

module.exports = config
