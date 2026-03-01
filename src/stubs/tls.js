// Stub for Node.js `tls` module – not available in React Native.
// @mempool/electrum-client requires this for TLS transport, but we only use ElectrumWs.
module.exports = {
  connect: () => { throw new Error('tls.connect not supported in React Native') },
  TLSSocket: class TLSSocket {},
};
