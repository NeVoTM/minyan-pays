import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackLink } from '../components/BackLink'
import {
  cardShell,
  pageSubtitle,
  pageTitle,
  punchInCheckInBtn,
  punchOutDepartureBtn,
} from '../lib/uiClasses'

export function PunchMenu() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <BackLink to="/" />
        <div>
          <h1 className={pageTitle}>{t('nav.punch')}</h1>
          <div className={`${pageSubtitle} space-y-1`}>
            <p>* Check-in, Rabbi will confirm</p>
            <p>* Check-out when you leave</p>
            <p>* Check Earning under Member menu</p>
          </div>
        </div>
      </div>

      <div className={`${cardShell} space-y-4`}>
        <Link to="/punch/in" className={`${punchInCheckInBtn} block text-center`}>
          {t('punchIn.submit')}
        </Link>
        <Link to="/punch/out" className={`${punchOutDepartureBtn} block text-center`}>
          {t('punchOut.submit')}
        </Link>
      </div>
    </div>
  )
}
