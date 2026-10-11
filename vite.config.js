import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { WebSocketServer } from 'ws'

function setupWebSocketRelay(server) {
  const wss = new WebSocketServer({ noServer: true })
  const clients = new Set()

  if (server.httpServer) {
    server.httpServer.on('upgrade', (req, socket, head) => {
      if (req.url === '/fairshare-sync') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req)
        })
      }
    })
  }

  wss.on('connection', (ws) => {
    clients.add(ws)
    ws.on('message', (message) => {
      // Broadcast to all other connected devices/tabs
      for (const client of clients) {
        if (client !== ws && client.readyState === 1 /* OPEN */) {
          client.send(message.toString())
        }
      }
    })
    ws.on('close', () => clients.delete(ws))
    ws.on('error', () => clients.delete(ws))
  })
}

function fairShareSyncPlugin() {
  return {
    name: 'fairshare-sync-relay',
    configureServer(server) {
      setupWebSocketRelay(server)
    },
    configurePreviewServer(server) {
      setupWebSocketRelay(server)
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


