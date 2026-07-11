import { create, type Font } from 'fontkit'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { getFallbackMetricsFromFontFile, type FallbackMetrics } from './font.js'
import { pickFontFileForFallbackGeneration } from './fallback.js'

type GlobalValues = 'inherit' | 'initial' | 'revert' | 'revert-layer' | 'unset'

// https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight
export type FontWeight =
  | 'normal'
  | 'bold'
  | 'lighter'
  | 'bolder'
  | GlobalValues
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | (string & {})
  | (number & {})

// https://developer.mozilla.org/en-US/docs/Web/CSS/font-style
export type FontStyle = 'normal' | 'italic' | 'oblique' | `oblique ${number}deg` | GlobalValues | (string & {})

export interface Source {
  /** Path to a local font file (relative to the project root or absolute) or an http(s) URL. */
  path: string
  /** Preload this specific file. Overrides the family-level `preload` value. */
  preload?: boolean
  /** The Google Fonts subset this file belongs to (e.g. `latin`), parsed from the CSS. */
  subset?: string
  /** Extra descriptors placed on the generated @font-face rule (e.g. `unicode-range`). */
  css?: Record<string, string>
  style?: FontStyle
  weight?: FontWeight
}

export interface FontFamily {
  /** The `font-family` name used in the generated CSS. Also the Google Fonts family to fetch. */
  name: string
  /** The list of font files that make up this family. Optional for name-based Google fonts. */
  src?: Source[]
  /**
   * Google Fonts weight(s) to request, e.g. `'400'` or `['400', '700']`, mirroring `next/font`.
   * Used to build the Google Fonts URL when `googleFontsURL` is not provided. Omit for a
   * variable font's full weight range.
   */
  weight?: FontWeight | FontWeight[]
  /**
   * Google Fonts style(s) to request: `'normal'`, `'italic'`, or both. Defaults to `'normal'`.
   * Used together with `weight` to build the Google Fonts URL.
   */
  style?: FontStyle | FontStyle[]
  /** Fetch remote (http/https) font files and self-host them from your own origin. */
  fetch?: boolean
  /** Log what the plugin is doing. */
  verbose?: boolean
  /** CSS selector the `font-family` is applied to (e.g. `body`, `.headline`). */
  selector?: string
  /** Preload the font files of this family. Per-file `src.preload` takes precedence. */
  preload?: boolean
  /**
   * Google Fonts subsets to preload (e.g. `['latin']`), mirroring `next/font`.
   * All subsets returned by Google are still self-hosted and available — this only decides
   * which subset files get a `<link rel="preload">`. Required to preload a Google font;
   * with `preload` on and no `subsets`, nothing is preloaded (a warning is logged).
   */
  subsets?: string[]
  /** Expose the resolved font stack as a CSS custom property on `:root`. */
  cssVariable?: string | boolean
  /** Override the generated fallback family name. Defaults to a random, collision-safe name. */
  fallbackName?: string
  /**
   * A Google Fonts CSS URL. The plugin fetches it and expands it into `src` automatically.
   * Takes precedence over `weight`/`style`-based URL building when both are provided.
   */
  googleFontsURL?: string
  // https://developer.mozilla.org/en-US/docs/Web/CSS/font-family generic family used for metric matching
  fallback: 'serif' | 'sans-serif' | 'monospace'
  // https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional' | (string & {})
}

export interface Options {
  config: FontFamily[]
  /**
   * Inject the preload links and the font CSS into every HTML entry. Defaults to `true`.
   *
   * Set it to `false` when your server renders its own `<head>` and you inject the tags yourself
   * from the `virtual:vite-font` module — otherwise the CSS ends up in the page twice.
   */
  injectHtml?: boolean
}

const extToPreload: Record<string, string> = {
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  eot: 'application/vnd.ms-fontobject',
}

/** Directory (relative to the site base) that self-hosted font files are emitted to. */
export const ASSET_DIR = 'assets/vite-font'

