import { Link } from 'react-router-dom'

type ButtonProps = {
  to: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
}

const variants = {
  primary: 'bg-lux-red text-white hover:bg-lux-red-dark',
  secondary: 'bg-white text-lux-black hover:bg-white/90',
  outline: 'border-2 border-lux-red text-lux-red hover:bg-lux-red hover:text-white',
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
