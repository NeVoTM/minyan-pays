import { MapPin, Phone, Mail } from 'lucide-react'
import { BRAND } from '../data/content'
import { Logo } from '../components/Logo'

const inputClass =
  'w-full rounded-sm border border-lux-border bg-lux-black px-4 py-3 text-white placeholder:text-lux-muted focus:border-lux-red focus:outline-none focus:ring-1 focus:ring-lux-red'

export function ContactPage() {
  return (
    <div>
      <section className="border-b border-white/10 bg-lux-surface px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <Logo variant="compact" className="mb-6" />
          <h1 className="text-4xl font-semibold md:text-5xl">Schedule A Tour</h1>
          <p className="mt-4 max-w-2xl text-lg text-lux-muted">
            See our suites in person and find the perfect space for your business.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Phone className="mt-1 text-lux-red" size={22} />
              <div>
                <p className="font-semibold">Phone</p>
                <a href={BRAND.phoneHref} className="text-lux-muted hover:text-lux-red-bright">
                  {BRAND.phone}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="mt-1 text-lux-red" size={22} />
              <div>
                <p className="font-semibold">Email</p>
                <a href={`mailto:${BRAND.email}`} className="text-lux-muted hover:text-lux-red-bright">
                  {BRAND.emailDisplay}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 text-lux-red" size={22} />
              <div>
                <p className="font-semibold">Location</p>
                <p className="text-lux-muted">{BRAND.location}</p>
                <p className="mt-2 text-sm text-lux-muted/80">Update street address in src/data/content.ts when ready.</p>
              </div>
            </div>
          </div>

          <form
            className="space-y-5 rounded-lg border border-lux-border bg-lux-elevated p-8"
            onSubmit={(e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              const name = String(data.get('name') ?? '')
              const email = String(data.get('email') ?? '')
              const phone = String(data.get('phone') ?? '')
              const message = String(data.get('message') ?? '')
              const subject = encodeURIComponent(`${BRAND.name} — Tour Request`)
              const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`)
              window.location.href = `mailto:${BRAND.email}?subject=${subject}&body=${body}`
            }}
          >
            <h2 className="text-xl font-semibold">Send a message</h2>
            <div>
              <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-white/90">
                Your Name
              </label>
              <input id="contact-name" name="name" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-white/90">
                Your Email Address
              </label>
              <input id="contact-email" name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="contact-phone" className="mb-1 block text-sm font-medium text-white/90">
                Phone
              </label>
              <input id="contact-phone" name="phone" type="tel" className={inputClass} />
            </div>
            <div>
              <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-white/90">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                placeholder="I'd like to schedule a tour..."
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-sm bg-lux-red py-3 text-sm font-semibold tracking-wide text-white uppercase hover:bg-lux-red-dark"
            >
              Send to Email
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
