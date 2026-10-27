import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Keep the demo bundle readable: vendor code in its own chunks.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-router') || id.includes('@remix-run')) return 'router'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('\\react\\'))
            return 'react'
          if (id.includes('zustand') || id.includes('qrcode')) return 'libs'
          return 'vendor'
        },
      },
    },
  },
})
