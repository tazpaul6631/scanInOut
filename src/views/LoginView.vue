<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import InputText from '@/components/ui/AppInputText.vue'
import Password from '@/components/ui/AppPassword.vue'
import FloatLabel from '@/components/ui/AppFloatLabel.vue'
import Button from '@/components/ui/AppButton.vue'
import Message from '@/components/ui/AppMessage.vue'
import { createLoginSchema } from '@/schemas/login'
import { useSettingsStore } from '@/stores/settings'
import LocaleSelect from '@/components/layout/LocaleSelect.vue'
import { detectDeviceShell, homePathForShell, type DeviceShell } from '@/adapters/platform'
import { useAuthStore } from '@/stores/auth'
import { readApiFailure } from '@/services/api/error'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()
const auth = useAuthStore()
const submitting = ref(false)
const credentialError = ref('')
const shell = ref<DeviceShell>(detectDeviceShell())

function refreshShell() {
  shell.value = detectDeviceShell()
}

onMounted(() => {
  refreshShell()
  window.addEventListener('resize', refreshShell)
})

onUnmounted(() => {
  window.removeEventListener('resize', refreshShell)
})

const { defineField, handleSubmit, errors, validateField } = useForm({
  validationSchema: computed(() => {
    void locale.value
    return toTypedSchema(createLoginSchema())
  }),
  initialValues: { email: '', password: '' },
  validateOnMount: false,
})

const [email, emailAttrs] = defineField('email', { validateOnModelUpdate: true })
const [password, passwordAttrs] = defineField('password', { validateOnModelUpdate: true })

function clearCredentialError() {
  if (credentialError.value) credentialError.value = ''
}

const submit = handleSubmit(async (values) => {
  credentialError.value = ''
  submitting.value = true
  try {
    // const res = await auth.login(values.email, values.password)
    // if (res.success && auth.isLoggedIn) {
    //   const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    //   const target = redirect.startsWith('/') && !redirect.startsWith('/login')
    //     ? redirect
    //     : homePathForShell()
    //   await router.replace(target)
    //   return
    // }
    // credentialError.value = res.message || t('auth.invalid')
  } catch (err) {
    credentialError.value = readApiFailure(err) || t('auth.invalid')
  } finally {
    submitting.value = false
  }
})
</script>

<template>
  <div
    class="grid min-h-dvh max-h-dvh grid-rows-1 place-items-center overflow-y-auto lg:grid-cols-[minmax(280px,1fr)_minmax(360px,1fr)] lg:grid-rows-[1fr_auto] lg:place-items-stretch lg:!p-0"
    :style="{ padding: 'calc(16px + var(--safe-top)) calc(16px + var(--safe-right)) calc(16px + var(--safe-bottom)) calc(16px + var(--safe-left))' }"
    :data-shell="shell">
    <section
      class="hidden flex-col items-center justify-center bg-linear-to-b from-sidebar to-sidebar-2 px-10 py-12 text-[#e7f6f1] lg:flex lg:row-start-1"
      :style="{ paddingTop: 'calc(48px + var(--safe-top))', paddingLeft: 'calc(40px + var(--safe-left))' }">
      <img class="brand-mark size-[72px] rounded-[10px]" src="/logo-icon.jpg" :alt="t('app.name')" />
      <h1 class="mt-4 mb-2 text-4xl">{{ t('app.name') }}</h1>
      <p class="m-0 opacity-80">{{ settings.current.companyName }}</p>
      <p class="mt-4 font-semibold opacity-100">{{ t(`nav.${shell}`) }}</p>
    </section>

    <form
      class="mx-auto grid w-full max-w-[420px] gap-3.5 rounded-2xl border border-line bg-white p-2.5 shadow-panel md:max-w-[460px] md:p-7 lg:row-start-1 lg:mt-[calc(24px+var(--safe-top))] lg:mr-[calc(24px+var(--safe-right))] lg:mb-6 lg:ml-6 lg:max-w-[420px] lg:self-center lg:justify-self-center"
      @submit.prevent="submit">
      <div class="flex flex-wrap-reverse items-center justify-center gap-3">
        <div>
          <h2 class="m-0 text-2xl">{{ t('auth.login') }}</h2>
        </div>

        <div class="flex w-full flex-row flex-wrap items-center justify-between gap-2">
          <img class="h-7 w-auto max-w-42 object-contain" src="/logo-company.png" :alt="t('app.name')" />
          <LocaleSelect :compact="shell === 'mobile'" />
        </div>
      </div>

      <div>
        <FloatLabel variant="on">
          <InputText id="email" v-model="email" v-bind="emailAttrs" :invalid="Boolean(errors.email)"
            autocomplete="email" class="w-full" @update:model-value="clearCredentialError" />
          <label for="email">{{ t('auth.email') }}</label>
        </FloatLabel>
        <small class="p-error">{{ errors.email }}</small>
      </div>
      <div>
        <FloatLabel variant="on">
          <Password input-id="password" v-model="password" v-bind="passwordAttrs" :invalid="Boolean(errors.password)"
            :feedback="false" toggle-mask autocomplete="current-password" class="block w-full"
            :input-style="{ width: '100%' }" @blur="void validateField('password')"
            @update:model-value="clearCredentialError" />
          <label for="password">{{ t('auth.password') }}</label>
        </FloatLabel>
        <small class="p-error">{{ errors.password }}</small>
      </div>

      <Message v-if="credentialError" severity="error">{{ credentialError }}</Message>
      <Button type="submit" :label="t('auth.login')" icon="pi pi-sign-in" :loading="submitting" />
      <p class="m-0 text-center text-xs text-muted">{{ t('footer.copyright') }}</p>
    </form>
  </div>
</template>
