import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages: NeVoTM/Slinkys → /Slinkys/ ; minyan-pays fallback → /minyan-pays/
const pagesBase =
  process.env.PAGES_REPO === 'minyan-pays' ? '/minyan-pays/' : '/Slinkys/'
const base = process.env.GITHUB_PAGES === 'true' ? pagesBase : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
