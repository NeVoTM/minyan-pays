type LogoProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { l: 'text-3xl', uxe: 'text-lg', script: 'text-xl' },
  md: { l: 'text-5xl', uxe: 'text-2xl', script: 'text-3xl' },
  lg: { l: 'text-7xl', uxe: 'text-4xl', script: 'text-5xl' },
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const s = sizes[size]

  return (
    <div className={`select-none ${className}`} aria-label="LuxLoft716">
      <div className="flex items-start gap-0 leading-none">
        <span className={`font-serif font-bold text-brand-red ${s.l}`}>L</span>
        <div className="flex flex-col pt-1">
          <span className={`font-serif font-semibold tracking-wide text-brand-white ${s.uxe}`}>
            UXE
          </span>
          <span className="my-0.5 h-px w-full bg-brand-red" />
          <span className={`font-serif font-semibold tracking-wide text-brand-white ${s.uxe}`}>
            OFT
          </span>
        </div>
        <span className={`font-script text-brand-red ${s.script} ml-1 self-end pb-1`}>
          716
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-px w-4 bg-brand-red" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-brand-white">
          Salon Suites
        </span>
        <span className="h-px w-4 bg-brand-red" />
      </div>
    </div>
  )
}
