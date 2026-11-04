/**
 * Test runner: bundles tests/regression.test.tsx with esbuild (already a
 * dependency via Vite) and executes it as a plain Node ESM script.
 *
 *   node tests/run.mjs      (or: npm test)
 *
 * `import.meta.env.*` is compile-time only in Vite, so it is substituted here
 * with the same `define` mechanism Vite uses. CSS imports are stubbed empty —
 * the Websites.tsx import graph pulls in none, but site.css stays covered.
 */
import { build } from 'esbuild'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const frontend = path.resolve(here, '..')
const outfile = path.join(frontend, 'node_modules', '.cache', 'tests', 'regression.test.mjs')

/**
 * zustand v5 SSR renders the store's FROZEN initial state (getInitialState),
 * so the seeded restaurant must exist at import time. We therefore alias the
 * demoData import of useStore.ts to a fixture whose createSeedRestaurants()
 * returns the multilingual API-shaped restaurant. All other importers of
 * demoData (PLANS, SUBSCRIPTIONS, …) keep the real module.
 */
const useStoreSeedPlugin = {
  name: 'useStore-initial-state-fixture',
  setup(build) {
    build.onResolve({ filter: /lib\/demoData\.ts$/ }, (args) => {
      const importer = String(args.importer).replace(/\\/g, '/')
      if (importer.endsWith('src/shared/store/useStore.ts')) {
        return { path: path.join(here, 'fixtures', 'useStoreSeed.ts') }
      }
      return undefined
    })
  },
}

await build({
  entryPoints: [path.join(here, 'regression.test.tsx')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  target: 'es2022',
  absWorkingDir: frontend,
  outfile,
  logLevel: 'warning',
  plugins: [useStoreSeedPlugin],
  loader: { '.css': 'empty' },
  // bundled CJS deps (react-dom) still call require() for node builtins
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  define: {
    'import.meta.env.DEV': 'false',
    'import.meta.env.PROD': 'true',
    'import.meta.env.MODE': '"test"',
    'import.meta.env.BASE_URL': '"/"',
    'import.meta.env.VITE_API_URL': '"http://localhost:3000"',
  },
})

await import(pathToFileURL(outfile).href)
