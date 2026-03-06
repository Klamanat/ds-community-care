import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') }
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_GAS_URL || 'https://script.google.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
          followRedirects: true
        }
      }
    }
  }
})
