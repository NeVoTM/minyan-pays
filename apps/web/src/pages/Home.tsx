import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cardShell, pageSubtitle, pageTitle, primaryBtn } from '../lib/uiClasses'

export function Home() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitle}>{t('home.title')}</h1>
        <p className={`${pageSubtitle} mt-2`}>{t('home.intro')}</p>
      </div>
      <div className={cardShell}>
        <p className="text-sm leading-relaxed text-slate-600">
          {t('home.signupCard')}
        </p>
        <Link
          to="/member/signup"
          className={`${primaryBtn} mt-5 inline-flex justify-center text-center no-underline`}
        >
          {t('home.signupCta')}
        </Link>
        <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-slate-100 pt-5 text-sm">
          <Link
            to="/rabbi"
            className="font-medium text-blue-600 underline-offset-2 hover:underline"
          >
            {t('home.staffRabbi')}
          </Link>
        </div>
      </div>
      <p className="text-center text-[11px] text-slate-400">
        {t('home.footerHint')}
      </p>
    </div>
  )
}
