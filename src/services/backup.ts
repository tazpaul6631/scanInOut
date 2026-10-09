import dayjs from 'dayjs'
import { App } from '@capacitor/app'
import { isNative } from '@/adapters/platform'
import { query, run, flushDatabase } from '@/storage/database'
import { writeTextFile } from '@/storage/files'
import { now } from '@/utils/id'
import { listProducts } from '@/services/repositories/products'
import { listMedia } from '@/services/repositories/media'
import { listScanLogs } from '@/services/repositories/scans'
import { listScaleReadings } from '@/services/repositories/scale'
import { listOutbox } from '@/services/repositories/outbox'

export async function createBackup(): Promise<string> {
  await flushDatabase()
  const snapshot = {
    version: 1,
    createdAt: now(),
    products: await listProducts(),
    media: await listMedia(),
    scans: await listScanLogs(1000),
    scaleReadings: await listScaleReadings(1000),
    outbox: await listOutbox(),
    settings: await query('SELECT key, value FROM settings'),
  }
  const filename = `srcvip-backup-${dayjs().format('YYYYMMDD-HHmmss')}.json`
  await writeTextFile(`SRC VIP/${filename}`, JSON.stringify(snapshot, null, 2), 'documents')
  await run(`INSERT OR REPLACE INTO settings (key, value) VALUES ('lastBackupAt', ?)`, [String(now())])
  return filename
}

export function watchAppPause(onPause: () => void): void {
  if (!isNative()) return
  App.addListener('appStateChange', (state) => {
    if (!state.isActive) onPause()
  })
}
