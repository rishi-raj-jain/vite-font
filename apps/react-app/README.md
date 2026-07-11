# vite-font · React SPA

**Live: [vite-font.vercel.app](https://vite-font.vercel.app/)**

A plain Vite + React SPA that exercises every way `vite-font` can source a font, in one config
([vite.config.ts](./vite.config.ts)):

1. A **Google font by name + weights** (`Inter`), à la `next/font`.
2. The same, for a **variable serif** (`Fraunces`).
3. A **Google Fonts URL** you pasted in (`Space Grotesk`).
4. A Google font requested with **roman + italic** (`Newsreader`).
5. **Local `.woff2` files** from `public/fonts` (`Gabarito`).
6. A **CDN font referenced directly**, not self-hosted (`Afacad`).
7. A **monospace** exposed as a CSS variable (`JetBrains Mono`).

Every family except the CDN one uses `fetch: true`, so its files are downloaded at build time,
content-hashed, self-hosted from `/assets/vite-font/`, and measured with fontkit to generate a
metric-matched fallback. Each family's `cssVariable` is consumed from [src/index.css](./src/index.css).

There is no server here: the plugin injects the preload links and the font CSS straight into
`index.html`, so `dist/index.html` ships with the fonts already described in its `<head>`.

```bash
pnpm install
pnpm dev
pnpm build && pnpm preview
```
