import { useEffect, useState } from 'react'

export function ClockBar() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <time
      dateTime={now.toISOString()}
      className="shrink-0 text-right text-[10px] tabular-nums leading-tight text-slate-500 sm:text-[11px]"
    >
      {now.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })}
    </time>
  )
}
