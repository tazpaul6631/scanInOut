import { query, run } from '@/storage/database'
import { writeLocalAndOutbox } from '@/services/repositories/outbox'
import type { Product, SyncStatus } from '@/types'
import { createId, now } from '@/utils/id'
import { trError } from '@/i18n'

interface ProductRow {
  id: string
  sku: string
  name: string
  barcode: string | null
  price: number
  stock: number
  weight: number | null
  unit: string
  note: string | null
  updated_at: number
  deleted_at: number | null
  sync_status: SyncStatus
}

export type ProductInput = {
  sku: string
  name: string
  barcode?: string | null
  price: number
  stock: number
  weight?: number | null
  unit?: string
  note?: string | null
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    barcode: row.barcode,
    price: Number(row.price ?? 0),
    stock: Number(row.stock ?? 0),
    weight: row.weight == null ? null : Number(row.weight),
    unit: row.unit,
    note: row.note,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  }
}

export async function listProducts(): Promise<Product[]> {
  const rows = await query<ProductRow>(
    `SELECT * FROM products WHERE deleted_at IS NULL ORDER BY updated_at DESC`,
  )
  return rows.map(mapProduct)
}

export async function getProduct(id: string): Promise<Product | null> {
  const rows = await query<ProductRow>('SELECT * FROM products WHERE id = ?', [id])
  return rows[0] ? mapProduct(rows[0]) : null
}

export async function findProductByBarcode(barcode: string): Promise<Product | null> {
  const rows = await query<ProductRow>(
    `SELECT * FROM products WHERE barcode = ? AND deleted_at IS NULL LIMIT 1`,
    [barcode],
  )
  return rows[0] ? mapProduct(rows[0]) : null
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const product: Product = {
    id: createId(),
    sku: input.sku.trim(),
    name: input.name.trim(),
    barcode: input.barcode?.trim() || null,
    price: input.price,
    stock: input.stock,
    weight: input.weight ?? null,
    unit: input.unit || 'pcs',
    note: input.note?.trim() || null,
    updatedAt: now(),
    deletedAt: null,
    syncStatus: 'pending',
  }

  await writeLocalAndOutbox('product', 'create', product, async () => {
    await run(
      `INSERT INTO products
        (id, sku, name, barcode, price, stock, weight, unit, note, updated_at, deleted_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
      [
        product.id,
        product.sku,
        product.name,
        product.barcode,
        product.price,
        product.stock,
        product.weight,
        product.unit,
        product.note,
        product.updatedAt,
        product.syncStatus,
      ],
    )
  })

  return product
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const existing = await getProduct(id)
  if (!existing) throw new Error(trError('productNotFound'))

  const next: Product = {
    ...existing,
    sku: input.sku.trim(),
    name: input.name.trim(),
    barcode: input.barcode?.trim() || null,
    price: input.price,
    stock: input.stock,
    weight: input.weight ?? null,
    unit: input.unit || existing.unit,
    note: input.note?.trim() || null,
    updatedAt: now(),
    syncStatus: 'pending',
  }

  await writeLocalAndOutbox('product', 'update', next, async () => {
    await run(
      `UPDATE products
       SET sku = ?, name = ?, barcode = ?, price = ?, stock = ?, weight = ?, unit = ?, note = ?,
           updated_at = ?, sync_status = ?
       WHERE id = ?`,
      [
        next.sku,
        next.name,
        next.barcode,
        next.price,
        next.stock,
        next.weight,
        next.unit,
        next.note,
        next.updatedAt,
        next.syncStatus,
        id,
      ],
    )
  })
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await getProduct(id)
  if (!existing) return
  const deletedAt = now()
  await writeLocalAndOutbox('product', 'delete', { id }, async () => {
    await run(
      `UPDATE products SET deleted_at = ?, updated_at = ?, sync_status = ? WHERE id = ?`,
      [deletedAt, deletedAt, 'pending', id],
    )
  })
}

export async function markProductSynced(id: string): Promise<void> {
  await run(`UPDATE products SET sync_status = 'synced' WHERE id = ?`, [id])
}

export async function countProducts(): Promise<number> {
  const rows = await query<{ c: number }>(
    `SELECT COUNT(*) as c FROM products WHERE deleted_at IS NULL`,
  )
  return Number(rows[0]?.c ?? 0)
}

export async function countPendingProducts(): Promise<number> {
  const rows = await query<{ c: number }>(
    `SELECT COUNT(*) as c FROM products WHERE sync_status != 'synced' AND deleted_at IS NULL`,
  )
  return Number(rows[0]?.c ?? 0)
}
