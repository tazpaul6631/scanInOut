import { query, run } from '@/storage/database'
import type { LiveWeight, ScaleReading } from '@/types'
import { createId, now } from '@/utils/id'

interface ScaleRow {
  id: string
  weight: number
  unit: ScaleReading['unit']
  stable: number
  source: ScaleReading['source']
  raw: string
  created_at: number
}

function mapReading(row: ScaleRow): ScaleReading {
  return {
    id: row.id,
    weight: Number(row.weight),
    unit: row.unit,
    stable: Boolean(row.stable),
    source: row.source,
    raw: row.raw,
    createdAt: row.created_at,
  }
}

export async function addScaleReading(input: LiveWeight): Promise<ScaleReading> {
  const item: ScaleReading = {
    id: createId(),
    weight: input.weight,
    unit: input.unit,
    stable: input.stable,
    source: input.source,
    raw: input.raw,
    createdAt: now(),
  }
  await run(
    `INSERT INTO scale_readings (id, weight, unit, stable, source, raw, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.weight, item.unit, item.stable ? 1 : 0, item.source, item.raw, item.createdAt],
  )
  return item
}

export async function listScaleReadings(limit = 100): Promise<ScaleReading[]> {
  const rows = await query<ScaleRow>(
    `SELECT * FROM scale_readings ORDER BY created_at DESC LIMIT ?`,
    [limit],
  )
  return rows.map(mapReading)
}
