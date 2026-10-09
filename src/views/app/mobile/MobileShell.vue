<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()

const tabs = computed(() => [
  { to: '/app/mobile/scan', name: 'mobile-scan', icon: 'pi pi-qrcode', label: t('nav.mobileScan') },
  { to: '/app/mobile/history', name: 'mobile-history', icon: 'pi pi-list', label: t('nav.mobileHistory') },
])

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="min-h-0 flex-1 overflow-auto pb-[calc(4.25rem+var(--safe-bottom,0px))]">
      <RouterView />
    </div>
    <nav
      class="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-line bg-white pb-[var(--safe-bottom,0px)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
      aria-label="Mobile"
    >
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-sm no-underline transition-colors"
        :class="isActive(tab.to) ? 'font-semibold text-cyan-700' : 'text-muted'"
      >
        <i :class="tab.icon" class="text-xl" />
        <span>{{ tab.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
