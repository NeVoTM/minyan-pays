import { MapPin, Phone, Mail } from 'lucide-react'
import { InquiryForm } from '../components/InquiryForm'
import { BRAND } from '../data/content'
import { Logo } from '../components/Logo'

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
              <MapPin className="mt-1 shrink-0 text-lux-red" size={22} />
              <div>
                <p className="font-semibold">Address</p>
                <a
                  href={BRAND.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lux-muted hover:text-lux-red-bright"
                >
                  {BRAND.addressLine1}
                  <br />
                  {BRAND.addressLine2}
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-lux-border bg-lux-elevated p-8">
            <InquiryForm
              subject={`${BRAND.name} — Tour Request`}
              submitLabel="Schedule Tour"
              successTitle="Tour request received!"
              successMessage={`Thank you! We received your tour request and will contact you shortly to confirm a visit to ${BRAND.name}.`}
              messageLabel="Message"
              messagePlaceholder="I'd like to schedule a tour..."
              formTitle="Send a message"
              idPrefix="contact"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
