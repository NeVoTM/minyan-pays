import {
  ArrowRight,
  Building2,
  Clock,
  Droplets,
  Sparkles,
  Wifi,
  WashingMachine,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { BrandHeroLogo } from '../components/Logo'
import { SectionLabel } from '../components/SectionLabel'
import { AMENITIES, BRAND, FEATURES, GALLERY_IMAGES, SALON_SUITE_BENEFITS, SITE_IMAGES } from '../data/content'

const amenityIcons = [Clock, Sparkles, Droplets, Wifi, Building2, Building2, WashingMachine, Building2]

export function HomePage() {
  return (
    <>
      <section className="relative min-h-[85vh] overflow-hidden bg-lux-black text-white">
        <img
          src={SITE_IMAGES.hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-lux-black via-lux-black/90 to-lux-black" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center lg:px-6 lg:py-28">
          <BrandHeroLogo className="mx-auto max-w-[min(100%,420px)]" />
          <h1 className="mt-8 max-w-2xl text-3xl leading-tight font-semibold md:text-4xl lg:text-5xl">
            The Ultimate Salon Experience at {BRAND.name}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/80">
            Premier salon suites for beauty professionals in Buffalo—luxurious, move-in-ready spaces to grow your brand.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button to="/contact" variant="primary">
              Schedule a Tour
            </Button>
            <Button to="/professionals" variant="outline" className="border-white text-white hover:bg-white hover:text-lux-black">
              Book a Service
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-lux-red/40 bg-lux-red">
        <div className="mx-auto max-w-4xl px-4 py-10 text-center lg:px-6">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            First 6 Weeks <span className="underline decoration-white/50 decoration-2 underline-offset-4">FREE Rent</span>
          </h2>
          <p className="mt-2 text-white/90">Limited time offer for new tenants only</p>
          <div className="mt-6">
            <Button to="/contact" variant="secondary">
              Schedule a Tour
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
        <SectionLabel>{BRAND.tagline}</SectionLabel>
        <h2 className="mt-6 text-center text-3xl font-semibold md:text-4xl">We Created Unique, Singular Spaces</h2>
        <p className="mx-auto mt-6 max-w-3xl text-center text-lg text-lux-muted">
          {BRAND.name} is a premier destination for beauty professionals looking for a luxurious and fully equipped
          workspace to showcase their skills. With a wide range of amenities, we offer a comfortable and professional
          environment for hair stylists, nail technicians, estheticians, and other beauty experts.
        </p>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="overflow-hidden rounded-lg border border-lux-border bg-lux-elevated text-center shadow-sm"
            >
              <img src={f.image} alt={f.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div className="p-8">
                <h3 className="text-xl font-semibold text-lux-red-bright">{f.title}</h3>
                <p className="mt-3 text-lux-muted">{f.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-lux-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:px-6">
          <div>
            <h2 className="text-3xl font-semibold md:text-4xl">{BRAND.name} Amenities</h2>
            <ul className="mt-8 space-y-4">
              {AMENITIES.map((item, i) => {
                const Icon = amenityIcons[i] ?? Building2
                return (
                  <li key={item} className="flex items-start gap-3">
                    <Icon className="mt-0.5 shrink-0 text-lux-red" size={20} />
                    <span className="text-white/90">{item}</span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button to="/amenities" variant="secondary">
                Learn More
              </Button>
              <Button to="/contact" variant="outline">
                Schedule a Tour
              </Button>
            </div>
          </div>
          <img
            src={SITE_IMAGES.amenities}
            alt={`${BRAND.name} suite amenities`}
            className="rounded-lg border border-lux-border shadow-2xl shadow-lux-red/10"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <img
            src={SITE_IMAGES.location}
            alt={`${BRAND.name} location`}
            className="rounded-lg border border-lux-border shadow-lg"
          />
          <div>
            <h2 className="text-3xl font-semibold md:text-4xl">Why Us?</h2>
            <p className="mt-6 text-lg text-lux-muted">
              Why is {BRAND.name} your premier salon suite destination? Location is key—and we are strategically
            positioned in Western New York with strong visibility in the {BRAND.name} market. High visibility and steady traffic help beauty
              professionals attract new clients, grow their books, and maximize earning potential.
            </p>
            <Link
              to="/why-us"
              className="mt-6 inline-flex items-center gap-2 font-semibold text-lux-red-bright hover:text-white"
            >
              Learn More <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-lux-elevated">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <img
              src={SITE_IMAGES.salonSuite}
              alt="What is a salon suite"
              className="rounded-lg border border-lux-border shadow-lg"
            />
            <div>
              <h2 className="text-3xl font-semibold md:text-4xl">What Is A Salon Suite?</h2>
              <p className="mt-6 text-lux-muted">
                A salon suite is one of the fastest-growing segments in the industry. It&apos;s a personal studio that
                allows you to have your own space and privacy. Come and go as you please—the building is open 24/7, just
                as if you owned your own salon.
              </p>
              <p className="mt-4 text-lux-muted">
                A salon suite is a full set-up: a private mini salon you can rent, equipped with most furniture and
                equipment, usually move-in ready. Suites are located in a commercial space shared with other beauty
                professionals—each with their own private door.
              </p>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {SALON_SUITE_BENEFITS.map((b) => (
                  <div key={b.title}>
                    <h3 className="font-semibold text-lux-red">{b.title}</h3>
                    <p className="mt-2 text-sm text-lux-muted">{b.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Button to="/what-is-a-salon-suite">Read Full Guide</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
        <h2 className="text-center text-3xl font-semibold md:text-4xl">Gallery</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY_IMAGES.map((img) => (
            <figure
              key={img.src}
              className="group overflow-hidden rounded-lg border border-lux-border ring-1 ring-lux-red/0 transition-[box-shadow] hover:ring-lux-red/40"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </figure>
          ))}
        </div>
      </section>

      <section className="border-t border-lux-red/30 bg-lux-red">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-6">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">Exclusive Opportunity at {BRAND.name}</h2>
          <p className="mt-4 text-white/90">
            First 6 weeks FREE rent—limited time for new tenants. {BRAND.slogan}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button to="/reserve" variant="secondary">
              Claim Your Offer Today
            </Button>
            <a
              href={BRAND.phoneHref}
              className="inline-flex items-center justify-center rounded-sm border-2 border-white px-6 py-3 text-sm font-semibold tracking-wide text-white uppercase hover:bg-white hover:text-lux-black"
            >
              {BRAND.phone}
            </a>
          </div>
          <p className="mt-6 text-sm text-white/75">Limited spaces available. Call today to save your spot.</p>
        </div>
      </section>
    </>
  )
}
