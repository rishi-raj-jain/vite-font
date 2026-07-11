import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteFont from 'vite-font'

// The same plugin config drives both builds: `vite build` (client) and `vite build --ssr`.
// Self-hosted font files are emitted into the client bundle; the CSS and preload links are
// bundled into dist/server via the `virtual:vite-font` import in src/entry-server.tsx, which
// renders them into <head> on every request. `injectHtml: false` keeps the plugin from ALSO
// writing them into index.html, which would ship the same CSS twice.
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteFont({
      injectHtml: false,
      config: [
        // 1 · Google font by NAME + WEIGHTS, served straight from the Google CDN.
        {
          name: 'Inter',
          weight: ['400', '500'],
          subsets: ['latin'],
          preload: true,
          display: 'swap',
          selector: 'body',
          cssVariable: 'inter',
          fallback: 'sans-serif',
        },
        // 2 · A variable serif for the display type, also from the CDN.
        {
          name: 'Fraunces',
          weight: ['600', '900'],
          subsets: ['latin'],
          preload: true,
          display: 'swap',
          cssVariable: 'fraunces',
          fallback: 'serif',
        },
        // 3 · Monospace for the code/eyebrow bits.
        {
          name: 'JetBrains Mono',
          weight: ['400'],
          subsets: ['latin'],
          preload: false,
          display: 'swap',
          cssVariable: 'jetbrains',
          fallback: 'monospace',
        },
        // 4 · LOCAL font files — self-hosted, content-hashed, emitted into dist/client at build.
        {
          name: 'Gabarito',
          src: [
            { path: 'public/fonts/Gabarito-Medium.woff2', weight: '500', style: 'normal' },
            { path: 'public/fonts/Gabarito-Bold.woff2', weight: '700', style: 'normal' },
          ],
          preload: true,
          display: 'swap',
          cssVariable: 'gabarito',
          fallback: 'sans-serif',
        },
      ],
    }),
  ],
})
