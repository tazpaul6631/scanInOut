<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import Dialog from '@/components/ui/AppDialog.vue'
import Password from '@/components/ui/AppPassword.vue'
import FloatLabel from '@/components/ui/AppFloatLabel.vue'
import Button from '@/components/ui/AppButton.vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { useNetworkStore } from '@/stores/network'
import { personInitials } from '@/utils/format'
import { createChangePasswordSchema } from '@/schemas/change-password'
import type { MenuItem } from 'primevue/menuitem'

const { compact } = defineProps<{ compact?: boolean }>()

const { t, locale } = useI18n()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const auth = useAuthStore()
const sync = useSyncStore()
const network = useNetworkStore()
const menu = ref<InstanceType<typeof Menu>>()
const passwordOpen = ref(false)

const displayName = computed(() => auth.session?.name?.trim() || auth.session?.email || t('app.name'))
const displayCode = computed(() => auth.session?.code?.trim() || auth.session?.email || '—')
const initials = computed(() => personInitials(displayName.value))

const items = computed<MenuItem[]>(() => [
  {
    label: t('auth.changePassword'),
    icon: 'pi pi-key',
    class: 'user-menu-item user-menu-item-change-password',
    command: openChangePassword,
  },
  { separator: true },
  {
    label: t('auth.logout'),
    icon: 'pi pi-sign-out',
    class: 'user-menu-item user-menu-item-logout',
    command: logout,
  },
])

const { defineField, handleSubmit, errors, resetForm } = useForm({
  validationSchema: computed(() => {
    void locale.value
    return toTypedSchema(createChangePasswordSchema())
  }),
  initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  validateOnMount: false,
})

const [currentPassword, currentPasswordAttrs] = defineField('currentPassword', { validateOnModelUpdate: true })
const [newPassword, newPasswordAttrs] = defineField('newPassword', { validateOnModelUpdate: true })
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword', { validateOnModelUpdate: true })

function toggleMenu(event: Event) {
  menu.value?.toggle(event)
}

function hideMenu() {
  menu.value?.hide()
}

defineExpose({ hide: hideMenu })

function openChangePassword() {
  resetForm()
  passwordOpen.value = true
}

function closeChangePassword() {
  passwordOpen.value = false
  resetForm()
}

const submitPassword = handleSubmit(() => {
  toast.add({
    severity: 'warn',
    summary: t('auth.changePasswordUnavailable'),
    life: 3000,
    closable: false,
  })
  closeChangePassword()
})

function logout() {
  confirm.require({
    header: t('auth.logout'),
    message: t('auth.confirmLogout'),
    acceptLabel: t('auth.logout'),
    rejectLabel: t('common.cancel'),
    acceptIcon: 'pi pi-sign-out',
    acceptClass: 'p-button-danger',
    rejectClass: 'p-button-secondary',
    acceptProps: {
      raised: true,
      ripple: false,
      icon: 'pi pi-sign-out',
    },
    rejectProps: {
      text: true,
      raised: false,
      ripple: false,
    },
    accept: async () => {
      sync.stopFromApi()
      await auth.logout()
      await router.replace({ name: 'login' })
    },
    reject: async () => {
      confirm.close()
    },
  })
}
</script>

<template>
  <button type="button" class="user-chip" :class="{ compact }" :aria-label="displayName" @click="toggleMenu">
    <span class="user-avatar-wrap">
      <Avatar :label="initials" shape="circle" class="user-avatar" />
      <i class="user-net-dot" :class="network.online ? 'online' : 'offline'"
        :title="`${network.online ? t('common.online') : t('common.offline')} · ${network.connectionType}`"
        aria-hidden="true" />
    </span>
    <span v-if="!compact" class="user-chip-text">
      <strong>{{ displayName }}</strong>
      <small>{{ displayCode }}</small>
    </span>
    <i v-if="!compact" class="pi pi-angle-down user-chip-caret" aria-hidden="true" />
  </button>
  <Menu ref="menu" class="user-menu" :model="items" popup />
  <Dialog v-model:visible="passwordOpen" modal :header="t('auth.changePassword')" :style="{ width: 'min(420px, 96vw)' }"
    @hide="closeChangePassword" :closable="false">
    <form class="mt-1.5 flex flex-col gap-2" @submit.prevent="submitPassword">
      <FloatLabel class="w-full">
        <Password input-id="current-password" v-model="currentPassword" v-bind="currentPasswordAttrs"
          :invalid="Boolean(errors.currentPassword)" :feedback="false" toggle-mask autocomplete="current-password"
          class="w-full" :input-style="{ width: '100%' }" />
        <label for="current-password">{{ t('auth.currentPassword') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.currentPassword }}</small>
      <FloatLabel class="w-full">
        <Password input-id="new-password" v-model="newPassword" v-bind="newPasswordAttrs"
          :invalid="Boolean(errors.newPassword)" :feedback="false" toggle-mask autocomplete="new-password"
          class="w-full" :input-style="{ width: '100%' }" />
        <label for="new-password">{{ t('auth.newPassword') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.newPassword }}</small>
      <FloatLabel class="w-full">
        <Password input-id="confirm-password" v-model="confirmPassword" v-bind="confirmPasswordAttrs"
          :invalid="Boolean(errors.confirmPassword)" :feedback="false" toggle-mask autocomplete="new-password"
          class="w-full" :input-style="{ width: '100%' }" />
        <label for="confirm-password">{{ t('auth.confirmPassword') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.confirmPassword }}</small>
      <div class="mt-3 flex justify-end gap-2">
        <Button type="button" :label="t('common.cancel')" :raised="false" text :ripple="false"
          @click="closeChangePassword" />
        <Button type="submit" :label="t('common.save')" :ripple="false" />
      </div>
    </form>
  </Dialog>
</template>
