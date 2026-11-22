import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Default matches backend/serve.ps1 (port 8009). VITE_API_TARGET overrides it
// (the E2E suite points it at its own backend on 8018).
const api = process.env.VITE_API_TARGET || 'http://127.0.0.1:8009'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/customer': { target: api, changeOrigin: true },
      '/checkout/quote': { target: api, changeOrigin: true },
      '/api': { target: api, changeOrigin: true },
      '/staff': { target: api, changeOrigin: true },
      '/media': { target: api, changeOrigin: true },
    },
  },
})
