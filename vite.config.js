import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "autoUpdate" ottaa uuden version kayttoon heti kun se on saatavilla,
      // jotta kayttajat eivat jaa jumiin vanhaan, jo poistettuun koodiin.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Ei mitaan runtimeCaching-sääntöjä: Supabase-kutsut, GPS-paikannus ja
      // paikannimihaku eivat ole talla tavoin service workerin piirissa
      // lainkaan, eli ne hakevat aina tuoretta dataa suoraan verkosta - ei
      // koskaan valimuistista.
      workbox: {
        // Vain sovelluksen omat build-tiedostot ja ikonit valimuistiin.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
      manifest: {
        lang: 'fi',
        name: 'Fisko',
        short_name: 'Fisko',
        description: 'Mobiili edellä toimiva kalastuspäiväkirja',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f3f7f7',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/pwa/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