function isRemote(path: string) {
  return path.startsWith('http:') || path.startsWith('https:')
}

function getExt(path: string) {
  const ext = /\.(woff2|woff|eot|ttf|otf)(\?|#|$)/.exec(path)?.[1]
  return ext
}

/** Compute the preload `type` attribute for a given file/URL. */
export function getPreloadType(src: string) {
  const ext = getExt(src)
  if (!ext || !extToPreload[ext]) throw new Error(`[vite-font] Unexpected font file \`${src}\``)
  return extToPreload[ext]
}

function contentHash(buffer: Buffer) {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 16)
}

/** Read a local font file or fetch a remote one, returning its bytes. */
async function loadBuffer(path: string, root: string): Promise<Buffer | undefined> {
  if (isRemote(path)) {
    const res = await fetch(path, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
    })
    if (!res.ok) return undefined
    return Buffer.from(await res.arrayBuffer())
  }
  const abs = isAbsolute(path) ? path : resolve(root, path)
  if (existsSync(abs)) return readFileSync(abs)
  return undefined
}

// Minimal Google Fonts CSS parser: pull the src url + descriptors out of each @font-face rule.
// In Google Fonts responses each @font-face is preceded by a `/* subset */` comment; we walk the
// CSS in document order so every rule is tagged with the subset it belongs to (mirrors next/font).
function parseGoogleCSS(css: string): Source[] {
  const out: Source[] = []
  let currentSubset = ''
  let match: RegExpExecArray | null
  const tokenRegex = /\/\*\s*([^*]+?)\s*\*\/|@font-face\s*{([^}]+)}/g
  while ((match = tokenRegex.exec(css)) !== null) {
    // A `/* latin */`-style comment: remember it for the following @font-face rules.
    if (match[1] !== undefined) {
      currentSubset = match[1].trim()
      continue
    }
    const rule = match[2]
    const source: Source = { path: '', subset: currentSubset || undefined }
    for (const property of rule.split(';')) {
      if (property.includes('src') && property.includes('url')) {
        source.path =
          property
            .trim()
            .split(/\(|\)|(url\()/)
            .find((each) => each.trim().includes('https:'))
            ?.trim() ?? ''
      } else if (property.includes('-style')) {
        source.style = property.split(':').map((i) => i.trim())[1]
      } else if (property.includes('-weight')) {
        source.weight = property.split(':').map((i) => i.trim())[1]
      } else if (property.includes('unicode-range')) {
        source.css = { ...source.css, 'unicode-range': property.split(':').map((i) => i.trim())[1] }
      }
    }
    if (source.path) out.push(source)
  }
  return out
}

/** A single font file after resolution: where its bytes came from and where they'll be served. */
export interface ResolvedSource extends Source {
  /** Final URL referenced in @font-face `src` and the preload link. */
  url: string
  /** Emitted filename (relative to base) when self-hosted; undefined for direct remote refs. */
  assetName?: string
  /** File bytes when self-hosted; undefined for direct remote refs. */
  buffer?: Buffer
}

