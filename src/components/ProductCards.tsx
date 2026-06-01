import { Building2, Check, Users, Zap } from 'lucide-react'

const products = [
  {
    id: 'instant-suite',
    icon: Zap,
    badge: 'Best for everyone',
    title: 'Instant Suite',
    subtitle: 'Simply search our network, find a suite, and make your reservation — instantly.',
    features: [
      'On-demand styling suites',
      'Treatment rooms',
      'Private booths',
      'Pay-as-you-go',
      'No commitment',
    ],
    cta: 'Find your suite',
    ctaHref: '/login',
    primary: true,
  },
  {
    id: 'suite-teams',
    icon: Users,
    badge: 'Best for teams & schools',
    title: 'Suite Teams',
    subtitle:
      'Provide flexible suite access for your entire team, salon school, or brand with admin controls.',
    features: [
      'Everything in Instant Suite +',
      'Utilization-based pricing',
      'Admin dashboard with budget controls',
      'Consolidated billing',
      'Live reporting and usage insights',
    ],
    cta: 'Book a demo',
    ctaHref: '/login/team',
    primary: false,
  },
]

export function ProductCards() {
  return (
    <section className="border-y border-brand-border bg-brand-surface px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-red">
            Two options for getting the space you need
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-brand-white">
            Choose your path
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {products.map((product) => (
            <div
              key={product.id}
              id={product.id}
              className={`flex flex-col rounded-2xl border p-8 ${
                product.primary
                  ? 'border-brand-red bg-brand-red/5'
                  : 'border-brand-border bg-brand-black'
              }`}
            >
              <div className="flex items-start justify-between">
                <product.icon
                  size={32}
                  className={product.primary ? 'text-brand-red' : 'text-brand-white'}
                />
                <span className="rounded-full border border-brand-border px-3 py-1 text-xs font-medium text-brand-muted">
                  {product.badge}
                </span>
              </div>

              <h3 className="mt-6 font-serif text-2xl font-bold text-brand-white">
                {product.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{product.subtitle}</p>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-brand-white">
                    <Check size={16} className="mt-0.5 shrink-0 text-brand-red" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={product.ctaHref}
                className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
                  product.primary
                    ? 'bg-brand-red text-brand-white hover:bg-brand-red-dark'
                    : 'border border-brand-border text-brand-white hover:border-brand-red'
                }`}
              >
                {product.cta}
              </a>
            </div>
          ))}
        </div>

        <div
          id="contact"
          className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-brand-border bg-brand-black p-8 text-center sm:flex-row sm:justify-between sm:text-left"
        >
          <div className="flex items-center gap-3">
            <Building2 className="text-brand-red" size={28} />
            <div>
              <p className="font-semibold text-brand-white">Need help choosing?</p>
              <p className="text-sm text-brand-muted">
                Book a demo with an expert or call{' '}
                <a href="tel:+17165550100" className="text-brand-red hover:underline">
                  (716) 555-0100
                </a>
              </p>
            </div>
          </div>
          <a
            href="mailto:hello@lucloft716.com"
            className="rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-brand-white transition hover:bg-brand-red-dark"
          >
            Book a demo
          </a>
        </div>
      </div>
    </section>
  )
}
