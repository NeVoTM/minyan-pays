/** Full URL FormSubmit redirects to after a successful POST (GitHub Pages base-aware). */
export function formSubmitReturnUrl(path: string, submitted: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  const relative = `${path.replace(/^\//, '')}?submitted=${encodeURIComponent(submitted)}`
  return new URL(relative, `${window.location.origin}${base}`).href
}
