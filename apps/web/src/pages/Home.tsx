import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cardShell, primaryBtn } from '../lib/uiClasses'

export function Home() {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <div className={`${cardShell} !p-3`}>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/member/signup"
            className={`${primaryBtn} !py-2.5 !text-sm inline-flex items-center justify-center text-center no-underline sm:!text-[15px]`}
          >
            {t('home.joinRegister')}
          </Link>
          <Link
            to="/member/login"
            className="inline-flex items-center justify-center rounded-full border border-emerald-700 bg-emerald-600 px-2 py-2.5 text-center text-sm font-semibold text-white no-underline transition hover:bg-emerald-700 sm:text-[15px]"
          >
            {t('home.viewMember')}
          </Link>
        </div>
      </div>
    </div>
  )
}
