import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { WebSocketServer } from 'ws'
import os from 'os'

function getLocalLanIp() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const familyV4 = typeof net.family === 'string' ? net.family === 'IPv4' : net.family === 4
      if (familyV4 && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

let cachedLedgerState = null;

function setupWebSocketRelay(server) {
  const wss = new WebSocketServer({ noServer: true })
  const clients = new Set()

  if (server.httpServer) {
    server.httpServer.on('upgrade', (req, socket, head) => {
      const pathname = (req.url || '').split('?')[0]
      if (pathname === '/fairshare-sync') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req)
        })
      }
    })
  }

  wss.on('connection', (ws) => {
    clients.add(ws)

    // Immediately replay cached state to newly connected client/phone
    if (cachedLedgerState) {
      try {
        ws.send(JSON.stringify({
          type: 'STATE_UPDATED',
          state: cachedLedgerState,
          fromCache: true,
          timestamp: Date.now(),
        }))
      } catch (err) {
        console.warn('Failed to replay cached state to new client:', err)
      }
    }

    ws.on('message', (message) => {
      const msgStr = message.toString()
      try {
        const parsed = JSON.parse(msgStr)
        if (parsed.type === 'STATE_UPDATED' && parsed.state) {
          cachedLedgerState = parsed.state
        } else if (parsed.type === 'REQUEST_SYNC' && cachedLedgerState) {
          ws.send(JSON.stringify({
            type: 'STATE_UPDATED',
            state: cachedLedgerState,
            fromCache: true,
            timestamp: Date.now(),
          }))
        }
      } catch {}

      // Broadcast to all other connected devices/tabs
      for (const client of clients) {
        if (client !== ws && client.readyState === 1 /* OPEN */) {
          client.send(msgStr)
        }
      }
    })
    ws.on('close', () => clients.delete(ws))
    ws.on('error', () => clients.delete(ws))
  })
}

function handleStateEndpoint(req, res) {
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ state: cachedLedgerState }))
  } else if (req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body)
        if (parsed && (parsed.groups || parsed.state)) {
          cachedLedgerState = parsed.state || parsed
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: true }))
      } catch {
        res.statusCode = 400
        res.end('Invalid JSON')
      }
    })
  } else {
    res.statusCode = 405
    res.end()
  }
}

function fairShareSyncPlugin() {
  return {
    name: 'fairshare-sync-relay',
    configureServer(server) {
      setupWebSocketRelay(server)
      server.middlewares.use('/api/lan-ip', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ip: getLocalLanIp() }))
      })
      server.middlewares.use('/api/ledger-state', handleStateEndpoint)
    },
    configurePreviewServer(server) {
      setupWebSocketRelay(server)
      server.middlewares.use('/api/lan-ip', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ip: getLocalLanIp() }))
      })
      server.middlewares.use('/api/ledger-state', handleStateEndpoint)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fairShareSyncPlugin()],
  server: {
    host: true, // Exposes to local network (0.0.0.0) so phones/laptops on same Wi-Fi can connect
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/ethers')) {
            return 'vendor-ethers';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})


