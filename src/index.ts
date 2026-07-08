import type { Plugin } from 'vite'
import {
  ASSET_DIR,
  createBaseCSS,
  createFontCSS,
  createPreloads,
  getPreloadType,
  resolveFamily,
  type Options,
  type ResolvedFamily,
} from './utils.js'

export type { FontFamily, FontStyle, FontWeight, Options, Source } from './utils.js'
export { buildGoogleFontsURL } from './utils.js'

/**
 * A Vite plugin that optimizes local, remote, CDN and Google fonts for performance —
 * self-hosting, preloading, and generating metric-matched fallbacks to eliminate layout shift.
 *
 * Inspired by `astro-font` and Next.js font optimization.
 */
export default function viteFont(options: Options): Plugin {
  let base = '/'
  let root = process.cwd()

  // In-memory map of self-hosted font files, keyed by their base-relative asset name.
  // Populated during resolution and used by both the dev middleware and the build emit step.
  const assets = new Map<string, Buffer>()

  let resolvedPromise: Promise<ResolvedFamily[]> | null = null
  function resolveAll(): Promise<ResolvedFamily[]> {
    if (!resolvedPromise) {
      resolvedPromise = Promise.all(options.config.map((family) => resolveFamily(family, base, root))).then(
        (families) => {
          for (const family of families) {
            for (const source of family.sources) {
              if (source.assetName && source.buffer) assets.set(source.assetName, source.buffer)
            }
          }
          return families
        },
      )
    }
    return resolvedPromise
  }

  return {
    name: 'vite-font',

    configResolved(config) {
      base = config.base || '/'
      root = config.root || process.cwd()
    },

    // Build: emit every self-hosted font file into the output bundle.
    async buildStart() {
      const families = await resolveAll()
      for (const family of families) {
        for (const source of family.sources) {
          if (source.assetName && source.buffer) {
            this.emitFile({ type: 'asset', fileName: source.assetName, source: source.buffer })
          }
        }
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
        const families = await resolveAll()

        // Dedupe across all families: one URL only needs a single preload link, even when it is
        // shared by several @font-face rules (e.g. a variable font's subset across weights).
        const preloadHrefs = [...new Set(families.flatMap((family) => createPreloads(family)))]
        const preloadTags = preloadHrefs.map((href) => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            href,
            type: getPreloadType(href),
            crossorigin: '',
          },
          injectTo: 'head' as const,
        }))

        const css = families
          .flatMap((family) => [createBaseCSS(family), createFontCSS(family)])
          .filter(Boolean)
          .join(' ')

        return [
          ...preloadTags,
          { tag: 'style', attrs: { type: 'text/css' }, children: css, injectTo: 'head' as const },
        ]
      },
    },
  }
}
