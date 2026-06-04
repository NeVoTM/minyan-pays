import { BRAND, LOGO_TEXT } from '../data/content'

type LogoProps = {
  variant?: 'full' | 'compact' | 'mark' | 'wordmark'
  className?: string
}

/** Brand mark: stylized LuxLoft716 (L + ux + Loft + 716) */
export function Logo({ variant = 'compact', className = '' }: LogoProps) {
  if (variant === 'full') {
    return (
      <img
        src="/logo.svg"
        alt={`${BRAND.name} ${BRAND.tagline} — ${BRAND.slogan}`}
        className={`h-auto w-full max-w-[320px] ${className}`}
      />
    )
  }

  if (variant === 'wordmark') {
    return (
      <span className={`font-display text-2xl font-semibold tracking-tight md:text-3xl ${className}`}>
        <span className="text-lux-red">{BRAND.name.slice(0, 3)}</span>
        <span className="text-white">{BRAND.name.slice(3, 7)}</span>
        <span className="font-script text-lux-red">{BRAND.name.slice(7)}</span>
      </span>
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
    <span
      className={`inline-flex items-end gap-1 leading-none ${className}`}
      aria-label={BRAND.name}
      title={BRAND.name}
    >
      <span className="font-display text-[2.75rem] font-bold text-lux-red md:text-5xl">{LOGO_TEXT.letter}</span>
      <span className="mb-1 flex flex-col">
        <span className="font-display text-sm font-medium tracking-wide text-white md:text-base">
          {LOGO_TEXT.top}
        </span>
        <span className="font-display -mt-0.5 text-sm font-medium tracking-wide text-white md:text-base">
          {LOGO_TEXT.bottom}
        </span>
      </span>
      <span className="font-script mb-0.5 text-3xl text-lux-red md:text-4xl">{LOGO_TEXT.script}</span>
    </span>
  )
}
