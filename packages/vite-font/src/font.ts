// Cherry-picked from
// https://github.com/vercel/next.js/blob/canary/packages/font/src/local

import type { Font } from 'fontkit'

// The font metadata of the fallback fonts, retrieved with fontkit on system font files.
// The average width is calculated with the calcAverageWidth function below.
const fallbackFonts = {
  serif: {
    name: 'Times New Roman',
    azAvgWidth: 854.3953488372093,
    unitsPerEm: 2048,
  },
  monospace: {
    name: 'Courier New',
    azAvgWidth: 1145.9929435483877,
    unitsPerEm: 2048,
  },
  'sans-serif': {
    name: 'Arial',
    azAvgWidth: 934.5116279069767,
    unitsPerEm: 2048,
  },
}

/**
 * Calculate the average character width of a font file.
 * Used to calculate the size-adjust property by comparing the fallback average with the loaded font average.
 */
function calcAverageWidth(font: Font): number | undefined {
  try {
    const avgCharacters = 'aaabcdeeeefghiijklmnnoopqrrssttuvwxyz      '
    // Check if the font file has all the characters we need to calculate the average width
    const hasAllChars = font
      .glyphsForString(avgCharacters)
      .flatMap((glyph) => glyph.codePoints)
      .every((codePoint) => font.hasGlyphForCodePoint(codePoint))
    if (!hasAllChars) return undefined
    const widths = font.glyphsForString(avgCharacters).map((glyph) => glyph.advanceWidth)
    const totalWidth = widths.reduce((sum, width) => sum + width, 0)
    return totalWidth / widths.length
  } catch {
    // Could not calculate average width from the font file, skip size-adjust
    return undefined
  }
}

function formatOverrideValue(val: number) {
  return Math.abs(val * 100).toFixed(2) + '%'
}

export interface FallbackMetrics {
  fallbackFont: string
  sizeAdjust: string
  ascentOverride: string
  descentOverride: string
  lineGapOverride: string
}

/**
 * Given a font file and category, calculate the fallback font override values.
 * The returned values can be used to generate a CSS @font-face declaration that closely
 * matches the metrics of the real font, drastically reducing layout shift (CLS).
 *
 * Read more about this technique in these texts by the Google Aurora team:
 * https://developer.chrome.com/blog/font-fallbacks/
 */
export function getFallbackMetricsFromFontFile(font: Font, category: 'serif' | 'monospace' | 'sans-serif' = 'serif'): FallbackMetrics {
  const azAvgWidth = calcAverageWidth(font)
  const fallbackFont = fallbackFonts[category]
  const { ascent, descent, lineGap, unitsPerEm } = font
  const fallbackFontAvgWidth = fallbackFont.azAvgWidth / fallbackFont.unitsPerEm
  const sizeAdjust = azAvgWidth ? azAvgWidth / unitsPerEm / fallbackFontAvgWidth : 1
  return {
    fallbackFont: fallbackFont.name,
    sizeAdjust: formatOverrideValue(sizeAdjust),
    ascentOverride: formatOverrideValue(ascent / (unitsPerEm * sizeAdjust)),
    descentOverride: formatOverrideValue(descent / (unitsPerEm * sizeAdjust)),
    lineGapOverride: formatOverrideValue(lineGap / (unitsPerEm * sizeAdjust)),
  }
}
