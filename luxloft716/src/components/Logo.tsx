import { BRAND } from '../data/content'

type LogoProps = {
  variant?: 'full' | 'compact' | 'mark'
  className?: string
}

/** Reads LuxLoft716 — L (red) + uxLoft (white) + 716 (script red) */
function LuxLoft716Wordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const wordSize =
    size === 'lg' ? 'text-4xl md:text-5xl' : size === 'sm' ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
  const scriptSize =
    size === 'lg' ? 'text-4xl md:text-5xl' : size === 'sm' ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'

  return (
    <span className="inline-flex items-baseline gap-0.5 leading-none">
      <span className={`font-display font-bold tracking-tight ${wordSize}`}>
        <span className="text-lux-red">L</span>
        <span className="text-white">ux</span>
        <span className="text-white">Loft</span>
      </span>
      <span className={`font-script text-lux-red ${scriptSize}`}>716</span>
    </span>
  )
}

export function Logo({ variant = 'compact', className = '' }: LogoProps) {
  if (variant === 'full') {
    return (
      <img
        src="/logo.svg"
        alt={`${BRAND.name} ${BRAND.tagline} — ${BRAND.slogan}`}
        className={`h-auto w-full max-w-[360px] ${className}`}
      />
    )
  }

  if (variant === 'mark') {
    return (
      <span className={`inline-flex items-end leading-none ${className}`} aria-hidden>
        <span className="font-display text-4xl font-bold text-lux-red">L</span>
        <span className="font-script ml-0.5 text-2xl text-lux-red">716</span>
      </span>
    )
  }

  return (
    <span className={className} aria-label={BRAND.name} title={BRAND.name}>
      <LuxLoft716Wordmark size="md" />
    </span>
  )
}

export function LuxLoft716HeroLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`text-center ${className}`} aria-label={BRAND.name}>
      <LuxLoft716Wordmark size="lg" />
      <p className="mt-4 text-xs font-semibold tracking-[0.35em] text-white uppercase">{BRAND.tagline}</p>
    </div>
  )
}
