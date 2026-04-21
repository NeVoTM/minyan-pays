/** Shared Tailwind classes for the modern (Dribbble-style) light theme. */

export const fieldLabel =
  'text-xs font-semibold tracking-wide text-slate-600 sm:text-[13px]'

export const pillInput =
  'mt-2 w-full rounded-full border-0 bg-slate-100 px-4 py-3.5 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-slate-400 transition focus:bg-white focus:ring-2 focus:ring-blue-500/35'

export const pillTextarea =
  'mt-2 w-full rounded-3xl border-0 bg-slate-100 px-4 py-3.5 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-slate-400 transition focus:bg-white focus:ring-2 focus:ring-blue-500/35'

export const cardShell =
  'rounded-[1.75rem] bg-white p-6 shadow-[0_8px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-100'

export const primaryBtn =
  'w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 py-4 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-blue-600 active:scale-[0.99] disabled:opacity-50'

/** Two-tone blue — punch-out “Record departure” (distinct from punch-in). */
export const punchOutDepartureBtn =
  'w-full rounded-full bg-gradient-to-r from-blue-900 via-blue-600 to-sky-400 py-4 text-[15px] font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-800 hover:via-blue-500 hover:to-sky-300 active:scale-[0.99] disabled:opacity-50'

/** Mask digits like a password without using type=password (avoids browser save-password pairing). */
export const pinInput =
  'mt-2 w-full rounded-full border-0 bg-slate-100 px-4 py-3.5 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-slate-400 transition focus:bg-white focus:ring-2 focus:ring-blue-500/35 [-webkit-text-security:disc] [font-variant-numeric:tabular-nums]'

export const pageTitle = 'text-2xl font-bold tracking-tight text-slate-900'

export const pageSubtitle = 'text-sm leading-relaxed text-slate-500'
