import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path'

// Triggering restart to clear Sass cache
// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/_variables.scss" as *; @use "@/styles/_mixins.scss" as *;`

      }
    }
  }
})

