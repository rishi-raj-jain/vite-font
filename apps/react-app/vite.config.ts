import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteFont from 'vite-font'

// Each entry below showcases a different vite-font capability. The `cssVariable` of each is
// consumed from src/index.css and rendered in its own block on the page.
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteFont({
      config: [
        // 1 · Google font by NAME + specific WEIGHTS (like next/font) — body text.
        {
          name: 'Inter',
          weight: ['400', '500'],
          subsets: ['latin'],
          fetch: true,
          preload: true,
          display: 'swap',
          selector: 'body',
          cssVariable: 'inter',
          fallback: 'sans-serif',
        },
        // 2 · Google font by NAME + MULTIPLE WEIGHTS — a variable serif for display.
        {
          name: 'Fraunces',
          weight: ['400', '600', '900'],
          subsets: ['latin'],
          fetch: true,
          preload: true,
          display: 'swap',
          cssVariable: 'fraunces',
          fallback: 'serif',
        },
        // 3 · Loaded straight from a Google Fonts URL you paste in.
        {
          name: 'Space Grotesk',
          googleFontsURL: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap',
          subsets: ['latin'],
          fetch: true,
          preload: false,
          display: 'swap',
          cssVariable: 'grotesk',
          fallback: 'sans-serif',
        },
        // 4 · STYLE axis — request roman + italic together.
        {
          name: 'Newsreader',
          weight: ['400'],
          style: ['normal', 'italic'],
          subsets: ['latin'],
          fetch: true,
          preload: false,
          display: 'swap',
          cssVariable: 'newsreader',
          fallback: 'serif',
        },
        // 5 · LOCAL font files from /public, self-hosted and metric-matched.
        {
          name: 'Gabarito',
          src: [
            { path: 'public/fonts/Gabarito-Medium.woff2', weight: '500', style: 'normal' },
            { path: 'public/fonts/Gabarito-Bold.woff2', weight: '700', style: 'normal' },
          ],
          preload: false,
          display: 'swap',
          cssVariable: 'gabarito',
          fallback: 'sans-serif',
        },
        // 6 · REMOTE / CDN font referenced directly (no fetch → served from Google's CDN).
        {
          name: 'Afacad',
          src: [
            {
              weight: '500',
              style: 'normal',
              path: 'https://fonts.gstatic.com/s/afacad/v3/6NUK8FKMIQOGaw6wjYT7ZHG_zsBBfiftamo-80KlZfJXu2o3.woff2',
            },
          ],
          preload: false,
          display: 'swap',
          cssVariable: 'afacad',
          fallback: 'sans-serif',
        },
        // 7 · Monospace exposed as a CSS variable + applied via a `selector`.
        {
          name: 'JetBrains Mono',
          weight: ['400', '700'],
          subsets: ['latin'],
          fetch: true,
          preload: false,
          display: 'swap',
          cssVariable: 'jetbrains',
          fallback: 'monospace',
        },
      ],
    }),
  ],
})
