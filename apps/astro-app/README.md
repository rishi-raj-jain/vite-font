# vite-font · Astro (prerendered + on demand)

An Astro app with two routes that use the same fonts through the same layout:

| Route   | Mode                | Rendered                                           |
| ------- | ------------------- | -------------------------------------------------- |
| `/`     | `prerender = true`  | Once, at build time, into `dist/client/index.html` |
| `/live` | `prerender = false` | Per request, by the Node adapter                   |

Astro renders its own HTML, so Vite's `transformIndexHtml` hook never runs and the plugin has no HTML
entry to inject into (`injectHtml: false`). Instead [Layout.astro](./src/layouts/Layout.astro) imports
`headTags` from `virtual:vite-font` and drops it into `<head>`. That works the same for both routes:
the prerendered page gets the tags baked into its `.html` file, the on-demand page gets them written
into the response.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build
npm run preview    # node ./dist/server/entry.mjs
```

What to look for after `npm run build`:

- `dist/client/assets/vite-font/*.woff2` — the local Gabarito files, content-hashed and statically
  referenced by both routes.
- `grep '@font-face' dist/client/index.html` — the prerendered route's CSS, already on disk.
- `curl http://localhost:4321/live` — the on-demand route's response, carrying the identical
  `<style>` block and the identical font URLs.
