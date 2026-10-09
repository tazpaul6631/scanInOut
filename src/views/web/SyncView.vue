<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/AppButton.vue'
import DataTable from '@/components/ui/AppDataTable.vue'
import Column from '@/components/ui/AppColumn.vue'
import Message from '@/components/ui/AppMessage.vue'
import { useToast } from 'primevue/usetoast'
import { useSyncStore } from '@/stores/sync'
import { useNetworkStore } from '@/stores/network'
import { runSync } from '@/services/sync-engine'
import { createBackup } from '@/services/backup'
import { exportCsv, exportPdf, exportXlsx } from '@/services/export'
import { listOutbox, clearOutbox } from '@/services/repositories/outbox'
import { listProducts } from '@/services/repositories/products'
import { formatDateTime } from '@/utils/format'
import type { OutboxItem, Product } from '@/types'

const { t } = useI18n()
const toast = useToast()
const sync = useSyncStore()
const network = useNetworkStore()
const outbox = ref<OutboxItem[]>([])
const products = ref<Product[]>([])
const message = ref('')

const columns = computed(() => [
  { key: 'sku', header: t('product.sku') },
  { key: 'name', header: t('product.name') },
  { key: 'barcode', header: t('product.barcode') },
  { key: 'price', header: t('product.price') },
  { key: 'stock', header: t('product.stock') },
  { key: 'syncStatus', header: t('product.sync') },
])

async function reload() {
  outbox.value = await listOutbox()
  products.value = await listProducts()
  await sync.refresh()
}

onMounted(reload)

async function doSync() {
  sync.syncing = true
  try {
    const result = await runSync()
    message.value = t('sync.pushed', { ok: result.ok, fail: result.fail })
    toast.add({ severity: result.fail ? 'warn' : 'success', summary: message.value, life: 3000 })
    await reload()
  } catch (err) {
    message.value = err instanceof Error ? err.message : String(err)
  } finally {
    sync.syncing = false
  }
}

async function doBackup() {
  sync.backingUp = true
  try {
    const file = await createBackup()
    toast.add({ severity: 'success', summary: `Backup: ${file}`, life: 3000 })
    await reload()
  } finally {
    sync.backingUp = false
  }
}

async function exportKind(kind: 'xlsx' | 'csv' | 'pdf') {
  const filename = `products.${kind}`
  const rows = products.value as unknown as Record<string, unknown>[]
  if (kind === 'xlsx') await exportXlsx(filename, columns.value, rows)
  if (kind === 'csv') await exportCsv(filename, columns.value, rows)
  if (kind === 'pdf') await exportPdf(filename, t('sync.productList'), columns.value, rows)
  toast.add({ severity: 'success', summary: t('sync.exported', { file: filename }), life: 2500 })
}

async function wipeOutbox() {
  await clearOutbox()
  await reload()
}
</script>

<template>
  <div class="mb-2.5 flex items-end justify-between gap-3 max-md:flex-col max-md:items-stretch">
    <div class="min-w-0">
      <h2 class="m-0 mb-1 text-[26px] max-lg:text-[22px] max-md:text-xl">{{ t('sync.subtitle') }}</h2>
    </div>
  </div>

  <Message :severity="network.online ? 'success' : 'warn'">
    {{ network.online ? t('sync.online') : t('sync.offline') }}
  </Message>

  <div class="my-4 flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-2.5 shadow-panel">
    <Button :label="t('sync.syncNow')" icon="pi pi-cloud-upload" :loading="sync.syncing" @click="doSync" />
    <Button :label="t('sync.backup')" icon="pi pi-database" :loading="sync.backingUp" @click="doBackup" />
    <Button :label="t('sync.excel')" icon="pi pi-file-excel" severity="success" @click="exportKind('xlsx')" />
    <Button :label="t('sync.csv')" icon="pi pi-file" @click="exportKind('csv')" />
    <Button :label="t('sync.pdf')" icon="pi pi-file-pdf" severity="danger" @click="exportKind('pdf')" />
    <Button :label="t('sync.clearOutbox')" severity="secondary" @click="wipeOutbox" />
  </div>

  <p>{{ t('sync.lastBackup') }}: {{ formatDateTime(sync.lastBackupAt) }} · {{ t('sync.lastSync') }}: {{
    formatDateTime(sync.lastSyncAt) }}</p>
  <p v-if="message">{{ message }}</p>

  <div class="rounded-2xl border border-line bg-white p-2.5 shadow-panel">
    <h3 class="m-0">{{ t('sync.outbox') }} ({{ outbox.length }})</h3>
    <div class="w-full max-w-full overflow-x-auto">
      <DataTable :value="outbox" scrollable>
        <Column field="entity" header="Entity" />
        <Column field="action" header="Action" />
        <Column field="retries" header="Retries" />
        <Column :header="t('sync.createdAt')">
          <template #body="{ data }">{{ formatDateTime(data.createdAt) }}</template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
