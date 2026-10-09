import { query, run, withTransaction } from '@/storage/database'
import type { OutboxAction, OutboxEntity, OutboxItem } from '@/types'
import { createId, now } from '@/utils/id'

interface OutboxRow {
  id: string
  entity: OutboxEntity
  action: OutboxAction
  payload: string
  created_at: number
  retries: number
}

function mapOutbox(row: OutboxRow): OutboxItem {
  return {
    id: row.id,
    entity: row.entity,
    action: row.action,
    payload: row.payload,
    createdAt: row.created_at,
    retries: row.retries,
  }
}

export async function enqueueOutbox(
  entity: OutboxEntity,
  action: OutboxAction,
  payload: unknown,
): Promise<void> {
  await run(
    `INSERT INTO outbox (id, entity, action, payload, created_at, retries)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [createId(), entity, action, JSON.stringify(payload), now()],
  )
}

export async function listOutbox(): Promise<OutboxItem[]> {
  const rows = await query<OutboxRow>('SELECT * FROM outbox ORDER BY created_at ASC')
  return rows.map(mapOutbox)
}

export async function countOutbox(): Promise<number> {
  const rows = await query<{ c: number }>('SELECT COUNT(*) as c FROM outbox')
  return Number(rows[0]?.c ?? 0)
}

export async function removeOutbox(id: string): Promise<void> {
  await run('DELETE FROM outbox WHERE id = ?', [id])
}

export async function bumpOutboxRetry(id: string): Promise<void> {
  await run('UPDATE outbox SET retries = retries + 1 WHERE id = ?', [id])
}

export async function clearOutbox(): Promise<void> {
  await run('DELETE FROM outbox')
}

export async function writeLocalAndOutbox(
  entity: OutboxEntity,
  action: OutboxAction,
  payload: unknown,
  apply: () => Promise<void>,
): Promise<void> {
  await withTransaction(async () => {
    await apply()
    await enqueueOutbox(entity, action, payload)
  })
}
