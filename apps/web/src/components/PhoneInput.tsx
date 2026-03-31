import { formatPhoneDigits } from '../lib/phoneDisplay'

type Props = {
  value: string
  onChange: (digitsOnly: string) => void
  id?: string
  required?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function PhoneInput({
  value,
  onChange,
  id,
  required,
  disabled,
  className = 'w-full rounded border border-slate-600 bg-slate-950 px-2 py-1',
  placeholder = '555-123-4567',
}: Props) {
  return (
    <input
      id={id}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      placeholder={placeholder}
      className={className}
      value={formatPhoneDigits(value)}
      required={required}
      disabled={disabled}
      onChange={(e) => {
        onChange(e.target.value.replace(/\D/g, '').slice(0, 10))
      }}
    />
  )
}
