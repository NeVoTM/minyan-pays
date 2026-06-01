import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves org repos at https://<org>.github.io/<repo>/
const base = process.env.GITHUB_PAGES === 'true' ? '/slinkys/' : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
