import { Link } from 'react-router-dom'
import { BRAND } from '../data/content'

const inputClass =
  'w-full rounded-sm border border-lux-border bg-lux-black px-4 py-3 text-white placeholder:text-lux-muted focus:border-lux-red focus:outline-none focus:ring-1 focus:ring-lux-red'

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

        <form
          className="mt-10 space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            const data = new FormData(form)
            const name = String(data.get('name') ?? '')
            const email = String(data.get('email') ?? '')
            const phone = String(data.get('phone') ?? '')
            const message = String(data.get('message') ?? '')
            const subject = encodeURIComponent(`${BRAND.name} — Reserve A Unit`)
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`)
            window.location.href = `mailto:${BRAND.email}?subject=${subject}&body=${body}`
          }}
        >
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-white/90">
              Your Name
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-white/90">
              Your Email
            </label>
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-white/90">
              Phone
            </label>
            <input id="phone" name="phone" type="tel" className={inputClass} />
          </div>
          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium text-white/90">
              Tell us about your business
            </label>
            <textarea id="message" name="message" rows={5} className={inputClass} />
          </div>
          <button
            type="submit"
            className="w-full rounded-sm bg-lux-red py-3 text-sm font-semibold tracking-wide text-white uppercase hover:bg-lux-red-dark"
          >
            Submit Inquiry
          </button>
        </form>

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
