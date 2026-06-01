type LogoProps = {
  variant?: 'full' | 'compact' | 'mark'
  className?: string
  light?: boolean
}

/** Brand mark matching LuxLoft716 logo: red L, white Lux/Loft, script 716 */
export function Logo({ variant = 'compact', className = '', light = false }: LogoProps) {
  if (variant === 'full') {
    return (
      <img
        src="/logo.svg"
        alt="LuxLoft716 Salon Suites — Elevate your craft. Own your space."
        className={`h-auto w-full max-w-[320px] ${className}`}
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

  const wordColor = light ? 'text-white' : 'text-white'
  const subColor = light ? 'text-lux-red' : 'text-lux-red'

  return (
    <span className={`inline-flex items-end gap-1 leading-none ${className}`} aria-label="LuxLoft716">
      <span className="font-display text-[2.75rem] font-bold text-lux-red md:text-5xl">L</span>
      <span className="mb-1 flex flex-col">
        <span className={`font-display text-sm font-medium tracking-wide ${wordColor} md:text-base`}>UXE</span>
        <span className={`font-display -mt-0.5 text-sm font-medium tracking-wide ${wordColor} md:text-base`}>LOFT</span>
      </span>
      <span className={`font-script mb-0.5 text-3xl ${subColor} md:text-4xl`}>716</span>
    </span>
  )
}
