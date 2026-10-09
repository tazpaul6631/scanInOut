import { z } from 'zod'
import { i18n } from '@/i18n'

export function createChangePasswordSchema() {
  const t = i18n.global.t
  return z
    .object({
      currentPassword: z.string().min(1, t('validation.passwordRequired')),
      newPassword: z.string().min(1, t('validation.passwordRequired')),
      confirmPassword: z.string().min(1, t('validation.passwordRequired')),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
      message: String(t('validation.passwordMismatch')),
      path: ['confirmPassword'],
    })
}

export type ChangePasswordFormValues = z.infer<ReturnType<typeof createChangePasswordSchema>>
