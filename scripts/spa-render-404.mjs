/**
 * Static hosts need a real file per SPA route (or 404.html fallback).
 * GitHub Pages often shows a 404 on mobile for /login even with 404.html — route folders fix that.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const index = join(dist, 'index.html')
const fallback = join(dist, '404.html')

/** Routes from src/App.tsx */
const routes = ['', 'search', 'login', 'login/team', 'app', 'team/app']

if (!existsSync(index)) {
  console.error('spa-render-404: dist/index.html missing — run vite build first')
  process.exit(1)
}

copyFileSync(index, fallback)

for (const route of routes) {
  if (route === '') continue
  const dir = join(dist, route)
  mkdirSync(dir, { recursive: true })
  copyFileSync(index, join(dir, 'index.html'))
}

// GitHub Pages: skip Jekyll processing
copyFileSync(join(root, 'public', '.nojekyll'), join(dist, '.nojekyll'))

console.log('spa-render-404: wrote 404.html + route index shells for GitHub Pages deep links')
