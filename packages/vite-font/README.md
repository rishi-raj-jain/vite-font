# vite-font

`vite-font` automatically optimizes your **Local**, **Remote**, **CDN** and **Google** fonts for performance — self-hosting them, preloading them, and generating a metric-matched fallback `@font-face` to eliminate layout shift (CLS).

It is a [Vite](https://vite.dev) plugin inspired by [`astro-font`](https://www.launchfa.st/features/astro-font) and [Next.js Font Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts). Works with the latest Vite (tested on Vite 8).

## Demos

- **[vite-font.vercel.app](https://vite-font.vercel.app/)** — a Vite SPA ([`apps/react-app`](../../apps/react-app)): Google fonts by name, a pasted Google Fonts URL, local files and a CDN reference, all in one config.
- **[vite-font-astro-app.vercel.app](https://vite-font-astro-app.vercel.app/)** — Astro on the Vercel adapter ([`apps/astro-app`](../../apps/astro-app)): a prerendered route and an on-demand (`prerender = false`) route sharing one layout.

View source on either one — the `@font-face` rules, the metric-matched fallbacks and the preload links are in the `<head>` of the HTML as it arrives.

## Installation

```bash
npm install -D vite-font
## or
pnpm add -D vite-font
## or
yarn add -D vite-font
```

## Usage

Add the plugin to your `vite.config.*` and describe your fonts. The plugin injects the preload links and the `@font-face` / fallback CSS into every HTML entry automatically.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import viteFont from 'vite-font'

export default defineConfig({
  plugins: [
    viteFont({
      config: [
        {
          name: 'Inter',
          src: [
            { style: 'normal', weight: '400', path: 'public/fonts/Inter-Regular.woff2' },
            { style: 'normal', weight: '700', path: 'public/fonts/Inter-Bold.woff2' },
          ],
          preload: true,
          display: 'swap',
          selector: 'body',
          fallback: 'sans-serif',
        },
      ],
    }),
  ],
})
```

## What it does

For every font family you configure, `vite-font`:

1. **Self-hosts** local files, and remote files when you ask for it with `fetch: true`, under a content-hashed, immutable URL (`/assets/vite-font/<hash>.woff2`) — served from memory in dev, emitted into the client bundle on build.
2. **Preloads** the files with a correctly-typed `<link rel="preload" as="font" crossorigin>`.
3. **Reads the real font metrics** with [`fontkit`](https://github.com/foliojs/fontkit) and generates a fallback `@font-face` with `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override`, so the fallback occupies the same space as your web font — killing layout shift.
4. Emits the `@font-face` rules, an optional `selector` rule, and an optional CSS variable.

> [!IMPORTANT]
> The metric-matched fallback is computed from the **font bytes**, so it only exists for files the plugin actually reads: local files, and remote/Google files with `fetch: true`. A remote font referenced straight from a CDN is never downloaded at build time, so it gets its `@font-face` and preload but **no** fallback — the stack falls back to the plain generic (`sans-serif`, …) and you keep the layout shift. Turn on `fetch` for the families you want protected from CLS.

One fallback is generated per family, measured from a single file: the one closest to `normal` (400), preferring the roman over the italic — the file most likely to render the bulk of your text.

## Google Fonts

The easiest way — just name the family and its `weight`s (and optionally `style`s), à la `next/font`. The plugin builds the Google Fonts URL for you:

```ts
viteFont({
  config: [
    {
      name: 'Inter',
      weight: ['400', '500', '700'], // omit for a variable font's full range
      style: ['normal', 'italic'], // optional; defaults to 'normal'
      subsets: ['latin'],
      preload: true,
      display: 'swap',
      selector: 'body',
      fallback: 'sans-serif',
    },
  ],
})
```

`weight` accepts a single value or an array; `'normal'`/`'bold'` map to `400`/`700`. If you'd rather control the URL yourself, pass `googleFontsURL` (it takes precedence over `weight`/`style`):

```ts
{
  name: 'Poppins',
  googleFontsURL:
    'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;1,400;1,700&display=swap',
  preload: true,
  display: 'swap',
  selector: 'body',
  fallback: 'sans-serif',
}
```

### Subsets

Google Fonts are split into [subsets](https://fonts.google.com/knowledge/glossary/subsetting) (`latin`, `latin-ext`, `cyrillic`, `greek`, `vietnamese`, …), each a separate file scoped by `unicode-range`. Like [`next/font`](https://nextjs.org/docs/pages/api-reference/components/font#specifying-a-subset), you declare which subsets to **preload** with `subsets`:

```ts
{
  name: 'Poppins',
  src: [],
  googleFontsURL: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap',
  preload: true,
  subsets: ['latin'], // only the latin files get <link rel="preload">
  display: 'swap',
  selector: 'body',
  fallback: 'sans-serif',
}
```

- **All** subsets are still emitted as `@font-face` rules (and self-hosted when `fetch: true`), so every language keeps working — the browser downloads only the subsets it actually needs via `unicode-range`.
- `subsets` decides **only** which files are preloaded. A URL shared by several weights (common for variable fonts) is preloaded once.
- With `preload` enabled (the default) and **no** `subsets`, nothing is preloaded and a warning is logged — matching `next/font`. Specifying a subset the font doesn't have also warns.

### Self-hosting

By default the Google `gstatic.com` URLs are referenced directly. Add `fetch: true` to download those files and self-host them from your own origin instead:

```ts
{
  name: 'Poppins',
  src: [],
  googleFontsURL: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap',
  fetch: true, // download & self-host
  preload: true,
  display: 'swap',
  selector: 'body',
  fallback: 'sans-serif',
}
```

## Remote / CDN fonts

Any `path` that starts with `http:` or `https:` is treated as remote. By default it is referenced directly from that URL; set `fetch: true` on the family to download it at build time and self-host it (which is also what lets the plugin measure it for the CLS fallback).

```ts
{
  name: 'Afacad',
  src: [
    {
      style: 'normal',
      weight: '700',
      path: 'https://fonts.gstatic.com/s/afacad/v1/6NUK8FKMIQOGaw6wjYT7ZHG_zsBBfvLqagk-80KjZfJ_uw.woff2',
    },
  ],
  fetch: true,
  preload: true,
  display: 'swap',
  selector: 'body',
  fallback: 'sans-serif',
}
```

`style` is the CSS `font-style` (`normal`, `italic`, …) and `weight` is the CSS `font-weight` — a bold file is `weight: '700'`, not `style: 'bold'`. A variable font's range goes in `weight` as a pair, e.g. `weight: '100 900'`.

If a file can't be loaded (a missing local path, a remote fetch that fails), the plugin logs it under `verbose` and references the `path` as-is rather than failing your build.

## Multiple fonts

Just add more entries to the `config` array — each is optimized independently:

```ts
viteFont({
  config: [
    { name: 'Inter', src: [/* ... */], selector: 'body', fallback: 'sans-serif' },
    { name: 'Lora', src: [/* ... */], selector: '.headline', fallback: 'serif' },
  ],
})
```

## CSS variables

Use `cssVariable` to expose the resolved font stack (including the metric-matched fallback) as a custom property on `:root`:

```ts
{
  name: 'Inter',
  src: [/* ... */],
  fallback: 'sans-serif',
  cssVariable: 'body-font', // -> :root { --body-font: 'Inter', '...Fallback', sans-serif }
}
```

```css
body {
  font-family: var(--body-font);
}
```

Passing `cssVariable: true` uses the default variable name `--vite-font`.

## SSR

In a plain SPA the plugin injects everything into `index.html` and there is nothing to do. A server-rendered app usually builds its own `<head>`, and often has no HTML entry at all for the plugin to transform — so it exposes what it generated as a virtual module you can import from your server entry:

```ts
// src/entry-server.tsx
import { headTags } from 'virtual:vite-font'

export function render() {
  const html = renderToString(<App />)
  return { head: headTags, html } // drop `head` into <head> of your response
}
```

`headTags` is a string: the `<link rel="preload">` tags followed by a `<style>` block with every `@font-face` and metric-matched fallback rule. It is resolved at **build time** and bundled into your server output, so no font is fetched, parsed or measured per request — the first byte of HTML already carries the font CSS. The module also exports the raw pieces if you'd rather build the tags yourself:

```ts
import { css, preloads } from 'virtual:vite-font'
// css: string
// preloads: { href: string; type: string }[]
```

Set `injectHtml: false` when you inject the tags yourself, so the CSS doesn't also get written into `index.html` and end up on the page twice:

```ts
viteFont({
  injectHtml: false,
  config: [/* ... */],
})
```

For TypeScript, reference the virtual module types once — in `src/env.d.ts` (or via `"types": ["vite-font/client"]` in your tsconfig):

```ts
/// <reference types="vite-font/client" />
```

Self-hosted font files are emitted by the **client** build only, since that's the output the browser fetches from; the SSR pass skips them unless you turn on Vite's [`build.ssrEmitAssets`](https://vite.dev/config/build-options.html#build-ssremitassets). The URLs baked into the CSS (`/assets/vite-font/<hash>.woff2`) point at the client output either way.

There's a working example in [`apps/ssr-app`](../../apps/ssr-app) (React + Express).

### Astro

Astro renders its own HTML, so `transformIndexHtml` never runs — import `headTags` in a layout instead. The same layout serves prerendered and on-demand routes:

```astro
---
import { headTags } from 'virtual:vite-font'
---

<head>
  <Fragment set:html={headTags} />
</head>
```

A `prerender = true` page gets the tags baked into its `.html` file at build time; a `prerender = false` page gets them written into the response. Both point at the same content-hashed font files emitted into the build. See [`apps/astro-app`](../../apps/astro-app).

## Configuration

### `Options`

| Key          | Type           | Default | Description                                                                                |
| ------------ | -------------- | ------- | ------------------------------------------------------------------------------------------ |
| `config`     | `FontFamily[]` | —       | One entry per font family to load.                                                         |
| `injectHtml` | `boolean`      | `true`  | Inject the preloads + CSS into HTML entries. Turn off when you inject `headTags` yourself. |

### `FontFamily`

| Key              | Type                                     | Default    | Description                                                               |
| ---------------- | ---------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `name`           | `string`                                 | required   | The `font-family` name in the CSS; also the Google Fonts family to fetch. |
| `src`            | `Source[]`                               | `[]`       | Local/remote font files. Optional for name-based Google fonts.            |
| `fallback`       | `'serif' \| 'sans-serif' \| 'monospace'` | required   | Generic family used for metric matching and as the final fallback.        |
| `weight`         | `string \| number \| Array`              | —          | Google Fonts weight(s) to request, e.g. `['400','700']`. Builds the URL.  |
| `style`          | `string \| Array`                        | `'normal'` | Google Fonts style(s): `'normal'`, `'italic'`, or both. Builds the URL.   |
| `googleFontsURL` | `string`                                 | —          | A Google Fonts CSS URL. Takes precedence over `weight`/`style`.           |
| `fetch`          | `boolean`                                | `false`    | Download remote/Google files and self-host them.                          |
| `preload`        | `boolean`                                | `true`     | Preload the family's files. Per-file `src.preload` takes precedence.      |
| `subsets`        | `string[]`                               | —          | Google Fonts subsets to preload (e.g. `['latin']`), à la `next/font`.     |
| `display`        | `string`                                 | —          | `font-display` value (`swap`, `optional`, …).                             |
| `selector`       | `string`                                 | —          | CSS selector the `font-family` is applied to (e.g. `body`, `.headline`).  |
| `cssVariable`    | `string \| boolean`                      | —          | Expose the font stack as a `:root` custom property.                       |
| `fallbackName`   | `string`                                 | auto       | Override the generated fallback family name.                              |
| `verbose`        | `boolean`                                | `false`    | Log what the plugin is doing.                                             |

Omitting `weight` for a name-based Google font requests the family's **full variable range** rather than a fixed weight. `display` does double duty: it sets `font-display` on the generated `@font-face` rules (omitted entirely when you don't pass it) and it is the `&display=` parameter of the Google Fonts URL the plugin builds, where it defaults to `swap`.

### `Source`

| Key       | Type                     | Description                                                          |
| --------- | ------------------------ | -------------------------------------------------------------------- |
| `path`    | `string`                 | Local path (relative to project root or absolute) or an http(s) URL. |
| `weight`  | `string \| number`       | `font-weight` for this file (e.g. `400`, `'700'`, `'100 900'`).      |
| `style`   | `string`                 | `font-style` for this file (e.g. `normal`, `italic`).                |
| `preload` | `boolean`                | Preload just this file, overriding the family-level `preload`.       |
| `css`     | `Record<string, string>` | Extra `@font-face` descriptors (e.g. `{ 'unicode-range': '...' }`).  |

## Credits

This plugin stands on work by others:

- **[Next.js Font Optimization](https://github.com/vercel/next.js/tree/canary/packages/font)** (Vercel, MIT). The fallback-metrics code is cherry-picked from `@next/font`: deriving `size-adjust` / `ascent-override` / `descent-override` / `line-gap-override` from a font's real metrics ([`src/font.ts`](./src/font.ts)), and picking which file in a family to measure ([`src/fallback.ts`](./src/fallback.ts)). The `next/font` API — naming a Google family with `weight` / `style` / `subsets` rather than hand-writing a URL — is the model for this plugin's config.
- **[`astro-font`](https://github.com/rishi-raj-jain/astro-font)** (MIT), the earlier Astro-specific take on the same idea by the same author; this plugin is its Vite-native successor.
- **[The Chrome/Google Aurora write-up on font fallbacks](https://developer.chrome.com/blog/font-fallbacks/)**, which explains the metric-override technique all of this rests on.
- **[`fontkit`](https://github.com/foliojs/fontkit)** (MIT), which does the actual font parsing.

## License

[MIT](./LICENSE) © Rishi Raj Jain
