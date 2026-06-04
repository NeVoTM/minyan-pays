import { Button } from '../components/Button'
import { SectionLabel } from '../components/SectionLabel'
import { AMENITIES, BRAND, SITE_IMAGES } from '../data/content'

export function AmenitiesPage() {
  return (
    <div>
      <section className="border-b border-white/10 bg-lux-surface px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionLabel className="justify-start">Amenities</SectionLabel>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{BRAND.name} Amenities</h1>
          <p className="mt-4 max-w-2xl text-lg text-lux-muted">
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
                className="flex items-center gap-4 rounded-lg border border-lux-border bg-lux-elevated px-5 py-4"
              >
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-lux-red" />
                <span className="font-medium text-white/95">{item}</span>
              </li>
            ))}
          </ul>
          <img
            src={SITE_IMAGES.amenities}
            alt="Suite interior with amenities"
            className="h-full min-h-[320px] rounded-lg border border-lux-border object-cover shadow-lg"
          />
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Button to="/contact" variant="primary">
            Schedule a Tour
          </Button>
          <Button to="/reserve" variant="outline">
            Reserve A Unit
          </Button>
        </div>
      </section>
    </div>
  )
}
