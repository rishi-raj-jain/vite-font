/**
 * Types for the virtual modules `vite-font` exposes.
 *
 * Reference them from your app's tsconfig (`"types": ["vite-font/client"]`) or with a
 * triple-slash directive: `/// <reference types="vite-font/client" />`.
 */

declare module 'virtual:vite-font' {
  /** Every `@font-face`, fallback, selector and CSS-variable rule the plugin generated. */
  export const css: string

  /** The font files that should be preloaded, with the `type` for their `<link>`. */
  export const preloads: { href: string; type: string }[]

  /** Ready-to-inject `<head>` markup: the preload links followed by a `<style>` block. */
  export const headTags: string
}

/** Side-effect import that pulls the font CSS into your client stylesheet bundle. */
declare module 'virtual:vite-font.css' {}
