type Props = { text: string | null | undefined }

export function RabbiBanner({ text }: Props) {
  const t = text?.trim()
  if (!t) return null
  return (
    <div
      className="shrink-0 border-b border-blue-100 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 px-4 py-2.5 text-center text-[11px] leading-snug text-slate-700 sm:text-xs"
      role="status"
    >
      <span className="font-semibold text-blue-700">Message from the Rabbi</span>
      <span className="mx-1.5 text-blue-300">·</span>
      <span>{t}</span>
    </div>
  )
}
