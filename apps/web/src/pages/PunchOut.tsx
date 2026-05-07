import { useTranslation } from 'react-i18next'
import { PunchIdentityForm } from '../components/PunchIdentityForm'
import {
  cardShell,
  pageSubtitle,
  pageTitle,
} from '../lib/uiClasses'

export function PunchOut() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitle}>{t('punchOut.title')}</h1>
        <p className={pageSubtitle}>{t('punchOut.subtitle')}</p>
      </div>

      <div className={cardShell}>
        <PunchIdentityForm mode="out" />
      </div>
    </div>
  )
}
