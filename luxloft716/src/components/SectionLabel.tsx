type SectionLabelProps = {
  children: React.ReactNode
  className?: string
}

/** Red flanking lines + spaced caps (logo “SALON SUITES” style) */
export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <span className="h-px w-10 bg-lux-red md:w-16" aria-hidden />
      <p className="text-xs font-semibold tracking-[0.35em] text-white uppercase">{children}</p>
      <span className="h-px w-10 bg-lux-red md:w-16" aria-hidden />
    </div>
  )
}
