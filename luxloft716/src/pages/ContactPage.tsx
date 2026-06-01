import { MapPin, Phone, Mail } from 'lucide-react'
import { BRAND } from '../data/content'

export function ContactPage() {
  return (
    <div>
      <section className="bg-ink px-4 py-16 text-white lg:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold md:text-5xl">Schedule A Tour</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            See our suites in person and find the perfect space for your business.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Phone className="mt-1 text-gold" size={22} />
              <div>
                <p className="font-semibold">Phone</p>
                <a href={BRAND.phoneHref} className="text-ink/80 hover:text-gold-dark">
                  {BRAND.phone}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="mt-1 text-gold" size={22} />
              <div>
                <p className="font-semibold">Email</p>
                <a href={`mailto:${BRAND.email}`} className="text-ink/80 hover:text-gold-dark">
                  {BRAND.email}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 text-gold" size={22} />
              <div>
                <p className="font-semibold">Location</p>
                <p className="text-ink/80">{BRAND.location}</p>
                <p className="mt-2 text-sm text-ink/60">Update street address in src/data/content.ts when ready.</p>
              </div>
            </div>
          </div>

          <form
            className="space-y-5 rounded-lg border border-black/10 bg-white p-8 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              const name = String(data.get('name') ?? '')
              const email = String(data.get('email') ?? '')
              const phone = String(data.get('phone') ?? '')
              const message = String(data.get('message') ?? '')
              const subject = encodeURIComponent(`${BRAND.name} — Tour Request`)
              const body = encodeURIComponent(
                `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`,
              )
              window.location.href = `mailto:${BRAND.email}?subject=${subject}&body=${body}`
            }}
          >
            <h2 className="text-xl font-semibold">Send a message</h2>
            <div>
              <label htmlFor="contact-name" className="mb-1 block text-sm font-medium">
                Your Name
              </label>
              <input
                id="contact-name"
                name="name"
                required
                className="w-full rounded-sm border border-black/20 px-4 py-3"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-1 block text-sm font-medium">
                Your Email Address
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                className="w-full rounded-sm border border-black/20 px-4 py-3"
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="mb-1 block text-sm font-medium">
                Phone
              </label>
              <input id="contact-phone" name="phone" type="tel" className="w-full rounded-sm border border-black/20 px-4 py-3" />
            </div>
            <div>
              <label htmlFor="contact-message" className="mb-1 block text-sm font-medium">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                placeholder="I'd like to schedule a tour..."
                className="w-full rounded-sm border border-black/20 px-4 py-3"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-sm bg-ink py-3 text-sm font-semibold tracking-wide text-white uppercase hover:bg-charcoal"
            >
              Send to Email
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
