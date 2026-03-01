/**
 * Local proxy for WDK API. Run with: node wdk-proxy-server.js
 * Use when the Expo app gets ERR_NETWORK calling wdk-api.tether.io directly
 * (e.g. simulator/device can't reach the host; Node can).
 *
 * Set in .env: EXPO_PUBLIC_WDK_PROXY_URL=http://YOUR_IP:3000
 * (Use your machine's LAN IP so the phone/simulator can reach it.)
 */

const http = require('http')

const WDK_API = 'https://wdk-api.tether.io'
const API_KEY = process.env.EXPO_PUBLIC_WDK_INDEXER_API_KEY || process.env.WDK_INDEXER_API_KEY || ''

const PORT = Number(process.env.WDK_PROXY_PORT) || 3000

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405)
    res.end()
    return
  }

  const path = req.url?.split('?')[0] ?? ''
  const query = new URLSearchParams(req.url?.split('?')[1] ?? '')

  if (path === '/' || path === '') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      ok: true,
      message: 'WDK proxy',
      endpoints: {
        tokenBalances: 'GET /api/sepolia/token-balances?address=0x...',
      },
    }))
    return
  }

  // GET /api/sepolia/token-balances?address=0x9858effd232b4033e47d90003d41ec34ecaeda94
  if (path === '/api/sepolia/token-balances') {
    const address = query.get('address') || '0x9858effd232b4033e47d90003d41ec34ecaeda94'
    const wdkUrl = `${WDK_API}/api/v1/sepolia/usdt/${address}/token-balances`
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
    if (API_KEY) headers['x-api-key'] = API_KEY

    try {
      const r = await fetch(wdkUrl, { method: 'GET', headers })
      const text = await r.text()
      res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json' })
      res.end(text)
    } catch (e) {
      console.error('Proxy error:', e.message)
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found', path }))
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WDK proxy listening on http://0.0.0.0:${PORT}`)
  console.log(`Use in app: EXPO_PUBLIC_WDK_PROXY_URL=http://YOUR_IP:${PORT}`)
})
