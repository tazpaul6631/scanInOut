<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/AppButton.vue'
import DataTable from '@/components/ui/AppDataTable.vue'
import Column from '@/components/ui/AppColumn.vue'
import Tag from '@/components/ui/AppTag.vue'
import Message from '@/components/ui/AppMessage.vue'
import { storeToRefs } from 'pinia'
import { useScale } from '@/composables/useScale'
import { useHardwareStore } from '@/stores/hardware'
import { listScaleReadings } from '@/services/repositories/scale'
import { formatDateTime } from '@/utils/format'
import { canUseUsbSerial } from '@/adapters/usb'
import type { ScaleReading } from '@/types'

const { t } = useI18n()
const scale = useScale()
const hardware = useHardwareStore()
const { liveWeight, usbConnected, bleConnected } = storeToRefs(hardware)
const rows = ref<ScaleReading[]>([])
const error = ref('')

async function reload() {
  rows.value = await listScaleReadings()
}

onMounted(reload)

async function wrap(fn: () => Promise<unknown>) {
  error.value = ''
  try {
    await fn()
    await reload()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}
</script>

<template>
  <div class="mb-2.5 flex items-end justify-between gap-3 max-md:flex-col max-md:items-stretch">
    <div class="min-w-0">
      <h2 class="m-0 mb-1 text-[26px] max-lg:text-[22px] max-md:text-xl">{{ t('scale.subtitle') }}</h2>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
    <div class="rounded-[20px] bg-mint p-6 text-center text-[#e9fff6] max-md:p-4">
      <div>{{ t('scale.current') }}</div>
      <div class="text-[64px] leading-none font-bold tracking-tight max-lg:text-[42px] max-md:text-4xl">{{ liveWeight ?
        liveWeight.weight.toFixed(3) : '0.000' }}</div>
      <div>{{ liveWeight?.unit || 'kg' }} · {{ liveWeight?.source || t('scale.notConnected') }}</div>
      <Tag class="mt-2" :value="liveWeight?.stable ? t('scale.stable') : t('scale.unstable')"
        :severity="liveWeight?.stable ? 'success' : 'warn'" />
    </div>
    <div class="rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <p>USB Serial: {{ canUseUsbSerial() ? t('scale.usbReady') : t('scale.usbUnavailable') }}</p>
      <div class="flex flex-wrap gap-2">
        <Button :label="t('scale.connectUsb')" icon="pi pi-link" :disabled="usbConnected"
          @click="wrap(scale.connectUsb)" />
        <Button :label="t('scale.connectBle')" icon="pi pi-android" :disabled="bleConnected"
          @click="wrap(scale.connectBle)" />
        <Button :label="t('scale.disconnect')" severity="secondary" @click="wrap(scale.disconnect)" />
        <Button :label="t('scale.capture')" icon="pi pi-save" @click="wrap(scale.capture)" />
      </div>
      <Message v-if="error" class="mt-3" severity="warn">{{ error }}</Message>
      <p class="mt-3">
        USB: {{ usbConnected ? t('scale.usbOn') : t('scale.usbOff') }} · BLE: {{ bleConnected ? t('scale.usbOn') :
          t('scale.usbOff') }}
      </p>
      <small>{{ t('scale.sppNote') }}</small>
    </div>
  </div>

  <div class="mt-4 rounded-2xl border border-line bg-white p-2.5 shadow-panel">
    <h3 class="m-0">{{ t('scale.history') }}</h3>
    <div class="w-full max-w-full overflow-x-auto">
      <DataTable :value="rows" paginator :rows="10" scrollable>
        <Column field="weight" :header="t('scale.weight')" />
        <Column field="unit" :header="t('scale.unit')" />
        <Column :header="t('scale.stable')">
          <template #body="{ data }">{{ data.stable ? t('common.yes') : t('common.no') }}</template>
        </Column>
        <Column field="source" :header="t('scale.source')" />
        <Column field="raw" :header="t('scale.raw')" />
        <Column :header="t('scale.time')">
          <template #body="{ data }">{{ formatDateTime(data.createdAt) }}</template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
