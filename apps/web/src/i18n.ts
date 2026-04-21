import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import he from './locales/he.json'
import es from './locales/es.json'
import ru from './locales/ru.json'
import fr from './locales/fr.json'

export const LANG_OVERRIDE_KEY = 'minyan_lang_override'

export const SUPPORTED_LANGS = ['he', 'en', 'es', 'ru', 'fr'] as const
export type AppLang = (typeof SUPPORTED_LANGS)[number]

export function isRtlLang(lng: string): boolean {
  return lng === 'he'
}

function parseStoredLang(): AppLang | null {
  try {
    const s = localStorage.getItem(LANG_OVERRIDE_KEY)
    if (s && SUPPORTED_LANGS.includes(s as AppLang)) return s as AppLang
  } catch {
    /* ignore */
  }
  return null
}

function initialLng(): AppLang {
  return parseStoredLang() ?? 'he'
}

export function initI18n() {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      he: { translation: he },
      es: { translation: es },
      ru: { translation: ru },
      fr: { translation: fr },
    },
    lng: initialLng(),
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGS],
    interpolation: { escapeValue: false },
  })
}

export function setLanguageOverride(lng: AppLang) {
  localStorage.setItem(LANG_OVERRIDE_KEY, lng)
  void i18n.changeLanguage(lng)
}

export function clearLanguageOverride() {
  localStorage.removeItem(LANG_OVERRIDE_KEY)
}

/** When user has not set a manual language, follow the congregation default. */
export function applyOrgDefaultLocale(defaultLocale: string | undefined) {
  if (localStorage.getItem(LANG_OVERRIDE_KEY)) return
  if (defaultLocale && SUPPORTED_LANGS.includes(defaultLocale as AppLang)) {
    void i18n.changeLanguage(defaultLocale as AppLang)
  }
}
