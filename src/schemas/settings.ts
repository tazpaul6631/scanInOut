import { z } from 'zod'
import { i18n } from '@/i18n'

export function createSettingsSchema() {
  const t = i18n.global.t
  return z.object({
    apiUrl: z.string().url(t('validation.apiUrl')),
    companyName: z.string().min(1, t('validation.companyRequired')),
    scaleBaudRate: z.coerce.number().int().positive(),
    bleServiceUuid: z.string().optional().or(z.literal('')),
    bleCharacteristicUuid: z.string().optional().or(z.literal('')),
    autoBackupMinutes: z.coerce.number().int().min(0).max(180),
    locale: z.enum(['vi', 'en', 'zh-TW']),
  })
}
