<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/AppButton.vue'
import DataTable from '@/components/ui/AppDataTable.vue'
import Column from '@/components/ui/AppColumn.vue'
import InputText from '@/components/ui/AppInputText.vue'
import Message from '@/components/ui/AppMessage.vue'
import type { BleDevice } from '@capacitor-community/bluetooth-le'
import { initBluetooth, startBleScan, stopBleScan, connectBle, disconnectBle } from '@/adapters/bluetooth'
import { requestUsbPort, disconnectUsb, canUseUsbSerial } from '@/adapters/usb'
import { nfcStatus, startNfcScan, stopNfcScan } from '@/adapters/nfc'
import { useSettingsStore } from '@/stores/settings'

const { t } = useI18n()
const settings = useSettingsStore()
const devices = ref<Array<BleDevice & { rssi?: number }>>([])
const connectedId = ref('')
const nfc = ref('')
const nfcValue = ref('')
const error = ref('')
const scanning = ref(false)

async function scanBle() {
  error.value = ''
  devices.value = []
  scanning.value = true
  try {
    await initBluetooth()
    await startBleScan((device) => {
      if (!devices.value.some((d) => d.deviceId === device.deviceId)) devices.value.push(device)
    }, settings.current.bleServiceUuid ? [settings.current.bleServiceUuid] : [])
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    scanning.value = false
  }
}

async function stopScan() {
  await stopBleScan()
  scanning.value = false
}

async function connect(device: BleDevice) {
  await connectBle(device.deviceId)
  connectedId.value = device.deviceId
}

async function disconnect() {
  if (connectedId.value) await disconnectBle(connectedId.value)
  connectedId.value = ''
}

async function usb() {
  error.value = ''
  try {
    await requestUsbPort(settings.current.scaleBaudRate)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

async function nfcOn() {
  nfc.value = await nfcStatus()
  await startNfcScan((result) => {
    nfcValue.value = result.value
  })
}

onUnmounted(async () => {
  await stopScan()
  await stopNfcScan()
  await disconnectUsb()
})
</script>

<template>
  <div class="mb-2.5 flex items-end justify-between gap-3 max-md:flex-col max-md:items-stretch">
    <div class="min-w-0">
      <h2 class="m-0 mb-1 text-[26px] max-lg:text-[22px] max-md:text-xl">{{ t('hardware.subtitle') }}</h2>
    </div>
  </div>

  <Message v-if="error" class="mb-3" severity="error">{{ error }}</Message>

  <div class="grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
    <div class="rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <h3 class="m-0">{{ t('hardware.usb') }}</h3>
      <p>{{ canUseUsbSerial() ? t('hardware.serialReady') : t('hardware.serialNeed') }}</p>
      <p>{{ t('hardware.baudFromSettings') }}: {{ settings.current.scaleBaudRate }}</p>
      <Button :label="t('hardware.pickPort')" icon="pi pi-download" @click="usb" />
    </div>
    <div class="rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <h3 class="m-0">{{ t('hardware.nfc') }}</h3>
      <p>{{ t('hardware.status') }}: {{ nfc || t('hardware.notChecked') }}</p>
      <p>{{ t('hardware.tag') }}: {{ nfcValue || '—' }}</p>
      <div class="flex flex-wrap gap-2">
        <Button :label="t('hardware.listenNfc')" @click="nfcOn" />
        <Button :label="t('common.stop')" severity="secondary" @click="stopNfcScan" />
      </div>
    </div>
    <div class="col-span-full rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <h3 class="m-0">{{ t('hardware.ble') }}</h3>
      <div class="mb-3 flex flex-wrap gap-2">
        <Button :label="scanning ? t('hardware.scanning') : t('hardware.scanBle')" icon="pi pi-search"
          @click="scanBle" />
        <Button :label="t('hardware.stopScan')" severity="secondary" @click="stopScan" />
        <Button :label="t('common.disconnect')" @click="disconnect" />
      </div>
      <InputText id="ble-service-uuid" name="ble-service-uuid" :model-value="settings.current.bleServiceUuid" disabled
        :placeholder="t('hardware.uuidPlaceholder')" class="mb-2 w-full" />
      <div class="w-full max-w-full overflow-x-auto">
        <DataTable :value="devices" scrollable>
          <Column field="name" :header="t('hardware.name')" />
          <Column field="deviceId" header="ID" />
          <Column field="rssi" header="RSSI" />
          <Column header="">
            <template #body="{ data }">
              <Button size="small" :label="t('common.connect')" @click="connect(data)" />
            </template>
          </Column>
        </DataTable>
      </div>
      <p v-if="connectedId">{{ t('hardware.connected') }}: {{ connectedId }}</p>
    </div>
  </div>
</template>
