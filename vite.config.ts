import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Your backend server URL
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public', // Make sure _redirects is in public folder
})


