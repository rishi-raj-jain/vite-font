import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
// The plugin resolves this at build time: `headTags` is the preload links + the @font-face /
// fallback CSS, already stringified. Because it is a normal import it gets bundled into
// dist/server, so the server-rendered <head> ships the fonts without reading any HTML template.
import { headTags } from 'virtual:vite-font'
import App from './App'

export function render() {
  const html = renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  return { head: headTags, html }
}
