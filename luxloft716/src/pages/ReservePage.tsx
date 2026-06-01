import { Link } from 'react-router-dom'
import { BRAND } from '../data/content'

export function ReservePage() {
  return (
    <div>
      <section className="bg-ink px-4 py-16 text-white lg:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold md:text-5xl">Reserve A Unit</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Secure your private salon suite at {BRAND.name}. Limited availability—act today.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 lg:px-6">
        <div className="rounded-lg border border-gold/40 bg-gold/10 p-6 text-center">
          <h2 className="text-xl font-semibold">First 6 Weeks FREE Rent</h2>
          <p className="mt-2 text-ink/80">Limited time offer for new tenants only</p>
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
            const body = encodeURIComponent(
              `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`,
            )
            window.location.href = `mailto:${BRAND.email}?subject=${subject}&body=${body}`
          }}
        >
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Your Name
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-sm border border-black/20 bg-white px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Your Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-sm border border-black/20 bg-white px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full rounded-sm border border-black/20 bg-white px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium">
              Tell us about your business
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              className="w-full rounded-sm border border-black/20 bg-white px-4 py-3"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-sm bg-gold py-3 text-sm font-semibold tracking-wide text-ink uppercase hover:bg-gold-dark"
          >
            Submit Inquiry
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-ink/70">
          Prefer to talk? Call{' '}
          <a href={BRAND.phoneHref} className="font-semibold text-gold-dark hover:underline">
            {BRAND.phone}
          </a>{' '}
          or{' '}
          <Link to="/contact" className="font-semibold text-gold-dark hover:underline">
            schedule a tour
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
