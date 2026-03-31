import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-amber-100">Minyan attendance</h1>
      <p className="text-slate-400">
        Punch in with your code, then the rabbi confirms. Punch out after
        davening. View your balance when you sign in with phone + PIN.
      </p>
      <ul className="flex flex-col gap-3">
        <Link
          className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-center font-medium text-amber-100 hover:bg-amber-950/60"
          to="/punch"
        >
          Punch in (code)
        </Link>
        <Link
          className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-3 text-center hover:bg-slate-800"
          to="/member"
        >
          Member — sign in
        </Link>
        <Link
          className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-4 py-3 text-center text-emerald-100 hover:bg-emerald-950/50"
          to="/member/signup"
        >
          Register as a member
        </Link>
        <Link
          className="rounded-lg border border-slate-700 px-4 py-3 text-center text-slate-400 hover:bg-slate-800/50"
          to="/admin"
        >
          Rabbi / admin
        </Link>
      </ul>
    </div>
  )
}
