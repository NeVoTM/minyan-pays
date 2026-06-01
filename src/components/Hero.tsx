import { SearchBar } from './SearchBar'

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(227,0,0,0.12),transparent_60%)]" />

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
          Elevate your craft. Own your space.
        </p>

        <h1 className="font-serif text-4xl font-bold leading-tight text-brand-white sm:text-5xl lg:text-6xl">
          Find a salon suite, styling chair, or treatment room{' '}
          <span className="text-brand-red">on-demand.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-brand-muted sm:text-lg">
          Search, book, and check in instantly to fully equipped salon suites across
          Western New York — whether you need a quiet booth for a private client or a
          bustling suite with premium amenities.
        </p>

        <div className="mx-auto mt-10 max-w-3xl">
          <SearchBar />
        </div>
      </div>
    </section>
  )
}
