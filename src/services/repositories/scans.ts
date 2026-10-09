import { query, run } from '@/storage/database'
import type { ScanDirection, ScanKind, ScanLog } from '@/types'
import { createId, now } from '@/utils/id'

interface ScanRow {
  id: string
  kind: ScanKind
  value: string
  format: string | null
  direction: ScanDirection | null
  created_at: number
}

function mapScan(row: ScanRow): ScanLog {
  return {
    id: row.id,
    kind: row.kind,
    value: row.value,
    format: row.format,
    direction: row.direction === 'out' ? 'out' : 'in',
    createdAt: row.created_at,
  }
}

export async function addScanLog(input: {
  kind: ScanKind
  value: string
  format?: string | null
  direction?: ScanDirection
}): Promise<ScanLog> {
  const item: ScanLog = {
    id: createId(),
    kind: input.kind,
    value: input.value,
    format: input.format ?? null,
    direction: input.direction ?? 'in',
    createdAt: now(),
  }
  await run(
    `INSERT INTO scan_logs (id, kind, value, format, direction, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [item.id, item.kind, item.value, item.format, item.direction, item.createdAt],
  )
  return item
}

export async function listScanLogs(limit = 100): Promise<ScanLog[]> {
  const rows = await query<ScanRow>(
    `SELECT * FROM scan_logs ORDER BY created_at DESC LIMIT ?`,
    [limit],
  )
  return rows.map(mapScan)
}

export async function countScans(): Promise<number> {
  const rows = await query<{ c: number }>('SELECT COUNT(*) as c FROM scan_logs')
  return Number(rows[0]?.c ?? 0)
}

export async function deleteScanLog(id: string): Promise<void> {
  await run(`DELETE FROM scan_logs WHERE id = ?`, [id])
}

export async function deleteAllScanLogs(): Promise<void> {
  await run(`DELETE FROM scan_logs`)
}

export async function existsScanLog(value: string, direction: ScanDirection): Promise<boolean> {
  const rows = await query<{ c: number }>(
    `SELECT COUNT(*) as c FROM scan_logs WHERE value = ? AND direction = ? LIMIT 1`,
    [value, direction],
  )
  return Number(rows[0]?.c ?? 0) > 0
}
