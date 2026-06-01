import { Clock, MapPin, Star, Wifi } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { Footer } from '../components/Footer'

type Suite = {
  id: string
  name: string
  location: string
  neighborhood: string
  type: string
  priceHour: number
  rating: number
  reviews: number
  amenities: string[]
  image: string
}

const allSuites: Suite[] = [
  {
    id: '1',
    name: 'LuxLoft716 — Suite A',
    location: 'Buffalo, NY',
    neighborhood: 'Elmwood Village',
    type: 'Hair styling',
    priceHour: 28,
    rating: 4.9,
    reviews: 47,
    amenities: ['Shampoo bowl', 'Wash station', 'Premium lighting'],
    image: 'linear-gradient(135deg, #1a1a1a 0%, #2d0a0a 100%)',
  },
  {
    id: '2',
    name: 'Luxe Loft — Suite B',
    location: 'Buffalo, NY',
    neighborhood: 'Elmwood Village',
    type: 'Esthetics & skincare',
    priceHour: 32,
    rating: 4.8,
    reviews: 31,
    amenities: ['Treatment bed', 'Steamer', 'Private entrance'],
    image: 'linear-gradient(135deg, #1a1a1a 0%, #1a0a0a 100%)',
  },
  {
    id: '3',
    name: '716 Beauty Collective',
    location: 'Williamsville, NY',
    neighborhood: 'Main St',
    type: 'Nails & manicure',
    priceHour: 22,
    rating: 4.7,
    reviews: 58,
    amenities: ['Ventilation', 'UV lamp', 'Storage'],
    image: 'linear-gradient(135deg, #111 0%, #220000 100%)',
  },
  {
    id: '4',
    name: 'The Barber Booth',
    location: 'Amherst, NY',
    neighborhood: 'Transit Rd',
    type: 'Barber chair',
    priceHour: 25,
    rating: 4.9,
    reviews: 72,
    amenities: ['Hot towel', 'Mirror wall', 'Product display'],
    image: 'linear-gradient(135deg, #0a0a0a 0%, #330000 100%)',
  },
  {
    id: '5',
    name: 'Glow Studio Suite',
    location: 'Cheektowaga, NY',
    neighborhood: 'Walden Galleria area',
    type: 'Makeup studio',
    priceHour: 30,
    rating: 4.6,
    reviews: 19,
    amenities: ['Ring light', 'Vanity mirror', 'WiFi'],
    image: 'linear-gradient(135deg, #1a1a1a 0%, #400000 100%)',
  },
  {
    id: '6',
    name: 'Serenity Spa Room',
    location: 'Orchard Park, NY',
    neighborhood: 'Quaker St',
    type: 'Spa & massage',
    priceHour: 35,
    rating: 5.0,
    reviews: 24,
    amenities: ['Massage table', 'Aromatherapy', 'Sound system'],
    image: 'linear-gradient(135deg, #111 0%, #1a0505 100%)',
  },
]

export function SearchPage() {
  const [params] = useSearchParams()
  const location = params.get('location') ?? 'Buffalo, NY'
  const type = params.get('type') ?? ''

  const results = useMemo(() => {
    const city = location.split(',')[0]?.trim().toLowerCase() ?? ''
    return allSuites.filter((suite) => {
      const matchesCity =
        !city ||
        suite.location.toLowerCase().includes(city) ||
        suite.neighborhood.toLowerCase().includes(city)
      const matchesType = !type || suite.type.toLowerCase().includes(type.toLowerCase())
      return matchesCity && matchesType
    })
  }, [location, type])

  return (
    <div className="flex min-h-dvh flex-col bg-brand-black">
      <Header />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/"
            className="mb-6 inline-block text-sm text-brand-muted transition hover:text-brand-white"
          >
            &larr; Back to home
          </Link>

          <h1 className="font-serif text-3xl font-bold text-brand-white">Search results</h1>
          <p className="mt-2 text-brand-muted">
            {results.length} suite{results.length !== 1 ? 's' : ''} near{' '}
            <span className="text-brand-white">{location}</span>
            {type && (
              <>
                {' '}
                &middot; <span className="text-brand-white">{type}</span>
              </>
            )}
          </p>

          <div className="mt-6">
            <SearchBar compact />
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((suite) => (
              <article
                key={suite.id}
                className="overflow-hidden rounded-2xl border border-brand-border bg-brand-surface transition hover:border-brand-red/50"
              >
                <div
                  className="flex h-40 items-end p-4"
                  style={{ background: suite.image }}
                >
                  <span className="rounded-full bg-brand-red px-3 py-1 text-xs font-semibold text-brand-white">
                    {suite.type}
                  </span>
                </div>

                <div className="p-5">
                  <h2 className="font-serif text-lg font-bold text-brand-white">{suite.name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-brand-muted">
                    <MapPin size={14} className="text-brand-red" />
                    {suite.neighborhood}, {suite.location}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <Star size={14} className="fill-brand-red text-brand-red" />
                    <span className="text-sm font-medium text-brand-white">{suite.rating}</span>
                    <span className="text-sm text-brand-muted">({suite.reviews} reviews)</span>
                  </div>

                  <ul className="mt-3 flex flex-wrap gap-2">
                    {suite.amenities.map((a) => (
                      <li
                        key={a}
                        className="rounded-full border border-brand-border px-2.5 py-0.5 text-xs text-brand-muted"
                      >
                        {a}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-center justify-between border-t border-brand-border pt-4">
                    <div>
                      <span className="font-serif text-2xl font-bold text-brand-red">
                        ${suite.priceHour}
                      </span>
                      <span className="text-sm text-brand-muted"> / hour</span>
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-brand-white transition hover:bg-brand-red-dark"
                    >
                      <Clock size={14} />
                      Book now
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {results.length === 0 && (
            <div className="mt-16 text-center">
              <Wifi size={48} className="mx-auto text-brand-border" />
              <p className="mt-4 font-serif text-xl text-brand-white">No suites found</p>
              <p className="mt-2 text-brand-muted">
                Try a different location or suite type — we&apos;re expanding across the 716.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
