import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      'import.meta.env.SERVER_URL': JSON.stringify(env.SERVER_URL),
      'import.meta.env.EMAIL_URL': JSON.stringify(env.EMAIL_URL)
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.SERVER_URL || 'http://localhost:5000',
          changeOrigin: true
        }
      }
    }
  }
})
