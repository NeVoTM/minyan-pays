import type { FocusEvent } from 'react'
import { formatPhoneDigits } from '../lib/phoneDisplay'

type Props = {
  value: string
  onChange: (digitsOnly: string) => void
  id?: string
  required?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
  /** Use "off" on signup to reduce browser password-save pairing with PIN. */
  autoComplete?: string
  inputName?: string
  onBlur?: () => void
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void
}

export function PhoneInput({
  value,
  onChange,
  id,
  required,
  disabled,
  className = 'w-full rounded border border-slate-600 bg-slate-950 px-2 py-1',
  placeholder = '555-123-4567',
  autoComplete = 'tel',
  inputName,
  onBlur,
  onFocus,
}: Props) {
  return (
    <input
      id={id}
      type="tel"
      inputMode="numeric"
      autoComplete={autoComplete}
      name={inputName}
      placeholder={placeholder}
      className={className}
      value={formatPhoneDigits(value)}
      required={required}
      disabled={disabled}
      onBlur={onBlur}
      onFocus={onFocus}
      onChange={(e) => {
        onChange(e.target.value.replace(/\D/g, '').slice(0, 10))
      }}
    />
  )
}
