import { Calendar, MapPin, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const suiteTypes = [
  'Any suite type',
  'Hair styling',
  'Nails & manicure',
  'Esthetics & skincare',
  'Barber chair',
  'Spa & massage',
  'Makeup studio',
]

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const [location, setLocation] = useState('Buffalo, NY')
  const [date, setDate] = useState('')
  const [suiteType, setSuiteType] = useState(suiteTypes[0])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams({
      location,
      ...(date && { date }),
      ...(suiteType !== suiteTypes[0] && { type: suiteType }),
    })
    navigate(`/search?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className={`flex w-full flex-col gap-3 rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-2xl sm:flex-row sm:items-end sm:gap-2 sm:p-3 ${
        compact ? 'max-w-3xl' : ''
      }`}
    >
      <label className="flex flex-1 flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-muted">
          <MapPin size={14} className="text-brand-red" />
          Location
        </span>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City or neighborhood"
          className="rounded-xl border border-brand-border bg-brand-black px-4 py-3 text-sm text-brand-white outline-none transition focus:border-brand-red"
        />
      </label>

      <label className="flex flex-1 flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-muted">
          <Calendar size={14} className="text-brand-red" />
          Date
        </span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-brand-border bg-brand-black px-4 py-3 text-sm text-brand-white outline-none transition focus:border-brand-red"
        />
      </label>

      <label className="flex flex-1 flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-muted">
          <Sparkles size={14} className="text-brand-red" />
          Suite type
        </span>
        <select
          value={suiteType}
          onChange={(e) => setSuiteType(e.target.value)}
          className="rounded-xl border border-brand-border bg-brand-black px-4 py-3 text-sm text-brand-white outline-none transition focus:border-brand-red"
        >
          {suiteTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl bg-brand-red px-6 py-3.5 text-sm font-semibold text-brand-white transition hover:bg-brand-red-dark sm:mb-0"
      >
        <Search size={18} />
        Search suites
      </button>
    </form>
  )
}
