import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const devServerHost = process.env.DEV_SERVER_HOST ?? '127.0.0.1'
const parsedDevPort = Number.parseInt(process.env.DEV_SERVER_PORT ?? '5173', 10)
const devServerPort = Number.isNaN(parsedDevPort) ? 5173 : parsedDevPort

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: devServerHost,
    port: devServerPort,
    strictPort: true
  }
})