export interface ResolvedFamily {
  family: FontFamily
  sources: ResolvedSource[]
  fallback?: FallbackMetrics
  fallbackName: string
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

// Google's `wght` axis only accepts numbers; map the CSS keywords and sort ascending.
function normalizeWeight(weight: string): string {
  if (weight === 'normal') return '400'
  if (weight === 'bold') return '700'
  return weight
}
function weightSortKey(weight: string): number {
  const n = parseInt(weight, 10)
  return Number.isNaN(n) ? 0 : n
}

/**
 * Build a Google Fonts css2 URL from a family's `name` + `weight`(s) + `style`(s), à la
 * `next/font`. Returns e.g. `…/css2?family=Inter:wght@400;500&display=swap`, or the
 * `ital,wght@0,400;1,400` form when italics are requested.
 */
export function buildGoogleFontsURL(family: FontFamily): string {
  const name = family.name.trim().replace(/ +/g, '+')
  const display = family.display ?? 'swap'
  const weights = [
    ...new Set(
      toArray(family.weight)
        .map((w) => normalizeWeight(String(w)))
        .filter(Boolean),
    ),
  ].sort((a, b) => weightSortKey(a) - weightSortKey(b))
  const italFlags = [...new Set(toArray(family.style).map((s) => (String(s) === 'italic' ? 1 : 0)))].sort()
  const wantsItalicAxis = italFlags.length > 1 || italFlags[0] === 1

  let axis = ''
  if (weights.length === 0) {
    // Variable font, full weight range; only add an axis when italics are explicitly asked for.
    if (wantsItalicAxis) axis = `:ital@${italFlags.join(';')}`
  } else if (!wantsItalicAxis) {
    axis = `:wght@${weights.join(';')}`
  } else {
    // `ital,wght` tuples sorted by (ital, weight), e.g. 0,400;0,700;1,400;1,700.
    const pairs: Array<[number, string]> = []
    for (const ital of italFlags) for (const w of weights) pairs.push([ital, w])
    pairs.sort((a, b) => a[0] - b[0] || weightSortKey(a[1]) - weightSortKey(b[1]))
    axis = `:ital,wght@${pairs.map(([i, w]) => `${i},${w}`).join(';')}`
  }
  return `https://fonts.googleapis.com/css2?family=${name}${axis}&display=${display}`
}

/**
 * Resolve a font family: expand Google Fonts, load every file's bytes, decide whether each
 * file is self-hosted or referenced remotely, and compute the CLS-reducing fallback metrics.
 */
export async function resolveFamily(family: FontFamily, base: string, root: string): Promise<ResolvedFamily> {
  const log = (msg: string) => family.verbose && console.log(`[vite-font] ▶ ${msg}`)

  // A Google font is intended when a URL is given, or when there are no local `src` files.
  // In the latter case we build the css2 URL from name + weight + style (like next/font).
  const hasLocalSrc = (family.src?.length ?? 0) > 0
  const googleFontsURL = family.googleFontsURL ?? (hasLocalSrc ? undefined : buildGoogleFontsURL(family))

  let sourceList = family.src ?? []
  if (googleFontsURL) {
    log(`Fetching Google Fonts CSS: ${googleFontsURL}`)
    const res = await fetch(googleFontsURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
    })
    sourceList = parseGoogleCSS(await res.text())
    log(`Parsed ${sourceList.length} @font-face rules from Google Fonts for "${family.name}"`)

    // Mirror next/font: preloading a Google font requires you to opt into subsets.
    const requested = family.subsets ?? []
    if (family.preload !== false && requested.length === 0) {
      console.warn(
        `[vite-font] "${family.name}": \`preload\` is enabled but no \`subsets\` were specified, ` +
          `so no font files will be preloaded. Add e.g. \`subsets: ['latin']\`. ` +
          `See https://fonts.google.com/knowledge/glossary/subsetting`,
      )
    }
    // Warn on subsets that don't exist for this font (likely a typo).
    const available = new Set(sourceList.map((s) => s.subset).filter(Boolean))
    for (const subset of requested) {
      if (!available.has(subset)) {
        console.warn(
          `[vite-font] "${family.name}": subset "${subset}" was not found in the Google Fonts ` + `response. Available subsets: ${[...available].join(', ') || '(none)'}.`,
        )
      }
    }
  }

  const metricInputs: { style?: string; weight?: string; metadata: Font }[] = []

