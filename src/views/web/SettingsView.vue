<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import InputText from '@/components/ui/AppInputText.vue'
import InputNumber from '@/components/ui/AppInputNumber.vue'
import FloatLabel from '@/components/ui/AppFloatLabel.vue'
import Button from '@/components/ui/AppButton.vue'
import { useToast } from 'primevue/usetoast'
import { createSettingsSchema } from '@/schemas/settings'
import { useSettingsStore } from '@/stores/settings'
import { isNative, platformName } from '@/adapters/platform'
import { applyLocale, type AppLocale } from '@/i18n'
import LocaleSelect from '@/components/layout/LocaleSelect.vue'

const { t, locale } = useI18n()
const toast = useToast()
const settings = useSettingsStore()

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: computed(() => {
    void locale.value
    return toTypedSchema(createSettingsSchema())
  }),
  initialValues: { ...settings.current, locale: settings.current.locale as AppLocale },
})

const [apiUrl, apiUrlAttrs] = defineField('apiUrl')
const [companyName, companyNameAttrs] = defineField('companyName')
const [scaleBaudRate, baudAttrs] = defineField('scaleBaudRate')
const [bleServiceUuid, svcAttrs] = defineField('bleServiceUuid')
const [bleCharacteristicUuid, charAttrs] = defineField('bleCharacteristicUuid')
const [autoBackupMinutes, backupAttrs] = defineField('autoBackupMinutes')

const submit = handleSubmit(async (values) => {
  applyLocale(values.locale)
  await settings.update(values)
  toast.add({ severity: 'success', summary: t('settings.saved'), life: 2000 })
})
</script>

<template>
  <div class="mb-2.5 flex items-end justify-between gap-3 max-md:flex-col max-md:items-stretch">
    <div class="min-w-0">
      <h2 class="m-0 mb-1 text-[26px] max-lg:text-[22px] max-md:text-xl">{{ t('settings.subtitle', {
        platform: platformName(), store: isNative() ? t('settings.nativeStore') :
          t('settings.webStore')
      }) }}</h2>
    </div>
  </div>

  <form class="grid max-w-[640px] gap-4 rounded-2xl border border-line bg-white p-2.5 shadow-panel" @submit.prevent="submit">
    <LocaleSelect />
    <div>
      <FloatLabel>
        <InputText id="company-name" name="company-name" v-model="companyName" v-bind="companyNameAttrs"
          class="w-full" />
        <label for="company-name">{{ t('settings.company') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.companyName }}</small>
    </div>
    <div>
      <FloatLabel>
        <InputText id="api-url" name="api-url" v-model="apiUrl" v-bind="apiUrlAttrs" class="w-full" />
        <label for="api-url">{{ t('settings.apiUrl') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.apiUrl }}</small>
    </div>
    <div>
      <FloatLabel>
        <InputNumber input-id="scale-baud-rate" name="scale-baud-rate" v-model="scaleBaudRate" v-bind="baudAttrs"
          :min="1200" :max="115200" class="w-full" />
        <label for="scale-baud-rate">{{ t('settings.baud') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.scaleBaudRate }}</small>
    </div>
    <div>
      <FloatLabel>
        <InputText id="ble-service-uuid" name="ble-service-uuid" v-model="bleServiceUuid" v-bind="svcAttrs"
          class="w-full" />
        <label for="ble-service-uuid">{{ t('settings.bleService') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.bleServiceUuid }}</small>
    </div>
    <div>
      <FloatLabel>
        <InputText id="ble-char-uuid" name="ble-char-uuid" v-model="bleCharacteristicUuid" v-bind="charAttrs"
          class="w-full" />
        <label for="ble-char-uuid">{{ t('settings.bleChar') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.bleCharacteristicUuid }}</small>
    </div>
    <div>
      <FloatLabel>
        <InputNumber input-id="auto-backup-minutes" name="auto-backup-minutes" v-model="autoBackupMinutes"
          v-bind="backupAttrs" :min="0" :max="180" class="w-full" />
        <label for="auto-backup-minutes">{{ t('settings.autoBackup') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.autoBackupMinutes }}</small>
    </div>
    <Button type="submit" :label="t('common.save')" icon="pi pi-save" />
  </form>
</template>
