<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useRouter, useRoute } from 'vue-router'
import ProgressSpinner from 'primevue/progressspinner'
import Message from '@/components/ui/AppMessage.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Dialog from 'primevue/dialog'
import { initDatabase } from '@/storage/database'
import { useNetworkStore } from '@/stores/network'
import { useSettingsStore } from '@/stores/settings'
import { useSyncStore } from '@/stores/sync'
import { useAuthStore } from '@/stores/auth'
import { createBackup, watchAppPause } from '@/services/backup'
import { applyLocale, normalizeLocale } from '@/i18n'
import { detectDeviceShell, homePathForShell, isNative } from '@/adapters/platform'

const { t } = useI18n()
const toast = useToast()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { unauthorized, countdown } = storeToRefs(auth)
const ready = ref(false)
const error = ref('')
let backupTimer: ReturnType<typeof setInterval> | null = null
let redirectTimer: ReturnType<typeof setInterval> | null = null

function stopRedirectTimer() {
  if (!redirectTimer) return
  clearInterval(redirectTimer)
  redirectTimer = null
}

watch(unauthorized, (open) => {
  if (open) useSyncStore().stopFromApi()
  stopRedirectTimer()
  if (!open) return
  countdown.value = 3
  redirectTimer = setInterval(() => {
    if (countdown.value <= 1) {
      stopRedirectTimer()
      const redirect = route.path === '/login' ? '' : route.fullPath
      void auth.expireSession().then(() =>
        router.replace({
          name: 'login',
          query: redirect ? { redirect } : {},
        }),
      )
      return
    }
    countdown.value -= 1
  }, 1000)
})

onMounted(async () => {
  try {
    await initDatabase()
    await useNetworkStore().init()
    const settings = useSettingsStore()
    await settings.load()
    applyLocale(normalizeLocale(settings.current.locale))
    await useSyncStore().refresh()
    await auth.load()
    if (!auth.isLoggedIn && !route.meta.public) {
      // await router.replace({ name: 'login', query: { redirect: route.fullPath } })
    }
    const home = homePathForShell()
    if (isNative() || detectDeviceShell() === 'mobile') {
      if (!route.path.startsWith('/app/mobile')) {
        await router.replace(home)
      }
    } else if (route.path === '/login') {
      await router.replace(home)
    }
    if (isNative()) {
      watchAppPause(() => {
        void createBackup().catch(() => undefined)
      })
      const minutes = settings.current.autoBackupMinutes
      if (minutes > 0) {
        backupTimer = setInterval(() => {
          void createBackup().catch(() => undefined)
        }, minutes * 60 * 1000)
      }
    }
    ready.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    toast.add({ severity: 'error', summary: t('app.initError'), detail: error.value, life: 4000 })
  }
})

onUnmounted(() => {
  if (backupTimer) clearInterval(backupTimer)
  stopRedirectTimer()
})
</script>

<template>
  <Toast position="bottom-center" :pt="{ closeButton: { style: { display: 'none' } } }" />
  <ConfirmDialog :closable="false" dismissable-mask />
  <Dialog :visible="unauthorized" modal :closable="false" :dismissable-mask="false" :close-on-escape="false"
    :header="t('auth.sessionExpiredTitle')" :style="{ width: 'min(420px, 96vw)' }">
    <p>{{ t('auth.sessionExpired') }}</p>
    <p>{{ t('auth.redirectIn', { seconds: countdown }) }}</p>
  </Dialog>
  <div v-if="!ready" class="grid min-h-dvh place-items-center gap-3 text-mint"
    :style="{ padding: 'var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left)' }">
    <ProgressSpinner />
    <div>{{ t('app.booting') }}</div>
    <Message v-if="error" severity="error">{{ error }}</Message>
  </div>
  <router-view v-else />
</template>
