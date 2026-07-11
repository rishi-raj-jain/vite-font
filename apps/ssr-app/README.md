# vite-font · SSR (React + Express)

A server-rendered Vite app showing how `vite-font` gets its fonts and CSS into the build.

The server entry imports `headTags` from `virtual:vite-font` and returns it as the page `<head>`, so
the font CSS ships in the first byte of HTML on every request. The plugin's HTML injection is turned
off (`injectHtml: false` in [vite.config.ts](./vite.config.ts)) because the server does it instead —
leaving it on would put the same CSS on the page twice.

None of the Google families use `fetch`, so they're referenced straight from the Google CDN. Gabarito
is a pair of local `.woff2` files, which are self-hosted: content-hashed and emitted into the client
build.

```bash
npm install
npm run dev        # http://localhost:5173 — fonts served from memory by the plugin

npm run build      # client -> dist/client, server -> dist/server
npm run preview    # NODE_ENV=production node server.js
```

What to look for after `npm run build`:

- `dist/client/assets/vite-font/*.woff2` — the local fonts, content-hashed.
- `dist/server/entry-server.js` — the `@font-face` + fallback CSS, bundled into the server.
- `curl http://localhost:5173` (with `npm run preview`) — the rendered `<head>` carries the preload
  links and the `<style>` block.
