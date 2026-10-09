<script setup lang="ts">
import { computed, onActivated, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Button from '@/components/ui/AppButton.vue'
import DataTable from '@/components/ui/AppDataTable.vue'
import Column from '@/components/ui/AppColumn.vue'
import Tag from '@/components/ui/AppTag.vue'
import Message from '@/components/ui/AppMessage.vue'
import { listScanLogs } from '@/services/repositories/scans'
import { exportCsv, exportXlsx } from '@/services/export'
import { formatDateTime } from '@/utils/format'
import type { ScanLog } from '@/types'

const { t } = useI18n()
const toast = useToast()
const logs = ref<ScanLog[]>([])
const exporting = ref(false)

const exportColumns = computed(() => [
  { key: 'barcode', header: 'Barcode', width: 28 },
  { key: 'type', header: 'Type', width: 12 },
  {
    key: 'datenow',
    header: 'DateNow',
    width: 22,
    numFmt: 'dd/mm/yyyy hh:mm:ss',
  },
])

async function reload() {
  logs.value = await listScanLogs(2000)
}

onMounted(() => {
  void reload()
})

onActivated(() => {
  void reload()
})

function exportRows(asExcelDate: boolean) {
  return logs.value.map((row) => ({
    barcode: row.value,
    type: row.direction === 'out' ? t('scan.directionOut') : t('scan.directionIn'),
    datenow: asExcelDate ? new Date(row.createdAt) : formatDateTime(row.createdAt),
  }))
}

async function doExport(kind: 'csv' | 'xlsx') {
  if (!logs.value.length) {
    toast.add({ severity: 'warn', summary: t('scan.emptyTitle'), life: 2500, closable: false })
    return
  }
  exporting.value = true
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = kind === 'csv' ? `scan-logs-${stamp}.csv` : `scan-logs-${stamp}.xlsx`
    if (kind === 'csv') await exportCsv(filename, exportColumns.value, exportRows(false))
    else await exportXlsx(filename, exportColumns.value, exportRows(true))
    toast.add({
      severity: 'success',
      summary: t('sync.exported', { file: filename }),
      detail: t('mobile.usbHint'),
      life: 5000,
      closable: false,
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: err instanceof Error ? err.message : String(err),
      life: 4000,
      closable: false,
    })
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3 p-1">
    <div class="flex shrink-0 flex-wrap items-end justify-between gap-2">
      <div class="min-w-0">
        <h2 class="m-0 mb-1 text-xl">{{ t('nav.mobileHistory') }}</h2>
        <p class="m-0 text-sm text-muted">{{ t('mobile.historySubtitle') }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button icon="pi pi-refresh" :aria-label="t('common.search')" :disabled="exporting" @click="reload" />
        <Button :label="t('sync.csv')" icon="pi pi-file" :loading="exporting" @click="doExport('csv')" />
        <Button :label="t('sync.excel')" icon="pi pi-file-excel" severity="secondary" :loading="exporting"
          @click="doExport('xlsx')" />
      </div>
    </div>

    <Message severity="info" :closable="false">{{ t('mobile.usbHint') }}</Message>

    <div class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <DataTable :value="logs" paginator :rows="12" :rows-per-page-options="[8, 12, 20]" scrollable scroll-height="flex"
        paginator-template="PrevPageLink CurrentPageReport NextPageLink"
        current-page-report-template="{first}-{last} / {totalRecords}">
        <Column field="direction" :header="t('scan.direction')">
          <template #body="{ data }">
            <Tag :value="data.direction === 'out' ? t('scan.directionOut') : t('scan.directionIn')"
              :severity="data.direction === 'out' ? 'warn' : 'success'" />
          </template>
        </Column>
        <Column field="value" :header="t('scan.value')" />
        <Column field="kind" :header="t('scan.kind')" />
        <Column :header="t('scan.time')">
          <template #body="{ data }">{{ formatDateTime(data.createdAt) }}</template>
        </Column>
        <template #empty>
          <div class="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-muted">
            <i class="pi pi-inbox text-[1.75rem]" />
            <p class="m-0 font-semibold text-ink">{{ t('scan.emptyTitle') }}</p>
            <p class="m-0">{{ t('scan.emptyHint') }}</p>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>
