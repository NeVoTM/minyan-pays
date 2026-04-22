import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cardShell, primaryBtn } from '../lib/uiClasses'

export function Home() {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <div className={`${cardShell} p-4`}>
        <div className="grid grid-cols-1 gap-2">
        <Link
          to="/member/signup"
            className={`${primaryBtn} !py-3 inline-flex justify-center text-center no-underline`}
        >
          {t('home.signupCta')}
        </Link>
        </div>
      </div>
    </div>
  )
}
