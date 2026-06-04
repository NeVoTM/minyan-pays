import { BRAND } from '../data/content'

export type InquiryPayload = {
  name: string
  email: string
  phone: string
  message: string
}

/** POST inquiry to FormSubmit → forwards to {BRAND.email} (static site, no API server). */
export async function submitInquiry(subject: string, payload: InquiryPayload): Promise<void> {
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(BRAND.email)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      _subject: subject,
      _captcha: 'false',
      _template: 'table',
    }),
  })

  if (!res.ok) {
    throw new Error(`Submit failed (${res.status})`)
  }

  const data = (await res.json().catch(() => null)) as { success?: string | boolean } | null
  if (data?.success === false || data?.success === 'false') {
    throw new Error('Submit rejected')
  }
}
