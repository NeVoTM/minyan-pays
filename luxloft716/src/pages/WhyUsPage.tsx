import { Button } from '../components/Button'
import { BRAND, FEATURES, SITE_IMAGES } from '../data/content'

export function WhyUsPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10 bg-lux-surface px-4 py-16 lg:px-6">
        <img
          src={SITE_IMAGES.whyUs}
          alt={`${BRAND.name} salon suites`}
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-lux-surface via-lux-surface/95 to-lux-surface/80" />
        <div className="relative mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold md:text-5xl">Why {BRAND.name}?</h1>
          <p className="mt-4 max-w-2xl text-lg text-lux-muted">
            Location, luxury, and freedom to build your business on your terms—with {BRAND.name} in Western New York.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <img
            src={SITE_IMAGES.location}
            alt={`${BRAND.name} Buffalo location`}
            className="rounded-lg border border-lux-border shadow-lg"
          />
          <div className="max-w-none space-y-6 text-lg text-lux-muted">
            <p>
              Why is {BRAND.name} your premier salon suite destination? Firstly, location is key to any business. We are
              strategically located in Western New York with strong visibility and convenient access for clients across
              Buffalo and surrounding communities. Beauty professionals who work at {BRAND.name} benefit from steady
              foot traffic and a professional address that helps grow clientele and maximize earning potential.
            </p>
            <p>
              Unlike a traditional booth rental, you control your schedule, your pricing, and your brand. Suites are
              private, secure, and designed for one-on-one client care—the experience modern guests expect.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="overflow-hidden rounded-lg border border-lux-border bg-lux-elevated">
              <img src={f.image} alt={f.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div className="p-8">
                <h2 className="text-xl font-semibold text-lux-red">{f.title}</h2>
                <p className="mt-3 text-lux-muted">{f.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <Button to="/contact" variant="primary">
            Schedule a Tour
          </Button>
        </div>
      </section>
    </div>
  )
}
