import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/customer': { target: 'http://127.0.0.1:8008', changeOrigin: true },
      '/checkout/quote': { target: 'http://127.0.0.1:8008', changeOrigin: true },
      '/api': { target: 'http://127.0.0.1:8008', changeOrigin: true },
      '/staff': { target: 'http://127.0.0.1:8008', changeOrigin: true },
      '/media': { target: 'http://127.0.0.1:8008', changeOrigin: true },
    },
  },
})
