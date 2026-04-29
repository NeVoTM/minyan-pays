import { Link } from 'react-router-dom'
import { cardShell, primaryBtn } from '../lib/uiClasses'

export function MemberMenu() {
  return (
    <div className="space-y-4">
      <div className={cardShell}>
        <p className="text-sm text-slate-600">Login to Member account</p>
        <div className="mt-4 grid grid-cols-1 gap-2">
          <Link
            to="/member/signup"
            className={`${primaryBtn} !py-3 inline-flex justify-center text-center no-underline`}
          >
            Join / Register
          </Link>
          <Link
            to="/member/login"
            className="inline-flex justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50"
          >
            Login to Member account
          </Link>
        </div>
      </div>
    </div>
  )
}
