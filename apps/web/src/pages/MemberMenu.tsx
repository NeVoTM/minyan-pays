import { Link } from 'react-router-dom'
import { cardShell, primaryBtn } from '../lib/uiClasses'

export function MemberMenu() {
  return (
    <div className="space-y-4">
      <div className={cardShell}>
        <div className="mt-4 grid grid-cols-1 gap-2">
          <Link
            to="/member/signup"
            className={`${primaryBtn} !py-3 inline-flex justify-center text-center no-underline`}
          >
            Join / Register
          </Link>
          <Link
            to="/member/login"
            className="inline-flex justify-center rounded-full border border-emerald-700 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white no-underline transition hover:bg-emerald-700"
          >
            Login to Member account
          </Link>
        </div>
      </div>
    </div>
  )
}
