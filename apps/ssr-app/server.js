import fs from 'node:fs/promises'
import express from 'express'

const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

const app = express()

let vite
if (!isProduction) {
  // Dev: Vite runs in middleware mode, so the plugin serves the self-hosted font files from
  // memory and transforms index.html on every request.
  const { createServer } = await import('vite')
  vite = await createServer({
    base,
    appType: 'custom',
    server: { middlewareMode: true },
  })
  app.use(vite.middlewares)
} else {
  // Prod: everything the plugin generated is already on disk in dist/client — the hashed font
  // files under assets/vite-font/ included.
  app.use(base, express.static('./dist/client', { index: false }))
}

const templateHtml = isProduction ? await fs.readFile('./dist/client/index.html', 'utf-8') : ''

app.use('*all', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '/')

    let template
    let render
    if (!isProduction) {
      template = await fs.readFile('./index.html', 'utf-8')
      // Runs the plugin's transformIndexHtml, which injects the preloads + font CSS.
      template = await vite.transformIndexHtml(url, template)
      render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render
    } else {
      template = templateHtml
      render = (await import('./dist/server/entry-server.js')).render
    }

    const rendered = await render(url)
    const html = template.replace(`<!--app-head-->`, rendered.head ?? '').replace(`<!--app-html-->`, rendered.html ?? '')

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
  } catch (e) {
    vite?.ssrFixStacktrace(e)
    console.log(e.stack)
    res.status(500).end(e.stack)
  }
})

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})
