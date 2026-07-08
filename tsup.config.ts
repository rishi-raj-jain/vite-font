import { defineConfig } from 'tsup'

export default defineConfig({
  dts: true,
  clean: true,
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  entry: ['src/index.ts'],
  // fontkit is a runtime dependency; keep vite as a peer.
  external: ['vite', 'fontkit'],
})
