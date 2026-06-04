import { BRAND } from '../data/content'
import { asset } from '../lib/assets'

const LOGO_SRC = asset('logo.png')
const LOGO_ALT = `${BRAND.name} ${BRAND.tagline}`

type LogoProps = {
  variant?: 'compact' | 'hero' | 'mark'
  className?: string
}

const sizeClasses: Record<NonNullable<LogoProps['variant']>, string> = {
  compact: 'h-14 w-auto max-w-[220px] object-contain object-left',
  hero: 'mx-auto w-full max-w-[min(100%,420px)] object-contain',
  mark: 'h-10 w-auto object-contain',
}

export function Logo({ variant = 'compact', className = '' }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={LOGO_ALT}
      className={`${sizeClasses[variant]} ${className}`.trim()}
      decoding="async"
    />
  )
}

export function BrandHeroLogo({ className = '' }: { className?: string }) {
  return <Logo variant="hero" className={className} />
}
