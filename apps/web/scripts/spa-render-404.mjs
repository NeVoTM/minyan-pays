/**
 * Render static sites serve /404.html for unknown paths (no matching file).
 * Copy the SPA shell so deep links (/admin, /punch, …) load React Router.
 * @see https://community.render.com/t/custom-404-error-page/746
 */
import { copyFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const index = join(dist, 'index.html')
const fallback = join(dist, '404.html')

if (!existsSync(index)) {
  console.error('spa-render-404: dist/index.html missing — run vite build first')
  process.exit(1)
}
copyFileSync(index, fallback)
console.log('spa-render-404: wrote dist/404.html (copy of index.html) for Render SPA deep links')
