import { Link } from 'react-router-dom'

type ButtonProps = {
  to: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
}

const variants = {
  primary: 'bg-ink text-white hover:bg-charcoal',
  secondary: 'bg-gold text-ink hover:bg-gold-dark',
  outline: 'border-2 border-ink text-ink hover:bg-ink hover:text-white',
}

export function Button({ to, children, variant = 'primary', className = '' }: ButtonProps) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center rounded-sm px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}
