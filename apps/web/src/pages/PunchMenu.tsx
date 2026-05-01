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
    <div className="mx-auto w-full min-w-0 max-w-full space-y-5 text-center sm:text-left">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <BackLink to="/" />
        <div className="min-w-0">
          <h1 className={pageTitle}>{t('nav.punch')}</h1>
          <div className={`${pageSubtitle} space-y-1`}>
            <p>* Check-in, Rabbi will confirm</p>
            <p>* Check-out when you leave</p>
            <p>* Check Earning under Member menu</p>
          </div>
        </div>
      </div>

      <div className={`${cardShell} !p-3`}>
        <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          <Link
            to="/punch/in"
            className={`${punchInCheckInBtn} block min-w-0 !py-4 !text-base text-center`}
          >
            {t('punchIn.submit')}
          </Link>
          <Link
            to="/punch/out"
            className={`${punchOutDepartureBtn} block min-w-0 !py-4 !text-base text-center`}
          >
            {t('punchOut.submit')}
          </Link>
        </div>
      </div>
    </div>
  )
}
