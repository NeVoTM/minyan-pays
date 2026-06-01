import { Button } from '../components/Button'
import { BRAND, SALON_SUITE_BENEFITS } from '../data/content'

export function WhatIsSalonSuitePage() {
  return (
    <div>
      <section className="bg-ink px-4 py-16 text-white lg:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold md:text-5xl">What Is A Salon Suite?</h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-6 text-lg text-ink/85">
            <p>
              A salon suite is one of the fastest-growing segments in the industry. It&apos;s a personal studio that
              allows you to have your own space and privacy. You could come and go as you please, considering the
              premise is open 24/7, just as if you owned your own salon.
            </p>
            <p>
              A salon suite is a full set-up—a private mini salon you can rent. It comes equipped with most equipment and
              furniture and is usually move-in ready. Salon suites are often located in a large commercial space that
              other similar professionals also occupy, each behind their own private door.
            </p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=900&q=80"
            alt="Private salon suite"
            className="rounded-lg shadow-lg"
          />
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {SALON_SUITE_BENEFITS.map((b) => (
            <article key={b.title} className="rounded-lg border border-black/10 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-gold-dark">{b.title}</h2>
              <p className="mt-3 text-ink/75">{b.description}</p>
            </article>
          ))}
        </div>

        <p className="mt-12 text-center text-lg font-medium">
          We have limited spaces available. Give us a call today to save your spot at {BRAND.name}.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button to="/contact" variant="secondary">
            Schedule A Tour
          </Button>
          <a
            href={BRAND.phoneHref}
            className="inline-flex items-center justify-center rounded-sm border-2 border-ink px-6 py-3 text-sm font-semibold tracking-wide uppercase hover:bg-ink hover:text-white"
          >
            {BRAND.phone}
          </a>
        </div>
      </section>
    </div>
  )
}
