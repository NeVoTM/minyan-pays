import { useTranslation } from 'react-i18next'
import { PunchIdentityForm } from '../components/PunchIdentityForm'
import {
  cardShell,
  pageSubtitle,
  pageTitle,
} from '../lib/uiClasses'

export function PunchIn() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitle}>{t('punchIn.title')}</h1>
        <p className={pageSubtitle}>{t('punchIn.subtitle')}</p>
      </div>

      <div className={cardShell}>
        <PunchIdentityForm mode="in" />
      </div>
    </div>
  )
}
