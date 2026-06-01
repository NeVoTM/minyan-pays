import { Quote } from 'lucide-react'

export function Testimonial() {
  return (
    <section className="border-y border-brand-border px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <Quote size={40} className="mx-auto text-brand-red/40" />
        <blockquote className="mt-6 font-serif text-2xl leading-relaxed text-brand-white sm:text-3xl">
          &ldquo;LucLoft716 transformed the way I think about my business. I bookable to serve
          clients in a premium suite without the overhead of a full lease — it&apos;s the first
          option I recommend to every stylist starting out.&rdquo;
        </blockquote>
        <footer className="mt-8">
          <p className="font-semibold text-brand-white">Maria Santos</p>
          <p className="text-sm text-brand-muted">Independent colorist, Buffalo NY</p>
        </footer>
      </div>
    </section>
  )
}
