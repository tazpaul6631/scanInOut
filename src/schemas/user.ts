import { z } from 'zod'
import { i18n } from '@/i18n'

export function createUserSchema(mode: 'create' | 'edit') {
  const t = i18n.global.t
  return z.object({
    code: z.string().trim().min(1, t('validation.codeRequired')),
    email: z.string().trim().min(1, t('validation.emailRequired')),
    name: z.string().trim().min(2, t('validation.nameMin')),
    roleId: z.string().trim().uuid(t('validation.roleIdInvalid')),
    password:
      mode === 'create'
        ? z.string().trim().min(1, t('validation.passwordRequired'))
        : z.string().optional(),
    isActive: z.boolean(),
  })
}

export type UserFormValues = z.infer<ReturnType<typeof createUserSchema>>
