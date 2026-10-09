import { createI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import 'dayjs/locale/vi'
import 'dayjs/locale/zh-tw'
import en, { type MessageSchema } from '@/i18n/locales/en'
import vi from '@/i18n/locales/vi'
import zhTW from '@/i18n/locales/zh-TW'

export const SUPPORTED_LOCALES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '/flags/vi.png' },
  { code: 'en', label: 'English', flag: '/flags/en.png' },
  { code: 'zh-TW', label: '繁體中文', flag: '/flags/zh-TW.png' },
] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]['code']

export function localeMeta(code: string) {
  return SUPPORTED_LOCALES.find((item) => item.code === code) ?? SUPPORTED_LOCALES[0]
}

export const i18n = createI18n<[MessageSchema], AppLocale>({
  legacy: false,
  locale: 'vi',
  fallbackLocale: ['vi', 'en'],
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en,
    vi,
    'zh-TW': zhTW,
  },
})

export function normalizeLocale(raw?: string | null): AppLocale {
  const value = (raw || '').toLowerCase().replace('_', '-')
  if (value.startsWith('zh')) return 'zh-TW'
  if (value.startsWith('en')) return 'en'
  return 'vi'
}

export function applyLocale(locale: AppLocale): void {
  const current = i18n.global.locale as unknown as { value: AppLocale }
  current.value = locale
  document.documentElement.lang = locale
  dayjs.locale(locale === 'zh-TW' ? 'zh-tw' : locale)
}

export function detectDeviceLocale(): AppLocale {
  return normalizeLocale(navigator.language || navigator.languages?.[0])
}

export function trError(key: keyof MessageSchema['errors']): string {
  return String(i18n.global.t(`errors.${key}`))
}
