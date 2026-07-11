import { useState, type ReactNode } from 'react'
import './App.css'

const PANGRAM = 'The quick brown fox jumps over the lazy dog'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="copy"
      data-state={copied ? 'copied' : 'idle'}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1400)
          },
          () => {},
        )
      }}
    >
      <span className="copy-code">{text}</span>
      <span className="copy-label">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

function Block({
  n,
  feature,
  fontVar,
  fallback,
  tags,
  note,
  code,
  children,
}: {
  n: string
  feature: string
  fontVar: string
  fallback: string
  tags: string[]
  note: string
  code: string
  children: ReactNode
}) {
  return (
    <section className="block" aria-labelledby={`b${n}`}>
      <div className="block-head">
        <span className="block-n">{n}</span>
        <h2 id={`b${n}`} className="block-feature">
          {feature}
        </h2>
      </div>

      <div className="block-body">
        <div className="specimen" style={{ fontFamily: fontVar }}>
          {children}
        </div>

        <div className="block-aside">
          <ul className="tags">
            {tags.map((t) => (
              <li className="tag" key={t}>
                {t}
              </li>
            ))}
          </ul>
          <p className="note">{note}</p>
          <p className="stack">
            resolves to <code>{fallback}</code>
          </p>
          <pre className="code">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  return (
    <>
      <header className="hero">
        <p className="eyebrow">Vite plugin · fonts</p>
        <h1 className="wordmark">vite-font</h1>
        <p className="lede">
          One config for <strong>local</strong>, <strong>remote</strong>, <strong>CDN</strong> and <strong>Google</strong> fonts — self-hosted, preloaded, and shipped with a
          metric-matched fallback that eliminates layout shift. Every block below is a different font, loaded a different way.
        </p>
        <CopyButton text="npm i -D vite-font" />
      </header>

      <main>
        {/* 1 · by name + weight */}
        <Block
          n="01"
          feature="Google Fonts by name + weight"
          fontVar="var(--inter)"
          fallback="'Inter', 'Inter Fallback', sans-serif"
          tags={['name-based', 'weights 400·500', 'latin subset', 'self-hosted', 'preloaded']}
          note="Name the family and the weights you want — like next/font. vite-font builds the Google Fonts URL, downloads the files, and self-hosts them from your own origin."
          code={`{
  name: 'Inter',
  weight: ['400', '500'],
  subsets: ['latin'],
  fetch: true,
}`}
        >
          <p className="specimen-name">Inter</p>
          <p className="specimen-line" style={{ fontWeight: 400 }}>
            {PANGRAM}
          </p>
          <p className="specimen-line" style={{ fontWeight: 500 }}>
            {PANGRAM}
          </p>
        </Block>

        {/* 2 · multiple weights (variable serif) */}
        <Block
          n="02"
          feature="Multiple weights, one family"
          fontVar="var(--fraunces)"
          fallback="'Fraunces', 'Fraunces Fallback', serif"
          tags={['weights 400·600·900', 'variable serif', 'self-hosted']}
          note="Pass an array of weights and each becomes its own @font-face. Great for a display family used across headings and body."
          code={`{
  name: 'Fraunces',
  weight: ['400', '600', '900'],
  subsets: ['latin'],
  fetch: true,
}`}
        >
          <p className="specimen-name">Fraunces</p>
          <p className="specimen-line" style={{ fontWeight: 400 }}>
            Regular · {PANGRAM}
          </p>
          <p className="specimen-line" style={{ fontWeight: 600 }}>
            Semibold · {PANGRAM}
          </p>
          <p className="specimen-line" style={{ fontWeight: 900 }}>
            Black · {PANGRAM}
          </p>
        </Block>

        {/* 3 · by Google Fonts URL */}
        <Block
          n="03"
          feature="Paste a Google Fonts URL"
          fontVar="var(--grotesk)"
          fallback="'Space Grotesk', 'Space Grotesk Fallback', sans-serif"
          tags={['googleFontsURL', 'self-hosted']}
          note="Already have a Google Fonts URL? Pass it as-is with googleFontsURL and vite-font expands it into individual @font-face files for you."
          code={`{
  name: 'Space Grotesk',
  googleFontsURL:
    '…/css2?family=Space+Grotesk:wght@400;500;700',
  fetch: true,
}`}
        >
          <p className="specimen-name">Space Grotesk</p>
          <p className="specimen-line" style={{ fontWeight: 400 }}>
            {PANGRAM}
          </p>
          <p className="specimen-line" style={{ fontWeight: 700 }}>
            {PANGRAM}
          </p>
        </Block>

        {/* 4 · style axis / italic */}
        <Block
          n="04"
          feature="Roman + italic in one request"
          fontVar="var(--newsreader)"
          fallback="'Newsreader', 'Newsreader Fallback', serif"
          tags={['style axis', 'normal + italic', 'self-hosted']}
          note="Add a style array and vite-font requests the ital,wght axis for you — no hand-written URL tuples."
          code={`{
  name: 'Newsreader',
  weight: ['400'],
  style: ['normal', 'italic'],
}`}
        >
          <p className="specimen-name">Newsreader</p>
          <p className="specimen-line" style={{ fontStyle: 'normal' }}>
            Roman · {PANGRAM}
          </p>
          <p className="specimen-line" style={{ fontStyle: 'italic' }}>
            Italic · {PANGRAM}
          </p>
        </Block>

        {/* 5 · local files */}
        <Block
          n="05"
          feature="Local font files"
          fontVar="var(--gabarito)"
          fallback="'Gabarito', 'Gabarito Fallback', sans-serif"
          tags={['local .woff2', 'from /public', 'content-hashed', 'metric-matched']}
          note="Point src at files in your project. They're read from disk, content-hashed, and emitted into the build — with a fallback generated from the real font metrics."
          code={`{
  name: 'Gabarito',
  src: [
    { path: 'public/fonts/Gabarito-Medium.woff2', weight: '500' },
    { path: 'public/fonts/Gabarito-Bold.woff2',   weight: '700' },
  ],
}`}
        >
          <p className="specimen-name">Gabarito</p>
          <p className="specimen-line" style={{ fontWeight: 500 }}>
            {PANGRAM}
          </p>
          <p className="specimen-line" style={{ fontWeight: 700 }}>
            {PANGRAM}
          </p>
        </Block>

        {/* 6 · remote / CDN direct */}
        <Block
          n="06"
          feature="Remote / CDN, no self-host"
          fontVar="var(--afacad)"
          fallback="'Afacad', sans-serif"
          tags={['remote URL', 'served from CDN', 'fetch: false']}
          note="Give a remote URL and leave fetch off — the @font-face points straight at the CDN. Flip fetch: true anytime to self-host it instead."
          code={`{
  name: 'Afacad',
  src: [{ path: 'https://fonts.gstatic.com/…/afacad.woff2', weight: '500' }],
  // no fetch → referenced directly from the CDN
}`}
        >
          <p className="specimen-name">Afacad</p>
          <p className="specimen-line" style={{ fontWeight: 500 }}>
            {PANGRAM}
          </p>
        </Block>

        {/* 7 · mono + cssVariable + selector */}
        <Block
          n="07"
          feature="CSS variable + selector"
          fontVar="var(--jetbrains)"
          fallback="'JetBrains Mono', 'JetBrains Mono Fallback', monospace"
          tags={['cssVariable', 'selector', 'exposed on :root']}
          note="Every family can be exposed as a :root custom property (used by all the code samples on this page) or applied directly to a CSS selector."
          code={`{
  name: 'JetBrains Mono',
  weight: ['400', '700'],
  cssVariable: 'jetbrains', // → var(--jetbrains)
}`}
        >
          <p className="specimen-name">JetBrains Mono</p>
          <p className="specimen-line" style={{ fontWeight: 400 }}>
            const font = () =&gt; 'fast'
          </p>
          <p className="specimen-line" style={{ fontWeight: 700 }}>
            0123456789 · {'{ } [ ] < > = => !== ??'}
          </p>
        </Block>

        {/* callout: subsets + preload + CLS — the cross-cutting wins */}
        <section className="notes">
          <h2 className="notes-title">Under the hood, on every family</h2>
          <div className="notes-grid">
            <article>
              <h3>Subset-aware preload</h3>
              <p>
                Declare <code>subsets: ['latin']</code> and only those files get a <code>&lt;link rel="preload"&gt;</code> — the rest still self-host and load on demand via{' '}
                <code>unicode-range</code>. Shared subsets are preloaded once.
              </p>
            </article>
            <article>
              <h3>Zero-CLS fallback</h3>
              <p>
                vite-font reads each font's real metrics with fontkit and emits a fallback <code>@font-face</code> with <code>size-adjust</code> plus ascent / descent overrides, so
                the swap to the web font doesn't shift your layout.
              </p>
            </article>
            <article>
              <h3>Dev + build parity</h3>
              <p>
                Self-hosted files are served from memory in dev and emitted into <code>dist/</code> for production — the same stable URLs in both, no config drift.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span className="footer-mark">vite-font</span>
        <span className="footer-sep">·</span>
        <a href="https://www.npmjs.com/package/vite-font">npm</a>
        <span className="footer-sep">·</span>
        <a href="https://github.com/rishi-raj-jain/vite-font">GitHub</a>
      </footer>
    </>
  )
}
