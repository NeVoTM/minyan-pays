import { CheckCircle2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BRAND } from '../data/content'
import { formSubmitReturnUrl } from '../lib/formSubmitReturnUrl'

const inputClass =
  'w-full rounded-sm border border-lux-border bg-lux-black px-4 py-3 text-white placeholder:text-lux-muted focus:border-lux-red focus:outline-none focus:ring-1 focus:ring-lux-red'

type InquiryFormProps = {
  subject: string
  submitLabel: string
  successTitle: string
  successMessage: string
  /** Path for FormSubmit redirect, e.g. /contact */
  returnPath: string
  /** Query flag matched on return, e.g. tour | reserve */
  successParam: string
  messageLabel?: string
  /** Pre-filled message value (submitted with form). Select-all on focus for quick edits on mobile. */
  defaultMessage?: string
  formTitle?: string
  idPrefix?: string
  className?: string
}

export function InquiryForm({
  subject,
  submitLabel,
  successTitle,
  successMessage,
  returnPath,
  successParam,
  messageLabel = 'Message',
  defaultMessage = '',
  formTitle,
  idPrefix = 'inquiry',
  className = 'space-y-5',
}: InquiryFormProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchParams.get('submitted') === successParam) {
      setShowSuccess(true)
      setSearchParams({}, { replace: true })
      requestAnimationFrame(() => {
        statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }, [searchParams, setSearchParams, successParam])

  const formAction = `https://formsubmit.co/${encodeURIComponent(BRAND.email)}`
  const nextUrl = formSubmitReturnUrl(returnPath, successParam)

  if (showSuccess) {
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
          </a>{' '}
          or email{' '}
          <a href={`mailto:${BRAND.email}`} className="font-semibold text-lux-red-bright hover:underline">
            {BRAND.emailDisplay}
          </a>
        </p>
        <button
          type="button"
          onClick={() => setShowSuccess(false)}
          className="mt-8 rounded-sm border border-white/20 px-6 py-2 text-sm font-semibold text-white hover:border-lux-red hover:text-lux-red-bright"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div ref={statusRef}>
      <form action={formAction} method="POST" className={className}>
        <input type="hidden" name="_next" value={nextUrl} />
        <input type="hidden" name="_subject" value={subject} />
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_template" value="table" />
        <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />

        {formTitle ? <h2 className="text-xl font-semibold">{formTitle}</h2> : null}
        <div>
          <label htmlFor={`${idPrefix}-name`} className="mb-1 block text-sm font-medium text-white/90">
            Your Name
          </label>
          <input id={`${idPrefix}-name`} name="name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-email`} className="mb-1 block text-sm font-medium text-white/90">
            Your Email
          </label>
          <input id={`${idPrefix}-email`} name="email" type="email" required className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-phone`} className="mb-1 block text-sm font-medium text-white/90">
            Phone
          </label>
          <input id={`${idPrefix}-phone`} name="phone" type="tel" className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-message`} className="mb-1 block text-sm font-medium text-white/90">
            {messageLabel}
          </label>
          <textarea
            id={`${idPrefix}-message`}
            name="message"
            rows={formTitle ? 4 : 5}
            defaultValue={defaultMessage}
            className={inputClass}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-lux-red py-3 text-sm font-semibold tracking-wide text-white uppercase hover:bg-lux-red-dark"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  )
}
