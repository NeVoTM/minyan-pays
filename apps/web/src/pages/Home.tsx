import { Link } from 'react-router-dom'
import { cardShell, pageSubtitle, pageTitle, primaryBtn } from '../lib/uiClasses'

export function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitle}>Minyan attendance</h1>
        <p className={`${pageSubtitle} mt-2`}>
          Punch in, rabbi confirms, punch out when you leave. Check earnings under
          Member.
        </p>
      </div>
      <div className={cardShell}>
        <p className="text-sm leading-relaxed text-slate-600">
          New here? Create your account with a fresh, simple form — same style as
          modern banking apps.
        </p>
        <Link
          to="/member/signup"
          className={`${primaryBtn} mt-5 inline-flex justify-center text-center no-underline`}
        >
          Create an account
        </Link>
      </div>
      <p className="text-center text-[11px] text-slate-400">
        Home · Punch · Leave · Member · Admin — bottom menu
      </p>
    </div>
  )
}
