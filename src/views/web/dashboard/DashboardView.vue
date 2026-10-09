<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/AppButton.vue'
import { formatDateTime } from '@/utils/format'
import { countProducts, countPendingProducts } from '@/services/repositories/products'
import { countScans } from '@/services/repositories/scans'
import { countMedia } from '@/services/repositories/media'
import { useSyncStore } from '@/stores/sync'
import { useNetworkStore } from '@/stores/network'
import { platformName, isNative } from '@/adapters/platform'

const { t } = useI18n()
const router = useRouter()
const sync = useSyncStore()
const network = useNetworkStore()
const { fromApiRunning } = storeToRefs(sync)
const products = ref(0)
const pending = ref(0)
const scans = ref(0)
const media = ref(0)

async function refreshCounts() {
  products.value = await countProducts()
  pending.value = await countPendingProducts()
  scans.value = await countScans()
  media.value = await countMedia()
  await sync.refresh()
}

watch(fromApiRunning, async (running, wasRunning) => {
  if (wasRunning && !running) await refreshCounts()
})

onMounted(refreshCounts)
</script>

<template>
  <div class="mb-2.5 flex items-end justify-between gap-3 max-md:flex-col max-md:items-stretch max-md:[&_.p-button]:w-full">
    <div class="min-w-0">
      <h2 class="m-0 mb-1 text-[26px] max-lg:text-[22px] max-md:text-xl">{{ t('dashboard.subtitle', {
        store: isNative() ? t('dashboard.native') : t('dashboard.webOpfs'), platform:
          platformName()
      }) }}</h2>
    </div>
    <Button :label="t('dashboard.syncFromApi')" icon="pi pi-download" :loading="fromApiRunning"
      :disabled="!network.online || fromApiRunning" @click="sync.runFromApi" />
    <Button :label="t('dashboard.addUser')" icon="pi pi-plus" @click="router.push('/users')" />
  </div>

  <div class="grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
    <div class="rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <div class="text-[13px] text-[#5b736a]">{{ t('dashboard.products') }}</div>
      <div class="mt-2 text-[28px] font-bold">{{ products }}</div>
    </div>
    <div class="rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <div class="text-[13px] text-[#5b736a]">{{ t('dashboard.pending') }}</div>
      <div class="mt-2 text-[28px] font-bold">{{ pending }}</div>
    </div>
    <div class="rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <div class="text-[13px] text-[#5b736a]">{{ t('dashboard.scans') }}</div>
      <div class="mt-2 text-[28px] font-bold">{{ scans }}</div>
    </div>
    <div class="rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <div class="text-[13px] text-[#5b736a]">{{ t('dashboard.media') }}</div>
      <div class="mt-2 text-[28px] font-bold">{{ media }}</div>
    </div>
  </div>

  <div class="mt-4 rounded-2xl border border-line bg-white p-2.5 shadow-panel">
    <p>
      <strong>{{ t('dashboard.connection') }}:</strong>
      {{ network.online ? t('common.online') : t('common.offline') }} ({{ network.connectionType }})
    </p>
    <p><strong>{{ t('dashboard.lastBackup') }}:</strong> {{ formatDateTime(sync.lastBackupAt) }}</p>
    <p><strong>{{ t('dashboard.lastSync') }}:</strong> {{ formatDateTime(sync.lastSyncAt) }}</p>
    <p><strong>{{ t('dashboard.outbox') }}:</strong> {{ t('dashboard.outboxPending', { n: sync.pending }) }}</p>
  </div>
</template>
