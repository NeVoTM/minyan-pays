import { useTranslation } from 'react-i18next'
import {
  type AppLang,
  SUPPORTED_LANGS,
  setLanguageOverride,
} from '../i18n'

const LANG_CODES: AppLang[] = [...SUPPORTED_LANGS]

export function LanguageMenu() {
  const { t, i18n } = useTranslation()
  const raw = i18n.resolvedLanguage ?? i18n.language
  const base = raw.split('-')[0] ?? 'en'
  const current =
    LANG_CODES.find((c) => c === base) ?? ('en' as AppLang)

  return (
    <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px]">
      <span className="sr-only">{t('lang.label')}</span>
      <select
        value={current}
        onChange={(e) => setLanguageOverride(e.target.value as AppLang)}
        className="max-w-[9rem] rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-[11px] font-medium text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        {LANG_CODES.map((code) => (
          <option key={code} value={code}>
            {t(`lang.${code}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
