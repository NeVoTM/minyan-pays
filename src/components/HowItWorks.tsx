import { CalendarCheck, KeyRound, Search } from 'lucide-react'

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Search the network',
    description:
      'Browse fully equipped salon suites across Buffalo and Western New York by location, date, and specialty.',
  },
  {
    icon: CalendarCheck,
    step: '02',
    title: 'Book instantly',
    description:
      'Reserve by the hour, half-day, or full day. Pay as you go with transparent pricing — no hidden fees.',
  },
  {
    icon: KeyRound,
    step: '03',
    title: 'Check in & create',
    description:
      'Use your mobile pass to unlock your suite. Everything you need — chair, sink, lighting, Wi-Fi — is ready.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-red">
            Simple &amp; seamless
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-brand-white">
            How LucLoft716 works
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-brand-border bg-brand-surface p-8"
            >
              <span className="font-serif text-5xl font-bold text-brand-red/20">{item.step}</span>
              <item.icon size={28} className="mt-4 text-brand-red" />
              <h3 className="mt-4 font-serif text-xl font-bold text-brand-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
