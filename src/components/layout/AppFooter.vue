<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <footer
    class="z-[5] flex min-h-12 shrink-0 items-center justify-between gap-3 border-t border-chrome-border bg-chrome px-4 py-2 max-md:min-h-10 max-md:py-1.5"
    :style="{ paddingLeft: 'calc(16px + var(--safe-left))', paddingRight: 'calc(16px + var(--safe-right))', paddingBottom: 'calc(8px + var(--safe-bottom))' }">
    <img class="h-7 w-auto max-w-42 object-contain max-md:h-[22px] max-md:max-w-30" src="/logo-company.png" :alt="t('app.name')" />
    <p class="m-0 text-right text-xs text-muted max-md:text-[11px]">{{ t('footer.copyright') }}</p>
  </footer>
</template>
