import { z } from 'zod'
import { i18n } from '@/i18n'

export function createLoginSchema() {
  const t = i18n.global.t
  return z.object({
    email: z.string().trim().min(1, t('validation.emailRequired')),
    password: z.string().trim().min(1, t('validation.passwordRequired')),
  })
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>
