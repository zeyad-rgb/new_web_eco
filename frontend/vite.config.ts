import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// VITE_API_TARGET lets the E2E suite point the dev proxy at its own backend.
const api = process.env.VITE_API_TARGET || 'http://127.0.0.1:8008'

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
