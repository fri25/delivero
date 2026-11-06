import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// RapidLiv platform super-admin (étape 9 of docs/plan-migration-multi-tenant.md).
// A desktop tool for the platform team: no PWA, no offline mode.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 5180 },
  plugins: [react(), tailwindcss()],
})
