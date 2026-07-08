# vite-font

`vite-font` automatically optimizes your **Local**, **Remote**, **CDN** and **Google** fonts for performance — self-hosting them, preloading them, and generating a metric-matched fallback `@font-face` to eliminate layout shift (CLS).

It is a [Vite](https://vite.dev) plugin inspired by [`astro-font`](https://github.com/rishi-raj-jain/astro-font) and [Next.js Font Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts). Works with the latest Vite (tested on Vite 8).

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

1. **Self-hosts** local files and (optionally) remote files under a content-hashed, immutable URL — served from memory in dev and emitted into the bundle on build.
2. **Preloads** the files with a correctly-typed `<link rel="preload" as="font" crossorigin>`.
3. **Reads the real font metrics** with [`fontkit`](https://github.com/foliojs/fontkit) and generates a fallback `@font-face` with `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override` so the fallback font occupies the same space as your web font — killing layout shift.
4. Emits the `@font-face` rules, an optional `selector` rule, and an optional CSS variable.

## Google Fonts

The easiest way — just name the family and its `weight`s (and optionally `style`s), à la `next/font`. The plugin builds the Google Fonts URL for you:

```ts
viteFont({
  config: [
    {
      name: 'Inter',
      weight: ['400', '500', '700'], // omit for a variable font's full range
      style: ['normal', 'italic'],   // optional; defaults to 'normal'
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

Any `path` that starts with `http:` or `https:` is treated as remote. By default it is referenced directly; set `fetch: true` on the family to self-host it.

```ts
{
  name: 'Afacad',
  src: [
    {
      style: 'bold',
      weight: '700',
      path: 'https://fonts.gstatic.com/s/afacad/v1/6NUK8FKMIQOGaw6wjYT7ZHG_zsBBfvLqagk-80KjZfJ_uw.woff2',
    },
  ],
  preload: true,
  display: 'swap',
  selector: 'body',
  fallback: 'sans-serif',
}
```

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

## Configuration

### `Options`

| Key      | Type           | Description                        |
| -------- | -------------- | ---------------------------------- |
| `config` | `FontFamily[]` | One entry per font family to load. |

### `FontFamily`

| Key              | Type                                       | Default            | Description                                                                        |
| ---------------- | ------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------- |
| `name`           | `string`                                   | —                  | The `font-family` name in the CSS; also the Google Fonts family to fetch.          |
| `src`            | `Source[]`                                 | `[]`               | Local/remote font files. Optional for name-based Google fonts.                     |
| `fallback`       | `'serif' \| 'sans-serif' \| 'monospace'`   | —                  | Generic family used for metric matching and as the final fallback.                 |
| `weight`         | `string \| number \| Array`                | —                  | Google Fonts weight(s) to request, e.g. `['400','700']`. Builds the URL.           |
| `style`          | `string \| Array`                          | `'normal'`         | Google Fonts style(s): `'normal'`, `'italic'`, or both. Builds the URL.            |
| `googleFontsURL` | `string`                                   | —                  | A Google Fonts CSS URL. Takes precedence over `weight`/`style`.                    |
| `fetch`          | `boolean`                                  | `false`            | Download remote/Google files and self-host them.                                   |
| `preload`        | `boolean`                                  | `true`             | Preload the family's files. Per-file `src.preload` takes precedence.               |
| `subsets`        | `string[]`                                 | —                  | Google Fonts subsets to preload (e.g. `['latin']`), à la `next/font`.              |
| `display`        | `string`                                   | —                  | `font-display` value (`swap`, `optional`, …).                                      |
| `selector`       | `string`                                   | —                  | CSS selector the `font-family` is applied to (e.g. `body`, `.headline`).           |
| `cssVariable`    | `string \| boolean`                        | —                  | Expose the font stack as a `:root` custom property.                                |
| `fallbackName`   | `string`                                   | auto               | Override the generated fallback family name.                                       |
| `verbose`        | `boolean`                                  | `false`            | Log what the plugin is doing.                                                      |

### `Source`

| Key       | Type                        | Description                                                            |
| --------- | --------------------------- | --------------------------------------------------------------------- |
| `path`    | `string`                    | Local path (relative to project root or absolute) or an http(s) URL.  |
| `weight`  | `string \| number`          | `font-weight` for this file (e.g. `400`, `'700'`, `'100 900'`).       |
| `style`   | `string`                    | `font-style` for this file (e.g. `normal`, `italic`).                 |
| `preload` | `boolean`                   | Preload just this file, overriding the family-level `preload`.        |
| `css`     | `Record<string, string>`    | Extra `@font-face` descriptors (e.g. `{ 'unicode-range': '...' }`).   |

## License

MIT
