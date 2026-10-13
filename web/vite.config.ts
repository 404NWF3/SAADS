import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// WP1-1 情报采集接口代理到 LLM-Intel-Auto REST 后端
const intelTarget = process.env.INTEL_API_TARGET || 'http://127.0.0.1:8010'
const proxy = { '/api/intel': { target: intelTarget, changeOrigin: true } }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy, host: '0.0.0.0', allowedHosts: true },
})
