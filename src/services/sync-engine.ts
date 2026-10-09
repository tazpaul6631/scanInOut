import { http } from '@/services/http'
import { listOutbox, removeOutbox, bumpOutboxRetry } from '@/services/repositories/outbox'
import { markProductSynced } from '@/services/repositories/products'
import { run } from '@/storage/database'
import { now } from '@/utils/id'
import type { OutboxItem } from '@/types'

function endpointFor(item: OutboxItem): { method: 'post' | 'put' | 'delete'; url: string } {
  const collection = item.entity === 'product' ? 'products' : `${item.entity}s`
  if (item.action === 'create') return { method: 'post', url: `/${collection}` }
  const payload = JSON.parse(item.payload) as { id?: string }
  if (item.action === 'delete') return { method: 'delete', url: `/${collection}/${payload.id}` }
  return { method: 'put', url: `/${collection}/${payload.id}` }
}

export async function runSync(): Promise<{ ok: number; fail: number }> {
  const items = await listOutbox()
  let ok = 0
  let fail = 0

  for (const item of items) {
    try {
      const spec = endpointFor(item)
      const payload = JSON.parse(item.payload)
      await http.request({
        method: spec.method,
        url: spec.url,
        data: item.action === 'delete' ? undefined : payload,
      })
      if (item.entity === 'product' && payload.id) {
        await markProductSynced(payload.id)
      }
      await removeOutbox(item.id)
      ok += 1
    } catch {
      await bumpOutboxRetry(item.id)
      fail += 1
    }
  }

  await run(`INSERT OR REPLACE INTO settings (key, value) VALUES ('lastSyncAt', ?)`, [String(now())])
  return { ok, fail }
}
