// Stub for Node.js `net` module – not available in React Native.
// @mempool/electrum-client requires this for TCP transport, but we only use ElectrumWs.
module.exports = {
  createConnection: () => { throw new Error('net.createConnection not supported in React Native') },
  Socket: class Socket {},
};
