import { Link } from 'react-router-dom'
import { InquiryForm } from '../components/InquiryForm'
import { BRAND } from '../data/content'

export function ReservePage() {
  return (
    <div>
      <section className="border-b border-white/10 bg-lux-surface px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold md:text-5xl">Reserve A Unit</h1>
          <p className="mt-4 max-w-2xl text-lg text-lux-muted">
            Secure your private salon suite at {BRAND.name}. Limited availability—act today.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 lg:px-6">
        <div className="rounded-lg border border-lux-red/50 bg-lux-red/10 p-6 text-center">
          <h2 className="text-xl font-semibold text-lux-red-bright">First 6 Weeks FREE Rent</h2>
          <p className="mt-2 text-lux-muted">Limited time offer for new tenants only</p>
        </div>

        <div className="mt-10">
          <InquiryForm
            subject={`${BRAND.name} — Reserve A Unit`}
            submitLabel="Submit Inquiry"
            successTitle="Inquiry received!"
            successMessage={`Thank you for your interest in ${BRAND.name}. We received your reservation inquiry and will follow up within one business day.`}
            returnPath="/reserve"
            successParam="reserve"
            messageLabel="Tell us about your business"
            idPrefix="reserve"
          />
        </div>

        <p className="mt-8 text-center text-sm text-lux-muted">
          Prefer to talk? Call{' '}
          <a href={BRAND.phoneHref} className="font-semibold text-lux-red-bright hover:underline">
            {BRAND.phone}
          </a>{' '}
          or{' '}
          <Link to="/contact" className="font-semibold text-lux-red-bright hover:underline">
            schedule a tour
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
