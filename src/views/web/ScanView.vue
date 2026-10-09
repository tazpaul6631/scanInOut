<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Button from '@/components/ui/AppButton.vue'
import InputText from '@/components/ui/AppInputText.vue'
import FloatLabel from '@/components/ui/AppFloatLabel.vue'
import DataTable from '@/components/ui/AppDataTable.vue'
import Column from '@/components/ui/AppColumn.vue'
import Message from '@/components/ui/AppMessage.vue'
import Tag from '@/components/ui/AppTag.vue'
import { useScan } from '@/composables/useScan'
import { useBarcodeWedge } from '@/composables/useBarcodeWedge'
import { listScanLogs } from '@/services/repositories/scans'
import { findProductByBarcode } from '@/services/repositories/products'
import { formatDateTime } from '@/utils/format'
import { nfcStatus, openNfcSettings } from '@/adapters/nfc'
import { detectDeviceShell, isNative, type DeviceShell } from '@/adapters/platform'
import type { Product, ScanDirection, ScanLog } from '@/types'

const { t } = useI18n()
const toast = useToast()
const direction = ref<ScanDirection>('in')
const {
  last,
  nfcOn,
  error,
  nativeScan,
  liveScan,
  stopLive,
  startNfc,
  stopNfc,
  remember,
} = useScan(direction)
const logs = ref<ScanLog[]>([])
const product = ref<Product | null>(null)
const manual = ref('')
const nfc = ref('...')
const live = ref(false)
const shell = ref<DeviceShell>(detectDeviceShell())
const compact = computed(() => shell.value === 'mobile')
const nfcLabel = computed(() => (nfcOn.value ? t('scan.nfcStop') : t('scan.nfcStart')))
const liveLabel = computed(() => (live.value ? t('scan.liveStop') : t('scan.liveStart')))
const paginatorTemplate = computed(() => {
  if (shell.value === 'mobile') return 'PrevPageLink CurrentPageReport NextPageLink'
  if (shell.value === 'tablet') return 'PrevPageLink PageLinks NextPageLink RowsPerPageDropdown'
  return 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport'
})
const pageReport = computed(() =>
  shell.value === 'mobile'
    ? '{first}-{last} / {totalRecords}'
    : 'Showing {first} to {last} of {totalRecords} entries',
)

function refreshShell() {
  shell.value = detectDeviceShell()
}

async function reload() {
  logs.value = await listScanLogs()
}

function focusManual() {
  void nextTick(() => {
    document.getElementById('manual-input')?.focus()
  })
}

async function afterScan() {
  if (last.value) {
    product.value = await findProductByBarcode(last.value.value)
  }
  await reload()
  focusManual()
}

async function saveCode(value: string, kind: 'manual' | 'barcode', format: string) {
  const code = value.trim()
  if (!code) return
  await remember({ value: code, format, kind, direction: direction.value })
  manual.value = ''
  await afterScan()
}

useBarcodeWedge(async (value) => {
  await saveCode(value, 'barcode', 'WEDGE')
})

onMounted(async () => {
  refreshShell()
  window.addEventListener('resize', refreshShell)
  nfc.value = await nfcStatus()
  await reload()
  focusManual()
})

onUnmounted(() => {
  window.removeEventListener('resize', refreshShell)
})

async function toggleLive() {
  if (live.value) {
    await stopLive()
    live.value = false
    focusManual()
    return
  }
  live.value = true
  await liveScan('live-scanner', async () => {
    await afterScan()
  })
}

async function doNative() {
  await nativeScan()
  await afterScan()
}

async function saveManual() {
  await saveCode(manual.value, 'manual', 'MANUAL')
}

function setDirection(next: ScanDirection) {
  direction.value = next
  focusManual()
}

function nfcToast(summary: string) {
  toast.add({ severity: 'warn', summary, life: 3000, closable: false })
}

async function toggleNfc() {
  if (nfcOn.value) {
    await stopNfc()
    nfc.value = await nfcStatus()
    await reload()
    focusManual()
    return
  }

  let status: string
  try {
    status = await nfcStatus()
  } catch {
    nfcToast(t('errors.noNfc'))
    return
  }
  nfc.value = status

  if (status === 'NO_NFC') {
    nfcToast(t('errors.noNfc'))
    return
  }

  if (status === 'NFC_DISABLED') {
    nfcToast(t('scan.nfcDisabled'))
    try {
      await openNfcSettings()
    } catch {
      // toast already shown
    }
    return
  }

  try {
    await startNfc()
    nfc.value = await nfcStatus()
    await reload()
  } catch (err) {
    nfcToast(err instanceof Error ? err.message : t('errors.noNfc'))
  }
}
</script>

