import { query, run } from '@/storage/database'
import { writeLocalAndOutbox } from '@/services/repositories/outbox'
import { deleteDiskFile } from '@/storage/files'
import type { MediaItem, MediaKind, SyncStatus } from '@/types'
import { createId, now } from '@/utils/id'

interface MediaRow {
  id: string
  record_id: string | null
  kind: MediaKind
  path: string
  mime: string
  size: number | null
  duration_ms: number | null
  created_at: number
  sync_status: SyncStatus
}

function mapMedia(row: MediaRow): MediaItem {
  return {
    id: row.id,
    recordId: row.record_id,
    kind: row.kind,
    path: row.path,
    mime: row.mime,
    size: row.size,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
    syncStatus: row.sync_status,
  }
}

export async function listMedia(): Promise<MediaItem[]> {
  const rows = await query<MediaRow>('SELECT * FROM media ORDER BY created_at DESC')
  return rows.map(mapMedia)
}

export async function addMedia(input: {
  kind: MediaKind
  path: string
  mime: string
  size?: number | null
  durationMs?: number | null
  recordId?: string | null
}): Promise<MediaItem> {
  const item: MediaItem = {
    id: createId(),
    recordId: input.recordId ?? null,
    kind: input.kind,
    path: input.path,
    mime: input.mime,
    size: input.size ?? null,
    durationMs: input.durationMs ?? null,
    createdAt: now(),
    syncStatus: 'pending',
  }

  await writeLocalAndOutbox('media', 'create', item, async () => {
    await run(
      `INSERT INTO media (id, record_id, kind, path, mime, size, duration_ms, created_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.recordId,
        item.kind,
        item.path,
        item.mime,
        item.size,
        item.durationMs,
        item.createdAt,
        item.syncStatus,
      ],
    )
  })

  return item
}

export async function deleteMedia(id: string): Promise<void> {
  const rows = await query<MediaRow>('SELECT * FROM media WHERE id = ?', [id])
  const item = rows[0] ? mapMedia(rows[0]) : null
  if (!item) return
  await writeLocalAndOutbox('media', 'delete', { id }, async () => {
    await run('DELETE FROM media WHERE id = ?', [id])
  })
  await deleteDiskFile(item.path)
}

export async function countMedia(): Promise<number> {
  const rows = await query<{ c: number }>('SELECT COUNT(*) as c FROM media')
  return Number(rows[0]?.c ?? 0)
}
