import { BRAND, LOGO_TEXT } from '../data/content'
import { SectionLabel } from './SectionLabel'

type LogoProps = {
  variant?: 'full' | 'compact' | 'mark'
  className?: string
  showTagline?: boolean
}

/** Building-sign lockup: L (red) + UXE / LOFT (white) + 716 (script red) */
function LuxeLoft716Mark({
  size = 'md',
  showTagline = false,
}: {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
}) {
  const lSize =
    size === 'lg' ? 'text-[3.25rem] md:text-[4.5rem]' : size === 'sm' ? 'text-3xl' : 'text-[2.75rem] md:text-5xl'
  const stackSize = size === 'lg' ? 'text-base md:text-xl' : size === 'sm' ? 'text-[10px]' : 'text-sm md:text-base'
  const scriptSize = size === 'lg' ? 'text-5xl md:text-6xl' : size === 'sm' ? 'text-2xl' : 'text-3xl md:text-4xl'

  return (
    <div className="inline-flex flex-col items-center">
      <span className="inline-flex items-end gap-1 leading-none">
        <span className={`font-display font-bold ${lSize} text-lux-red`}>{LOGO_TEXT.letter}</span>
        <span className={`mb-1 flex flex-col font-display font-medium tracking-[0.12em] ${stackSize}`}>
          <span className="text-white">{LOGO_TEXT.top}</span>
          <span className="-mt-0.5 text-white">{LOGO_TEXT.bottom}</span>
        </span>
        <span className={`font-script mb-0.5 text-lux-red ${scriptSize}`}>{LOGO_TEXT.script}</span>
      </span>
      {showTagline && (
        <>
          <SectionLabel className="mt-4">{BRAND.tagline}</SectionLabel>
          <p className="mt-3 text-[10px] font-semibold tracking-[0.2em] text-lux-red uppercase md:text-xs">
            {BRAND.slogan}
          </p>
        </>
      )}
    </div>
  )
}

export function Logo({ variant = 'compact', className = '', showTagline = false }: LogoProps) {
  if (variant === 'full') {
    return (
      <img
        src="/logo.svg"
        alt={`${BRAND.name} ${BRAND.tagline} — ${BRAND.slogan}`}
        className={`h-auto w-full max-w-[380px] ${className}`}
      />
    )
  }

  if (variant === 'mark') {
    return (
      <span className={`inline-flex items-end leading-none ${className}`} aria-hidden>
        <span className="font-display text-4xl font-bold text-lux-red">{LOGO_TEXT.letter}</span>
        <span className="font-script ml-0.5 text-2xl text-lux-red">{LOGO_TEXT.script}</span>
      </span>
    )
  }

  return (
    <span className={className} aria-label={BRAND.name} title={BRAND.name}>
      <LuxeLoft716Mark size="md" showTagline={showTagline} />
    </span>
  )
}

export function BrandHeroLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`text-center ${className}`} aria-label={BRAND.name}>
      <LuxeLoft716Mark size="lg" showTagline />
    </div>
  )
}
