<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/AppButton.vue'
import Badge from 'primevue/badge'
import Tag from '@/components/ui/AppTag.vue'
import LocaleSelect from '@/components/layout/LocaleSelect.vue'
import UserMenu from '@/components/layout/UserMenu.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useSyncStore } from '@/stores/sync'
import { useSettingsStore } from '@/stores/settings'
import { detectDeviceShell, isNative, type DeviceShell } from '@/adapters/platform'

const { t } = useI18n()
const route = useRoute()
const sync = useSyncStore()
const { fromApiRunning, fromApiBatch, fromApiTotal } = storeToRefs(sync)
const settings = useSettingsStore()
const open = ref(false)
const collapsed = ref(false)
const hoverOpen = ref(false)
const shell = ref<DeviceShell>(detectDeviceShell())
const platformIsNative = computed(isNative)
const isDrawer = computed(() => shell.value !== 'web' || platformIsNative.value)
const webIconRail = computed(() => !isDrawer.value && collapsed.value)
const showBackdrop = computed(() => (isDrawer.value && open.value) || (webIconRail.value && hoverOpen.value))
const localeSelect = ref<{ hide?: () => void }>()
const userMenu = ref<{ hide?: () => void }>()
let hoverCloseTimer: ReturnType<typeof setTimeout> | null = null

function dismissChromePopups() {
  localeSelect.value?.hide?.()
  userMenu.value?.hide?.()
}

function refreshShell() {
  shell.value = detectDeviceShell()
}

function clearHoverTimer() {
  if (!hoverCloseTimer) return
  clearTimeout(hoverCloseTimer)
  hoverCloseTimer = null
}

function canHoverExpand() {
  return webIconRail.value && window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

function closeSidebar() {
  open.value = false
  hoverOpen.value = false
  clearHoverTimer()
}

function toggleSidebar() {
  if (isDrawer.value) {
    open.value = !open.value
    return
  }
  hoverOpen.value = false
  collapsed.value = !collapsed.value
}

function onSidebarEnter() {
  if (!canHoverExpand()) return
  clearHoverTimer()
  dismissChromePopups()
  hoverOpen.value = true
}

function onSidebarLeave() {
  if (!canHoverExpand()) return
  clearHoverTimer()
  hoverCloseTimer = setTimeout(() => {
    hoverOpen.value = false
  }, 160)
}

function onBackdrop() {
  closeSidebar()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeSidebar()
}

onMounted(() => {
  refreshShell()
  window.addEventListener('resize', refreshShell)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', refreshShell)
  window.removeEventListener('keydown', onKeydown)
  clearHoverTimer()
})

watch(isDrawer, (drawer) => {
  if (drawer) closeSidebar()
})

watch(() => route.fullPath, () => {
  closeSidebar()
})

const pdaMode = computed(() => platformIsNative.value || shell.value === 'mobile')

const navGroups = computed(() => {
  if (pdaMode.value) {
    return [
      {
        key: 'mobile',
        label: t('nav.app'),
        items: [
          { to: '/app/mobile/scan', icon: 'pi pi-qrcode', label: t('nav.mobileScan') },
          { to: '/app/mobile/history', icon: 'pi pi-list', label: t('nav.mobileHistory') },
        ],
      },
    ]
  }
  return [
    {
      key: 'web',
      label: t('nav.web'),
      items: [
        { to: '/', icon: 'pi pi-home', label: t('nav.dashboard') },
        { to: '/users', icon: 'pi pi-users', label: t('nav.users') },
        { to: '/scan', icon: 'pi pi-qrcode', label: t('nav.scan') },
        { to: '/scale', icon: 'pi pi-sliders-h', label: t('nav.scale') },
        { to: '/hardware', icon: 'pi pi-wifi', label: t('nav.hardware') },
        { to: '/media', icon: 'pi pi-camera', label: t('nav.media') },
        { to: '/sync', icon: 'pi pi-sync', label: t('nav.sync') },
        { to: '/settings', icon: 'pi pi-cog', label: t('nav.settings') },
      ],
    },
    {
      key: 'app',
      label: t('nav.app'),
      items: [
        { to: '/app/tablet', icon: 'pi pi-tablet', label: t('nav.tablet') },
        { to: '/app/mobile/scan', icon: 'pi pi-mobile', label: t('nav.mobile') },
      ],
    },
  ]
})

const homeTo = computed(() => (pdaMode.value ? '/app/mobile/scan' : '/'))

const title = computed(() =>
  navGroups.value.flatMap((group) => group.items).find((link) => link.to === route.path)?.label || t('app.name'),
)
</script>

<template>
  <div class="shell-wrap">
    <div class="sidebar-backdrop" :class="{ show: showBackdrop }" :aria-hidden="!showBackdrop" @click="onBackdrop" />
    <div class="shell" :class="{ drawer: isDrawer, collapsed: webIconRail, 'sidebar-hover': webIconRail && hoverOpen }">
      <div class="shell-body">
        <div v-if="webIconRail" class="sidebar-rail-spacer" aria-hidden="true" />
        <aside class="sidebar" :class="{ open, hover: webIconRail && hoverOpen }" @mouseenter="onSidebarEnter"
          @mouseleave="onSidebarLeave" @click.stop>
          <RouterLink :to="homeTo" class="brand brand-btn"
            :title="hoverOpen ? undefined : t('app.name')" @click="closeSidebar">
            <img class="brand-mark" src="/logo-icon.jpg" :alt="t('app.name')" />
            <div>
              <h1>{{ t('app.name') }}</h1>
              <!-- <p>{{ settings.current.companyName }}</p> -->
            </div>
          </RouterLink>
          <nav class="sidebar-nav">
            <div v-for="group in navGroups" :key="group.key" class="sidebar-nav-group">
              <div class="sidebar-nav-label">{{ group.label }}</div>
              <RouterLink v-for="link in group.items" :key="link.to" :to="link.to" class="nav-link"
                :title="hoverOpen ? undefined : link.label" @click="closeSidebar">
                <i :class="link.icon" />
                <span>{{ link.label }}</span>
                <Badge v-if="link.to === '/sync' && sync.pending" :value="sync.pending" severity="warning" />
              </RouterLink>
            </div>
          </nav>
        </aside>
        <div class="main">
          <header class="topbar">
            <div class="flex min-w-0 items-center gap-2 text-cyan-700">
              <Button class="menu-btn" icon="pi pi-bars" :aria-label="t('nav.menu')" @click="toggleSidebar" />
              <strong class="min-w-0 truncate text-xl">{{ title }}</strong>
            </div>
            <div class="flex min-w-0 shrink items-center gap-2">
              <Tag v-if="fromApiRunning" class="sync-from-api-badge max-w-[min(16rem,42vw)] overflow-hidden"
                severity="info" :value="t('dashboard.syncFromApiRunning', { batch: fromApiBatch, n: fromApiTotal })" />
              <LocaleSelect ref="localeSelect" :compact="shell === 'mobile'" />
              <UserMenu ref="userMenu" :compact="shell === 'mobile'" />
            </div>
          </header>
          <section class="content">
            <RouterView />
          </section>
          <AppFooter />
        </div>
      </div>
    </div>
  </div>
</template>
