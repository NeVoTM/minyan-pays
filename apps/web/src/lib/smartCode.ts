/** Encode payload for QR / smart-code punch (must match API decodePunchSmartCode). */
export function encodePunchSmartCode(phoneDigits: string, pin: string): string {
  const payload = JSON.stringify({
    v: 1,
    p: phoneDigits.replace(/\D/g, '').slice(0, 10),
    pin,
  })
  return btoa(unescape(encodeURIComponent(payload)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
