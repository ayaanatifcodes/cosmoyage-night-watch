import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/gibs': {
        target: 'https://gibs.earthdata.nasa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gibs/, '')
      }
    }
  }
})