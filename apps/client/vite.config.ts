import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// LCP budget (docs/exigences-non-fonctionnelles.md: ≤ 3 s on slow 3G). The
// home hero photo and the two fonts are only discovered once React has
// rendered — about 2.5 s of JS on a slow phone, during which the network sits
// idle. Preloading them from the HTML fills that gap. The photo is preloaded
// on "/" only: a client opening a tracking link must not pay for it.
function preloadAccueil(): Plugin {
  return {
    name: 'chapexpress-preload-accueil',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const fichiers = Object.keys(ctx.bundle ?? {})
        const trouver = (motif: RegExp) => fichiers.find((fichier) => motif.test(fichier))
        const tags: HtmlTagDescriptor[] = []
        for (const motif of [/geist-latin-wght-normal.*\.woff2$/, /bricolage-grotesque-latin-wght-normal.*\.woff2$/]) {
          const police = trouver(motif)
          if (police) {
            tags.push({
              tag: 'link',
              attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${police}`, crossorigin: '' },
              injectTo: 'head',
            })
          }
        }
        // Same file the hero <img> picks from its srcset on phones and desktop
        // (ServicesHubPage, REPAS_SLIDE).
        const photo = trouver(/poisson-braise-sq-760.*\.webp$/)
        if (photo) {
          tags.push({
            tag: 'script',
            children: `if(location.pathname==='/'){var l=document.createElement('link');l.rel='preload';l.as='image';l.href='/${photo}';l.fetchPriority='high';document.head.appendChild(l)}`,
            injectTo: 'head',
          })
          // On phones, the static shell of "/" also shows the top of the real
          // page (title + hero photo, same place and size as ServicesHubPage):
          // the LCP photo paints as soon as it arrives, without waiting for
          // React. Desktop keeps the plain shell — its grid layout differs.
          tags.push({
            tag: 'script',
            children: `if(location.pathname==='/'&&matchMedia('(max-width: 1023px)').matches){document.getElementById('coquille-contenu').innerHTML=${JSON.stringify(
              `<div style="max-width:42rem;margin:0 auto;padding:20px 16px 0">` +
                `<p style="margin:0;color:#5b6b82;font:500 14px/20px system-ui,sans-serif">Bienvenue sur ChapExpress</p>` +
                `<p style="margin:2px 0 0;color:#0b1b33;font:600 27px/1.25 system-ui,sans-serif">Que voulez-vous faire livrer à Natitingou ?</p>` +
                `<div style="margin-top:24px;border-radius:24px;overflow:hidden;background:#fff;box-shadow:0 0 0 1px rgba(11,27,51,.1)">` +
                `<img src="/${photo}" alt="" fetchpriority="high" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover"><div style="height:48px"></div></div></div>`,
            )}}`,
            injectTo: 'body',
          })
        }
        return tags
      },
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    preloadAccueil(),
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
