import { Button } from '../components/Button'
import { BRAND } from '../data/content'

const PLACEHOLDER_PROS = [
  { name: 'Your Name Here', specialty: 'Hair Stylist', suite: 'Suite 101' },
  { name: 'Your Name Here', specialty: 'Nail Technician', suite: 'Suite 102' },
  { name: 'Your Name Here', specialty: 'Esthetician', suite: 'Suite 103' },
]

export function ProfessionalsPage() {
  return (
    <div>
      <section className="bg-ink px-4 py-16 text-white lg:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold md:text-5xl">Professionals Directory</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Meet the independent beauty professionals building their brands at {BRAND.name}.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {PLACEHOLDER_PROS.map((pro) => (
            <article
              key={pro.suite}
              className="rounded-lg border border-black/10 bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gold/20 text-2xl font-semibold text-gold-dark">
                {pro.name.charAt(0)}
              </div>
              <h2 className="text-lg font-semibold">{pro.name}</h2>
              <p className="text-sm text-gold-dark">{pro.specialty}</p>
              <p className="mt-1 text-sm text-ink/60">{pro.suite}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-ink/70">
            Are you a beauty professional interested in joining {BRAND.name}?
          </p>
          <div className="mt-4">
            <Button to="/reserve">Reserve A Unit</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
