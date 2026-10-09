<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { platformName } from '@/adapters/platform'
import { useSettingsStore } from '@/stores/settings'

const { t } = useI18n()
const settings = useSettingsStore()
</script>

<template>
  <div class="mb-2.5 flex items-end justify-between gap-3">
    <div class="min-w-0">
      <h2 class="m-0 mb-1 text-[26px] max-lg:text-[22px] max-md:text-xl">{{ settings.current.companyName }} · {{ platformName() }}</h2>
    </div>
  </div>
  <div class="rounded-2xl border border-line bg-white p-2.5 shadow-panel">
    <p>{{ t('shell.shared') }}</p>
  </div>
</template>
