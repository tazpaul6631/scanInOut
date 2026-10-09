import { z } from 'zod'
import { i18n } from '@/i18n'

export function createProductSchema() {
  const t = i18n.global.t
  return z.object({
    sku: z.string().trim().min(1, t('validation.skuRequired')),
    name: z.string().trim().min(2, t('validation.nameMin')),
    barcode: z.string().optional(),
    price: z.coerce.number().nonnegative(t('validation.priceNonneg')),
    stock: z.coerce.number().int().nonnegative(t('validation.stockNonneg')),
    weight: z.coerce.number().nonnegative(t('validation.weightNonneg')).optional(),
    unit: z.string().trim().min(1, t('validation.unitRequired')),
    note: z.string().optional(),
  })
}

export type ProductFormValues = z.infer<ReturnType<typeof createProductSchema>>
