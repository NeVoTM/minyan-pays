const cities = [
  'Buffalo',
  'Amherst',
  'Williamsville',
  'Cheektowaga',
  'Tonawanda',
  'Niagara Falls',
  'Hamburg',
  'Orchard Park',
  'East Aurora',
  'Lancaster',
  'Depew',
  'Kenmore',
  'West Seneca',
  'North Tonawanda',
  'Lockport',
  'Clarence',
  'Grand Island',
  'Ellicottville',
]

export function CityGrid() {
  return (
    <section className="border-y border-brand-border bg-brand-surface px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-red">
            Western New York &amp; growing
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-brand-white sm:text-3xl">
            Find a suite near you
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {cities.map((city) => (
            <a
              key={city}
              href={`/search?location=${encodeURIComponent(city + ', NY')}`}
              className="rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-white transition hover:border-brand-red hover:bg-brand-red/10"
            >
              {city}
            </a>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-brand-muted">
          18 cities across the 716 — and growing!
        </p>
      </div>
    </section>
  )
}
