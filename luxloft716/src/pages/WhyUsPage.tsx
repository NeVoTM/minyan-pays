import { Button } from '../components/Button'
import { BRAND, FEATURES } from '../data/content'

export function WhyUsPage() {
  return (
    <div>
      <section className="border-b border-white/10 bg-lux-surface px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold md:text-5xl">Why {BRAND.name}?</h1>
          <p className="mt-4 max-w-2xl text-lg text-lux-muted">
            Location, luxury, and freedom to build your business on your terms—with {BRAND.name} in Western New York.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
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

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="rounded-lg border border-lux-border bg-lux-elevated p-8">
              <h2 className="text-xl font-semibold text-lux-red">{f.title}</h2>
              <p className="mt-3 text-lux-muted">{f.description}</p>
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
