import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icons/xingxing.svg',
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png',
        'sw-push.js',
      ],
      manifest: {
        name: 'Xingxing',
        short_name: 'Xingxing',
        description: 'Casa em dia, estrelinhas no bolso',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        id: '/',
        display: 'standalone',
        background_color: '#F3F1E4',
        theme_color: '#F3F1E4',
        icons: [
          {
            src: '/icons/icon-192.png?v=2',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png?v=2',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-512.png?v=2',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cacheId: 'xingxing-v3',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        importScripts: ['/sw-push.js'],
      },
    }),
  ],
})
