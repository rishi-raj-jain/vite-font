# vite-font · Astro on Vercel (prerendered + on demand)

**Live: [vite-font-astro-app.vercel.app](https://vite-font-astro-app.vercel.app/)**

An Astro app on the [Vercel adapter](https://docs.astro.build/en/guides/integrations-guide/vercel/) with
two routes that pull their fonts from the same layout:

| Route   | Mode                | Rendered                                                          |
| ------- | ------------------- | ----------------------------------------------------------------- |
| `/`     | `prerender = true`  | Once, at build time, into `.vercel/output/static/index.html`       |
| `/live` | `prerender = false` | Per request, by the serverless function in `.vercel/output/functions` |

Astro renders its own HTML, so Vite's `transformIndexHtml` hook never runs and the plugin has no HTML
entry to inject into (hence `injectHtml: false`). Instead [Layout.astro](./src/layouts/Layout.astro)
imports `headTags` from `virtual:vite-font` and drops it into `<head>`. That works the same for both
routes: the prerendered page gets the tags baked into its `.html` file on disk, the on-demand page gets
them written into the response — from CSS that was resolved at build time and bundled into the function,
not recomputed per request.

```bash
pnpm install
pnpm dev                # http://localhost:4321
pnpm build              # -> .vercel/output
pnpm preview            # serve that build output locally
```

`astro preview` doesn't work with the Vercel adapter (the build output is a static folder plus a
serverless function, not a server), so [preview.js](./preview.js) does what Vercel's router does: try
the filesystem first, then hand the request to the function. Deploy for real with `vercel`.

What to look for after `pnpm build`:

- `.vercel/output/static/assets/vite-font/*.woff2` — the local Gabarito files, content-hashed and
  statically referenced by both routes.
- `grep '@font-face' .vercel/output/static/index.html` — the prerendered route's CSS, already on disk.
- `curl http://localhost:4321/live` — the on-demand route's response, carrying the identical `<style>`
  block and the identical font URLs.
