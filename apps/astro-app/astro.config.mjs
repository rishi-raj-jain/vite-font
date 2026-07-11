// @ts-check
import vercel from '@astrojs/vercel'
import { defineConfig } from 'astro/config'
import viteFont from 'vite-font'

// Astro renders its own HTML, so Vite's `transformIndexHtml` never runs for a page — there is no
// index.html entry to transform. `injectHtml: false` turns that path off and the layout pulls the
// generated tags in from the `virtual:vite-font` module instead, which works identically for a
// prerendered page (baked into the .html at build time) and an on-demand one (rendered per request).
// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
  vite: {
    plugins: [
      viteFont({
        injectHtml: false,
        config: [
          // Google font by NAME + WEIGHTS, served from the Google CDN (no `fetch`).
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
          // A variable serif for the display type, also from the CDN.
          {
            name: 'Fraunces',
            weight: ['600', '900'],
            subsets: ['latin'],
            preload: true,
            display: 'swap',
            cssVariable: 'fraunces',
            fallback: 'serif',
          },
          // Monospace for the code bits.
          {
            name: 'JetBrains Mono',
            weight: ['400'],
            subsets: ['latin'],
            preload: false,
            display: 'swap',
            cssVariable: 'jetbrains',
            fallback: 'monospace',
          },
          // LOCAL font files — self-hosted, content-hashed, emitted into dist/client at build time
          // and referenced by the same URL from both the prerendered and the on-demand page.
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
  },
})
