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
      <section className="border-b border-white/10 bg-lux-surface px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-semibold md:text-5xl">Professionals Directory</h1>
          <p className="mt-4 max-w-2xl text-lg text-lux-muted">
            Meet the independent beauty professionals building their brands at {BRAND.name}.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {PLACEHOLDER_PROS.map((pro) => (
            <article
              key={pro.suite}
              className="rounded-lg border border-lux-border bg-lux-elevated p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-lux-red/40 bg-lux-black text-2xl font-semibold text-lux-red">
                {pro.name.charAt(0)}
              </div>
              <h2 className="text-lg font-semibold">{pro.name}</h2>
              <p className="text-sm text-lux-red">{pro.specialty}</p>
              <p className="mt-1 text-sm text-lux-muted">{pro.suite}</p>
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
