import { BRAND, LOGO_TEXT } from '../data/content'
import { SectionLabel } from './SectionLabel'

type LogoProps = {
  variant?: 'full' | 'compact' | 'mark'
  className?: string
  showTagline?: boolean
}

/** Building sign: one big L, UXE/OFT tight to L, italic 716 over the T */
function LuxeLoft716Mark({
  size = 'md',
  showTagline = false,
}: {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
}) {
  const lSize =
    size === 'lg'
      ? 'text-[4rem] md:text-[5.5rem] leading-[0.85]'
      : size === 'sm'
        ? 'text-[2.5rem] leading-[0.85]'
        : 'text-[3.25rem] md:text-[4.75rem] leading-[0.85]'
  const stackSize =
    size === 'lg' ? 'text-lg md:text-2xl' : size === 'sm' ? 'text-[10px]' : 'text-sm md:text-lg'
  const scriptSize =
    size === 'lg' ? 'text-[3.25rem] md:text-[4.25rem]' : size === 'sm' ? 'text-xl' : 'text-2xl md:text-[2.75rem]'

  return (
    <div className="inline-flex flex-col items-center">
      <span className="inline-flex items-end leading-none">
        <span className={`shrink-0 font-display font-bold ${lSize} text-lux-red`}>{LOGO_TEXT.letter}</span>
        <span
          className={`relative -ml-[0.2em] mb-[0.12em] flex flex-col font-display font-medium tracking-[0.14em] ${stackSize}`}
        >
          <span className="text-white">{LOGO_TEXT.top}</span>
          <span className="relative -mt-[0.15em] text-white">
            {LOGO_TEXT.bottom}
            <span
              className={`absolute font-script italic text-lux-red ${scriptSize}`}
              style={{
                left: '1.05em',
                bottom: '0.05em',
                transform: 'translateY(-38%) rotate(-4deg)',
                lineHeight: 1,
              }}
            >
              {LOGO_TEXT.script}
            </span>
          </span>
        </span>
      </span>
      {showTagline && (
        <>
          <SectionLabel className="mt-5">{BRAND.tagline}</SectionLabel>
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
        <span className="font-script ml-0.5 text-2xl italic text-lux-red">{LOGO_TEXT.script}</span>
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
