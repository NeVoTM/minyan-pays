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

      <div className={`${cardShell} !p-3`}>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/punch/in"
            className={`${punchInCheckInBtn} !py-4 !text-base block text-center`}
          >
            {t('punchIn.submit')}
          </Link>
          <Link
            to="/punch/out"
            className={`${punchOutDepartureBtn} !py-4 !text-base block text-center`}
          >
            {t('punchOut.submit')}
          </Link>
        </div>
      </div>
    </div>
  )
}
