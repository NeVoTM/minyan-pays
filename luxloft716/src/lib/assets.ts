/** Public folder paths — respect Vite base (GitHub Pages project site). */
export function asset(path: string): string {
  const clean = path.replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${clean}`
}
