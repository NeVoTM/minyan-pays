/** Stylized profile mark from brand logo (line art) */
export function BrandIcon({ className = 'h-12 w-12 text-lux-red' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8 38h32M24 8c-6 0-10 5-10 12 0 4 2 7 5 9-3 2-5 5-5 9 0 6 4 10 10 10s10-4 10-10c0-4-2-7-5-9 3-2 5-5 5-9 0-7-4-12-10-12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M26 18h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