  const sources: ResolvedSource[] = await Promise.all(
    sourceList.map(async (src): Promise<ResolvedSource> => {
      // Remote file the user does NOT want self-hosted: reference it directly.
      if (isRemote(src.path) && !family.fetch) {
        return { ...src, url: src.path }
      }

      const buffer = await loadBuffer(src.path, root)
      if (!buffer) {
        log(`Could not load "${src.path}" — referencing it as-is`)
        return { ...src, url: src.path }
      }

      // Collect metrics from the real font bytes. `create` returns a Font, or a FontCollection
      // (.ttc) whose first face we use for metric matching.
      try {
        const parsed = create(buffer)
        const font = ('fonts' in parsed ? parsed.fonts[0] : parsed) as Font
        metricInputs.push({ style: src.style, weight: src.weight?.toString(), metadata: font })
      } catch (e) {
        log(`Failed to read metrics from "${src.path}"`)
      }

      const ext = getExt(src.path) ?? 'woff2'
      const assetName = `${ASSET_DIR}/${contentHash(buffer)}.${ext}`
      return { ...src, buffer, assetName, url: base + assetName }
    }),
  )

  let fallback: FallbackMetrics | undefined
  if (metricInputs.length > 0) {
    try {
      const { metadata } = pickFontFileForFallbackGeneration(metricInputs)
      fallback = getFallbackMetricsFromFontFile(metadata, family.fallback)
    } catch (e) {
      log(`Failed to compute fallback metrics for "${family.name}"`)
    }
  }

  const fallbackName = family.fallbackName || `${family.name} Fallback ${contentHash(Buffer.from(family.name)).slice(0, 6)}`

  return { family, sources, fallback, fallbackName }
}

/**
 * URLs of the files that should be `<link rel="preload">`ed.
 *
 * A per-file `src.preload` always wins. Otherwise, once the family-level `preload` is on
 * (the default), a file tagged with a Google Fonts `subset` is only preloaded when that subset
 * is listed in `family.subsets` — mirroring `next/font`. Files without a subset (local/remote
 * files you configured yourself) are preloaded as before.
 */
export function createPreloads(resolved: ResolvedFamily): string[] {
  const { family, sources } = resolved
  const familyPreload = family.preload !== false
  const requested = family.subsets ?? []
  return sources
    .filter((s) => {
      if (s.preload === true) return true
      if (s.preload === false) return false
      if (!familyPreload) return false
      // Google-subset semantics: only preload the subsets the user opted into.
      if (s.subset !== undefined) return requested.includes(s.subset)
      return true
    })
    .map((s) => s.url)
}

/** The `@font-face` rules for the real font files. */
export function createBaseCSS(resolved: ResolvedFamily): string {
  const { family, sources } = resolved
  return sources
    .map((s) => {
      const props = Object.entries(s.css || {}).map(([k, v]) => `${k}: ${v}`)
      if (s.weight) props.push(`font-weight: ${s.weight}`)
      if (s.style) props.push(`font-style: ${s.style}`)
      props.push(`font-family: '${family.name}'`)
      if (family.display) props.push(`font-display: ${family.display}`)
      props.push(`src: url(${s.url})`)
      return `@font-face {${props.join(';')}}`
    })
    .join(' ')
}

/** The metric-matched fallback @font-face, the selector rule, and the optional CSS variable. */
export function createFontCSS(resolved: ResolvedFamily): string {
  const { family, fallback, fallbackName } = resolved
  const out: string[] = []
  const quotedFallback = `'${fallbackName}'`
  const stack = fallback ? `'${family.name}', ${quotedFallback}, ${family.fallback}` : `'${family.name}', ${family.fallback}`

  if (family.selector) out.push(`${family.selector} { font-family: ${stack}; }`)

  if (family.cssVariable === true) {
    out.push(`:root { --vite-font: ${stack}; }`)
  } else if (typeof family.cssVariable === 'string' && family.cssVariable.length > 0) {
    out.push(`:root { --${family.cssVariable}: ${stack}; }`)
  }

  if (fallback) {
    out.push(
      `@font-face {` +
        `font-family: ${quotedFallback};` +
        `src: local('${fallback.fallbackFont}');` +
        `size-adjust: ${fallback.sizeAdjust};` +
        `ascent-override: ${fallback.ascentOverride};` +
        `descent-override: ${fallback.descentOverride};` +
        `line-gap-override: ${fallback.lineGapOverride};` +
        `}`,
    )
  }

  return out.join(' ')
}
