const stats = [
  {
    value: '78%',
    label: 'of independent stylists prefer flexible suite access over long-term leases.',
  },
  {
    value: '64%',
    label: 'of beauty professionals say owning their schedule drives higher client satisfaction.',
  },
  {
    value: '52%',
    label: 'would switch locations if they couldn\u2019t book on-demand when they need it.',
  },
  {
    value: '2.1M',
    label: 'licensed beauty professionals in the US seeking flexible workspace options.',
  },
]

export function StatsSection() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="font-serif text-3xl font-bold text-brand-white sm:text-4xl">
            Truth in numbers.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-muted">
            When beauty professionals work in convenient, comfortable, and fully equipped
            suites they experience higher client satisfaction and income potential. LuxLoft716
            gives every stylist, esthetician, and barber managed access to premium salon
            suites — on their schedule, without the overhead of a full lease.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.value}
              className="rounded-2xl border border-brand-border bg-brand-surface p-6"
            >
              <p className="font-serif text-4xl font-bold text-brand-red">{stat.value}</p>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
