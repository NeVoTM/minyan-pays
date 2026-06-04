import { CheckCircle2, Loader2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { BRAND } from '../data/content'
import { submitInquiry } from '../lib/submitInquiry'

const inputClass =
  'w-full rounded-sm border border-lux-border bg-lux-black px-4 py-3 text-white placeholder:text-lux-muted focus:border-lux-red focus:outline-none focus:ring-1 focus:ring-lux-red'

type InquiryFormProps = {
  subject: string
  submitLabel: string
  successTitle: string
  successMessage: string
  messageLabel?: string
  messagePlaceholder?: string
  formTitle?: string
  idPrefix?: string
  className?: string
}

export function InquiryForm({
  subject,
  submitLabel,
  successTitle,
  successMessage,
  messageLabel = 'Message',
  messagePlaceholder,
  formTitle,
  idPrefix = 'inquiry',
  className = 'space-y-5',
}: InquiryFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const statusRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      await submitInquiry(subject, {
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        phone: String(data.get('phone') ?? ''),
        message: String(data.get('message') ?? ''),
      })
      form.reset()
      setStatus('success')
      requestAnimationFrame(() => {
        statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    } catch {
      setStatus('error')
      requestAnimationFrame(() => {
        statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }

  if (status === 'success') {
    return (
      <div
        ref={statusRef}
        className="rounded-lg border border-green-500/40 bg-green-500/10 p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="mx-auto text-green-400" size={48} aria-hidden />
        <h2 className="mt-4 text-2xl font-semibold text-white">{successTitle}</h2>
        <p className="mt-3 text-lux-muted">{successMessage}</p>
        <p className="mt-4 text-sm text-lux-muted">
          Need help sooner? Call{' '}
          <a href={BRAND.phoneHref} className="font-semibold text-lux-red-bright hover:underline">
            {BRAND.phone}
          </a>
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-8 rounded-sm border border-white/20 px-6 py-2 text-sm font-semibold text-white hover:border-lux-red hover:text-lux-red-bright"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div ref={statusRef}>
      {status === 'error' && (
        <div
          className="mb-5 rounded-lg border border-lux-red/50 bg-lux-red/10 p-4 text-sm text-white/90"
          role="alert"
          aria-live="assertive"
        >
          Something went wrong sending your message. Please call{' '}
          <a href={BRAND.phoneHref} className="font-semibold text-lux-red-bright hover:underline">
            {BRAND.phone}
          </a>{' '}
          or email{' '}
          <a href={`mailto:${BRAND.email}`} className="font-semibold text-lux-red-bright hover:underline">
            {BRAND.emailDisplay}
          </a>
          .
        </div>
      )}

      <form className={className} onSubmit={handleSubmit}>
        {formTitle ? <h2 className="text-xl font-semibold">{formTitle}</h2> : null}
        <div>
          <label htmlFor={`${idPrefix}-name`} className="mb-1 block text-sm font-medium text-white/90">
            Your Name
          </label>
          <input id={`${idPrefix}-name`} name="name" required className={inputClass} disabled={status === 'submitting'} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-email`} className="mb-1 block text-sm font-medium text-white/90">
            Your Email
          </label>
          <input
            id={`${idPrefix}-email`}
            name="email"
            type="email"
            required
            className={inputClass}
            disabled={status === 'submitting'}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-phone`} className="mb-1 block text-sm font-medium text-white/90">
            Phone
          </label>
          <input id={`${idPrefix}-phone`} name="phone" type="tel" className={inputClass} disabled={status === 'submitting'} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-message`} className="mb-1 block text-sm font-medium text-white/90">
            {messageLabel}
          </label>
          <textarea
            id={`${idPrefix}-message`}
            name="message"
            rows={formTitle ? 4 : 5}
            placeholder={messagePlaceholder}
            className={inputClass}
            disabled={status === 'submitting'}
          />
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-lux-red py-3 text-sm font-semibold tracking-wide text-white uppercase hover:bg-lux-red-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="animate-spin" size={18} aria-hidden />
              Sending…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </form>
    </div>
  )
}
