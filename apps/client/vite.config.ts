import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Emplettes is hidden in V1 (packages/config/perimetre-v1.ts): its
        // lazy chunks are unreachable, do not make every client download them.
        globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js', '**/Emplettes*.js'],
        // Web Push handlers (public/push-sw.js).
        importScripts: ['/push-sw.js'],
      },
      manifest: {
        lang: 'fr',
        name: 'ChapExpress Client',
        short_name: 'ChapExpress',
        // Emplettes is hidden in V1 (packages/config/perimetre-v1.ts): add it back
        // here when the service reopens.
        description: 'Repas, colis et courses express à Natitingou',
        theme_color: '#002050',
        background_color: '#f6f8fc',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
