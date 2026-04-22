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
  maxDigits?: number
  formatMode?: 'us' | 'intl'
}

function formatIntlPhoneDigits(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 15)
  if (!d) return ''
  if (d.startsWith('972') && d.length >= 13) {
    return d.replace(/^(\d{3})(\d{2})(\d{1})(\d{3})(\d{0,4}).*$/, '$1-$2-$3-$4-$5')
  }
  if (d.startsWith('44')) {
    return d.replace(/^(\d{2})(\d{0,2})(\d{0,4})(\d{0,4}).*$/, '$1-$2-$3-$4').replace(/-+$/g, '')
  }
  if (d.startsWith('33')) {
    return d
      .replace(/^(\d{2})(\d{0,1})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2}).*$/, '$1-$2-$3-$4-$5-$6')
      .replace(/-+$/g, '')
  }
  if (d.startsWith('61')) {
    return d.replace(/^(\d{2})(\d{0,1})(\d{0,4})(\d{0,4}).*$/, '$1-$2-$3-$4').replace(/-+$/g, '')
  }
  if (d.startsWith('7')) {
    return d.replace(/^(\d{1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2}).*$/, '$1-$2-$3-$4-$5').replace(/-+$/g, '')
  }
  if (d.length <= 10) return formatPhoneDigits(d)
  return d.replace(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,3}).*$/, '$1-$2-$3-$4-$5').replace(/-+$/g, '')
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
  maxDigits = 10,
  formatMode = 'us',
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
      value={formatMode === 'intl' ? formatIntlPhoneDigits(value) : formatPhoneDigits(value)}
      required={required}
      disabled={disabled}
      onBlur={onBlur}
      onFocus={onFocus}
      onChange={(e) => {
        onChange(e.target.value.replace(/\D/g, '').slice(0, maxDigits))
      }}
    />
  )
}
