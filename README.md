# vite-font — monorepo

A [Vite](https://vite.dev) plugin that optimizes **Local**, **Remote**, **CDN** and **Google** fonts — self-hosting them, preloading them, and generating metric-matched fallbacks to eliminate layout shift (CLS).

| Package                                      | What it is                                                      |
| -------------------------------------------- | --------------------------------------------------------------- |
| [`packages/vite-font`](./packages/vite-font) | The plugin itself. **Start here** — that's the README you want. |

## Example apps

| App                                  | Shows                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| [`apps/react-app`](./apps/react-app) | An SPA. Google, local, CDN and URL-based fonts; the plugin injects everything into `index.html`.                |
| [`apps/ssr-app`](./apps/ssr-app)     | React + Express SSR. The server entry imports `headTags` from `virtual:vite-font` and renders it into `<head>`. |
| [`apps/astro-app`](./apps/astro-app) | Astro with one prerendered route and one `prerender = false` route, both fed by the same layout.                |

## Development

The repo is a [pnpm](https://pnpm.io) workspace. The apps depend on the plugin via `workspace:*`, so they always run against the local source — build the plugin first, and `pnpm -r build` does that for you in dependency order.

```bash
pnpm install
pnpm build              # builds vite-font, then every app

pnpm --filter vite-font dev     # rebuild the plugin on change
pnpm --filter ssr-app dev       # run one app
```

Formatting is Prettier, configured once at the root ([.prettierrc.json](./.prettierrc.json)) and inherited by every package:

```bash
pnpm format             # write
pnpm format:check       # verify
```

## License

MIT
