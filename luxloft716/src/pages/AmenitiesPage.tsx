import { Button } from '../components/Button'
import { AMENITIES, BRAND } from '../data/content'

export function AmenitiesPage() {
  return (
    <div>
      <section className="bg-ink px-4 py-16 text-white lg:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.35em] text-gold uppercase">Amenities</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{BRAND.name} Amenities</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Everything you need to run a thriving beauty business—included in your suite rental.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <ul className="space-y-5">
            {AMENITIES.map((item) => (
              <li
                key={item}
                className="flex items-center gap-4 rounded-lg border border-black/10 bg-white px-5 py-4 shadow-sm"
              >
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-gold" />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>
          <img
            src="https://images.unsplash.com/photo-1633681926022-84c23e8cb04d?w=900&q=80"
            alt="Suite interior with amenities"
            className="h-full min-h-[320px] rounded-lg object-cover shadow-lg"
          />
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Button to="/contact" variant="secondary">
            Schedule a Tour
          </Button>
          <Button to="/reserve">Reserve A Unit</Button>
        </div>
      </section>
    </div>
  )
}
