import { Button } from '../components/Button'
import { BRAND, SUITE_LISTINGS } from '../data/content'

export function ProfessionalsPage() {
  return (
    <div>
      <section className="border-b border-white/10 bg-lux-surface px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold md:text-5xl">Professionals Directory</h1>
          <p className="mt-4 max-w-2xl text-lg text-lux-muted">
            Meet the independent beauty professionals building their brands at {BRAND.name}—and explore suites still
            available for new tenants.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {SUITE_LISTINGS.map((listing) => (
            <article
              key={listing.suite}
              className="overflow-hidden rounded-lg border border-lux-border bg-lux-elevated text-center"
            >
              <img
                src={listing.image}
                alt={listing.imageAlt}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              <div className="p-6">
                <p className="text-xs font-semibold tracking-wide text-lux-red uppercase">{listing.name}</p>
                <h2 className="mt-2 text-lg font-semibold">{listing.specialty}</h2>
                <p className="mt-1 text-sm text-lux-muted">{listing.suite}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-lux-muted">Are you a beauty professional interested in joining {BRAND.name}?</p>
          <div className="mt-4">
            <Button to="/reserve">Reserve A Unit</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