<template>
  <div class="page-fill">
    <div class="mb-2.5 flex shrink-0 items-end justify-between gap-3 max-md:flex-col max-md:items-stretch">
      <div class="min-w-0">
        <h2 class="m-0 mb-1 text-[26px] max-lg:text-[22px] max-md:text-xl">{{ t('scan.subtitle') }}</h2>
        <p class="m-0 text-sm text-muted">{{ t('scan.wedgeHint') }}</p>
      </div>
    </div>

    <div class="mb-4 grid shrink-0 grid-cols-2 gap-3.5 max-md:grid-cols-1">
      <div class="rounded-2xl border border-line bg-white p-2.5 shadow-panel">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold text-ink">{{ t('scan.direction') }}</span>
          <Button
            :label="t('scan.directionIn')"
            :severity="direction === 'in' ? 'success' : 'secondary'"
            :outlined="direction !== 'in'"
            @click="setDirection('in')"
          />
          <Button
            :label="t('scan.directionOut')"
            :severity="direction === 'out' ? 'warn' : 'secondary'"
            :outlined="direction !== 'out'"
            @click="setDirection('out')"
          />
        </div>
        <div class="mb-3 flex flex-wrap gap-2">
          <Button v-if="isNative()" :label="compact ? undefined : t('scan.native')" icon="pi pi-camera"
            :aria-label="t('scan.native')" @click="doNative" />
          <Button :label="compact ? undefined : nfcLabel" icon="pi pi-wifi" :aria-label="nfcLabel" @click="toggleNfc" />
          <Button :label="compact ? undefined : liveLabel" icon="pi pi-video" :aria-label="liveLabel"
            @click="toggleLive" />
        </div>
        <Message v-if="error" severity="warn">{{ error }}</Message>
        <p>{{ t('scan.nfcStatus') }}:
          <Tag :value="nfc" />
        </p>
        <div v-show="live" id="live-scanner" class="min-h-[280px] w-full max-w-[420px] overflow-hidden rounded-2xl bg-neutral-900" />
        <div v-if="last" class="mt-3 rounded-2xl border border-line bg-[#f4faf7] p-2.5 shadow-panel">
          <strong>{{ t('scan.result') }}:</strong> {{ last.value }}
          <div>{{ last.kind }} · {{ last.format }} · {{ last.direction === 'out' ? t('scan.directionOut') : t('scan.directionIn') }}</div>
          <div v-if="product">{{ t('scan.matched', { sku: product.sku, name: product.name }) }}</div>
          <div v-else>{{ t('scan.unmatched') }}</div>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <FloatLabel class="min-w-32 flex-1">
            <InputText id="manual-input" name="manual-input" v-model="manual" class="w-full" autocomplete="off" />
            <label for="manual-input">{{ t('scan.manualPlaceholder') }}</label>
          </FloatLabel>
          <Button :label="t('common.save')" @click="saveManual" />
        </div>
      </div>
    </div>

    <div class="page-fill-panel col-span-full rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <h3 class="mb-3 shrink-0">{{ t('scan.history') }}</h3>
      <div class="table-wrap-fill w-full max-w-full overflow-x-auto">
        <DataTable :value="logs" paginator :rows="8" :rows-per-page-options="[5, 10, 20]" scrollable
          scroll-height="flex" :paginator-template="paginatorTemplate" :current-page-report-template="pageReport">
          <Column field="direction" :header="t('scan.direction')">
            <template #body="{ data }">
              <Tag
                :value="data.direction === 'out' ? t('scan.directionOut') : t('scan.directionIn')"
                :severity="data.direction === 'out' ? 'warn' : 'success'"
              />
            </template>
          </Column>
          <Column field="kind" :header="t('scan.kind')" />
          <Column field="value" :header="t('scan.value')" />
          <Column field="format" :header="t('scan.format')" />
          <Column :header="t('scan.time')">
            <template #body="{ data }">{{ formatDateTime(data.createdAt) }}</template>
          </Column>
          <template #empty>
            <div class="table-empty flex min-h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center text-muted">
              <i class="pi pi-inbox text-[1.75rem]" />
              <p class="m-0 font-semibold text-ink">{{ t('scan.emptyTitle') }}</p>
              <p class="m-0">{{ t('scan.emptyHint') }}</p>
            </div>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>
