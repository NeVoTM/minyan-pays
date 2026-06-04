import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** GitHub project site: https://nevotm.github.io/minyan-pays/ — LuxLoft716 */
const githubPagesBase = process.env.GITHUB_PAGES === 'true' ? '/minyan-pays/' : undefined

export default defineConfig({
  base: githubPagesBase ?? '/',
  plugins: [react(), tailwindcss()],
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
})
