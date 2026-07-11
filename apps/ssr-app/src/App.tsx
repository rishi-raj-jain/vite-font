const families = [
  {
    variable: '--inter',
    name: 'Inter',
    how: 'Google font, referenced from the Google CDN (no `fetch`) — only the CSS and the preload links are generated.',
    sample: 'The quick brown fox jumps over the lazy dog',
  },
  {
    variable: '--fraunces',
    name: 'Fraunces',
    how: 'Google font by name + weights, also served from the CDN.',
    sample: 'Rendered on the server, matched on the client',
  },
  {
    variable: '--gabarito',
    name: 'Gabarito',
    how: 'Local .woff2 files — self-hosted, content-hashed and emitted into the client bundle at build time.',
    sample: 'Zero layout shift, zero flash of unstyled text',
  },
]

export default function App() {
  return (
    <main>
      <header>
        <p className="eyebrow">vite-font</p>
        <h1>Fonts that survive the server render.</h1>
        <p className="lede">
          This page is rendered on the server. The <code>@font-face</code> rules, the metric-matched fallbacks and the preload links are all baked into the HTML before it leaves
          the server, so the first paint already knows which font it is drawing.
        </p>
      </header>

      <section>
        {families.map((family) => (
          <article key={family.name}>
            <div className="meta">
              <h2>{family.name}</h2>
              <p>{family.how}</p>
            </div>
            <p className="sample" style={{ fontFamily: `var(${family.variable})` }}>
              {family.sample}
            </p>
          </article>
        ))}
      </section>

      <footer>
        <p>
          View source on this page: the <code>&lt;style&gt;</code> and <code>&lt;link rel="preload"&gt;</code> tags in <code>&lt;head&gt;</code> came from the plugin, not from the
          client bundle.
        </p>
      </footer>
    </main>
  )
}
