import type { Plugin } from 'vite'
import { ASSET_DIR, createBaseCSS, createFontCSS, createPreloads, getPreloadType, resolveFamily, type Options, type ResolvedFamily } from './utils.js'

export type { FontFamily, FontStyle, FontWeight, Options, Source } from './utils.js'
export { buildGoogleFontsURL } from './utils.js'

/** Import from your client entry to pull the font CSS into the built stylesheet. */
const VIRTUAL_CSS = 'virtual:vite-font.css'
/** Import from your server entry to get `css` / `preloads` / `headTags` for SSR head injection. */
const VIRTUAL_MODULE = 'virtual:vite-font'
// Rollup convention: a resolved virtual id is prefixed with a NUL byte so no other plugin (and no
// filesystem lookup) treats it as a real path. The CSS one keeps its `.css` extension so Vite's
// stylesheet pipeline picks it up and extracts it into the bundle.
const RESOLVED_CSS = '\0virtual:vite-font.css'
const RESOLVED_MODULE = '\0virtual:vite-font'

/**
 * A Vite plugin that optimizes local, remote, CDN and Google fonts for performance —
 * self-hosting, preloading, and generating metric-matched fallbacks to eliminate layout shift.
 *
 * Inspired by `astro-font` and Next.js font optimization.
 */
export default function viteFont(options: Options): Plugin {
  let base = '/'
  let root = process.cwd()
  // `buildStart` also runs in serve mode, where `emitFile` is unsupported and warns.
  let isBuild = false
  // True for the `vite build --ssr` pass, which produces the server bundle rather than the
  // browser-facing one.
  let isSsrBuild = false
  // Vite drops assets emitted during an SSR build unless the app opts into `build.ssrEmitAssets`
  // (frameworks that serve static files out of the server output need it).
  let ssrEmitAssets = false

  const injectHtml = options.injectHtml !== false

  // In-memory map of self-hosted font files, keyed by their base-relative asset name.
  // Populated during resolution and used by both the dev middleware and the build emit step.
  const assets = new Map<string, Buffer>()

  let resolvedPromise: Promise<ResolvedFamily[]> | null = null
  function resolveAll(): Promise<ResolvedFamily[]> {
    if (!resolvedPromise) {
      resolvedPromise = Promise.all(options.config.map((family) => resolveFamily(family, base, root))).then((families) => {
        for (const family of families) {
          for (const source of family.sources) {
            if (source.assetName && source.buffer) assets.set(source.assetName, source.buffer)
          }
        }
        return families
      })
    }
    return resolvedPromise
  }

  /** The preload links + `@font-face` / fallback CSS, in the shapes the various hooks need. */
  async function generate() {
    const families = await resolveAll()

    // Dedupe across all families: one URL only needs a single preload link, even when it is
    // shared by several @font-face rules (e.g. a variable font's subset across weights).
    const hrefs = [...new Set(families.flatMap((family) => createPreloads(family)))]
    const preloads = hrefs.map((href) => ({ href, type: getPreloadType(href) }))

    const css = families
      .flatMap((family) => [createBaseCSS(family), createFontCSS(family)])
      .filter(Boolean)
      .join(' ')

    return { preloads, css }
  }

  return {
    name: 'vite-font',

    configResolved(config) {
      base = config.base || '/'
      root = config.root || process.cwd()
      isBuild = config.command === 'build'
      isSsrBuild = Boolean(config.build?.ssr)
      ssrEmitAssets = Boolean(config.build?.ssrEmitAssets)
    },

    // Build: emit every self-hosted font file into the output bundle. In dev the files are served
    // from memory by the middleware below instead — `emitFile` is a build-only capability.
    //
    // Only the client build serves files to the browser, so the SSR pass skips this: its output is
    // a JS bundle nobody fetches fonts from, and the URLs baked into the CSS (`<base>assets/…`)
    // point at the client output either way.
    //
    // Under the Environment API (Vite 6+) a single build runs several environments and
    // `configResolved` fires once per environment, so the closure flags above hold whichever
    // environment resolved last — usually the SSR one, which would wrongly skip the client's
    // emit and leave every `/assets/vite-font/…` URL in the CSS pointing at nothing. Prefer the
    // per-environment config here, and fall back to the flags on Vite 5, which has no
    // `this.environment`.
    async buildStart() {
      if (!isBuild) return
      const env = this.environment
      const isServerEnv = env ? env.config.consumer !== 'client' : isSsrBuild
      const emitAssets = env ? Boolean(env.config.build?.ssrEmitAssets) : ssrEmitAssets
      if (isServerEnv && !emitAssets) return
      const families = await resolveAll()
      for (const family of families) {
        for (const source of family.sources) {
          if (source.assetName && source.buffer) {
            this.emitFile({ type: 'asset', fileName: source.assetName, source: source.buffer })
          }
        }
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_CSS) return RESOLVED_CSS
      if (id === VIRTUAL_MODULE) return RESOLVED_MODULE
    },

    async load(id) {
      if (id === RESOLVED_CSS) {
        const { css } = await generate()
        return css
      }
      if (id === RESOLVED_MODULE) {
        const { css, preloads } = await generate()
        // `headTags` is pre-rendered markup so a server entry can drop it straight into <head>;
        // `css` and `preloads` are there for renderers that assemble their own tags.
        const headTags = preloads.map((p) => `<link rel="preload" as="font" href="${p.href}" type="${p.type}" crossorigin>`).join('') + `<style type="text/css">${css}</style>`
        return [`export const css = ${JSON.stringify(css)}`, `export const preloads = ${JSON.stringify(preloads)}`, `export const headTags = ${JSON.stringify(headTags)}`].join(
          '\n',
        )
      }
    },

    // Dev: serve self-hosted font files from memory at their stable URLs.
    async configureServer(server) {
      await resolveAll()
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next()
        const url = req.url.split('?')[0]
        // Match both `<base>assets/vite-font/...` and the bare `/assets/vite-font/...`.
        const idx = url.indexOf(ASSET_DIR)
        const assetName = idx === -1 ? '' : url.slice(idx)
        const buffer = assets.get(assetName)
        if (!buffer) return next()
        const type = (() => {
          try {
            return getPreloadType(assetName)
          } catch {
            return 'application/octet-stream'
          }
        })()
        res.setHeader('Content-Type', type)
        res.setHeader('Cache-Control', 'max-age=31536000,immutable')
        res.end(buffer)
      })
    },

    // Inject preload links + font CSS into every HTML entry.
    // `order: 'post'` runs after Vite's own HTML asset-resolution pass so it does not try to
    // re-resolve the self-hosted URLs we emit ourselves (which would log a spurious warning).
    transformIndexHtml: {
      order: 'post',
      async handler() {
        if (!injectHtml) return
        const { preloads, css } = await generate()

        const preloadTags = preloads.map((p) => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            href: p.href,
            type: p.type,
            crossorigin: '',
          },
          injectTo: 'head' as const,
        }))

        return [...preloadTags, { tag: 'style', attrs: { type: 'text/css' }, children: css, injectTo: 'head' as const }]
      },
    },
  }
}
