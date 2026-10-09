import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { countOutbox } from '@/services/repositories/outbox'
import { query } from '@/storage/database'
import { syncFromApi } from '@/services/api/testapi'
import { readApiFailure } from '@/services/api/error'
import { useAuthStore } from '@/stores/auth'
import { i18n } from '@/i18n'

function tr(key: string, params?: Record<string, unknown>) {
  return String(i18n.global.t(key, params ?? {}))
}

export const useSyncStore = defineStore('sync', () => {
  const pending = ref(0)
  const lastSyncAt = ref<number | null>(null)
  const lastBackupAt = ref<number | null>(null)
  const syncing = ref(false)
  const backingUp = ref(false)
  const message = ref('')
  const fromApiRunning = ref(false)
  const fromApiBatch = ref(0)
  const fromApiTotal = ref(0)
  const toast = useToast()
  let fromApiStop = false

  async function refresh() {
    pending.value = await countOutbox()
    const syncRow = await query<{ value: string }>(`SELECT value FROM settings WHERE key = 'lastSyncAt'`)
    const backupRow = await query<{ value: string }>(`SELECT value FROM settings WHERE key = 'lastBackupAt'`)
    lastSyncAt.value = syncRow[0] ? Number(syncRow[0].value) : null
    lastBackupAt.value = backupRow[0] ? Number(backupRow[0].value) : null
  }

  function stopFromApi() {
    fromApiStop = true
  }

  async function runFromApi() {
    if (fromApiRunning.value) return
    fromApiRunning.value = true
    fromApiStop = false
    fromApiBatch.value = 0
    fromApiTotal.value = 0
    try {
      while (!fromApiStop && !useAuthStore().unauthorized) {
        const res = await syncFromApi()
        const batch = Number(res.data ?? 0)
        if (!res.success) {
          toast.add({
            severity: 'error',
            summary: res.message || tr('dashboard.syncFromApiError'),
            life: 3500,
            closable: false,
          })
          return
        }
        if (batch === 0) break
        fromApiTotal.value += batch
        fromApiBatch.value = batch
      }
      if (!fromApiStop && !useAuthStore().unauthorized) {
        toast.add({
          severity: 'success',
          summary: tr('dashboard.syncFromApiDone', { n: fromApiTotal.value }),
          life: 2500,
          closable: false,
        })
        await refresh()
      }
    } catch (err) {
      toast.add({ severity: 'error', summary: readApiFailure(err), life: 3500, closable: false })
    } finally {
      fromApiRunning.value = false
      fromApiStop = false
    }
  }

  return {
    pending,
    lastSyncAt,
    lastBackupAt,
    syncing,
    backingUp,
    message,
    fromApiRunning,
    fromApiBatch,
    fromApiTotal,
    refresh,
    runFromApi,
    stopFromApi,
  }
})
