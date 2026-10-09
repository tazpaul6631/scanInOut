<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import InputText from '@/components/ui/AppInputText.vue'
import FloatLabel from '@/components/ui/AppFloatLabel.vue'
import Password from '@/components/ui/AppPassword.vue'
import Select from '@/components/ui/AppSelect.vue'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from '@/components/ui/AppButton.vue'
import Message from '@/components/ui/AppMessage.vue'
import { createUserSchema } from '@/schemas/user'
import { queryUserGetOne, updateUser, userCreate } from '@/services/api/user'
import { queryRoleResult } from '@/services/api/role'
import { readApiFailure } from '@/services/api/error'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { ViewRole } from '@/types/api'

const props = defineProps<{
  userId?: string | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const editing = computed(() => Boolean(props.userId))
const saving = ref(false)
const loading = ref(false)
const formError = ref('')
const roles = ref<ViewRole[]>([])
const roleOptions = computed(() =>
  roles.value.map((role) => ({
    ...role,
    label: role.name || role.code || role.id,
  })),
)

const emptyValues = {
  code: '',
  email: '',
  name: '',
  roleId: '',
  password: '',
  isActive: true,
}

const { defineField, handleSubmit, errors, setValues, resetForm } = useForm({
  validationSchema: computed(() => {
    void locale.value
    return toTypedSchema(createUserSchema(editing.value ? 'edit' : 'create'))
  }),
  initialValues: { ...emptyValues },
})

const [code, codeAttrs] = defineField('code')
const [email, emailAttrs] = defineField('email')
const [name, nameAttrs] = defineField('name')
const [roleId, roleIdAttrs] = defineField('roleId')
const [password, passwordAttrs] = defineField('password')
const [isActive, isActiveAttrs] = defineField('isActive')

function rolesFrom(data: unknown): ViewRole[] {
  if (Array.isArray(data)) return data as ViewRole[]
  if (data && typeof data === 'object' && 'items' in data) {
    const items = (data as { items?: ViewRole[] | null }).items
    return items ?? []
  }
  return []
}

async function loadRoles() {
  const res = await queryRoleResult(true)
  if (!res.success) {
    roles.value = []
    throw new Error(res.message || t('user.loadRolesError'))
  }
  roles.value = rolesFrom(res.data)
}

onMounted(async () => {
  formError.value = ''
  resetForm({ values: { ...emptyValues } })
  loading.value = true
  try {
    await loadRoles()
    if (!props.userId) return
    const res = await queryUserGetOne(props.userId)
    if (!res.success || !res.data) {
      await router.replace({ name: 'not-found' })
      return
    }
    setValues({
      code: res.data.code || '',
      email: res.data.email || '',
      name: res.data.name || '',
      roleId: res.data.roleId || '',
      password: '',
      isActive: res.data.isActive,
    })
  } catch (err) {
    formError.value = readApiFailure(err) || (props.userId ? t('user.notFound') : t('user.loadRolesError'))
  } finally {
    loading.value = false
  }
})

const submit = handleSubmit(async (values) => {
  formError.value = ''
  const actorId = auth.session?.userId
  if (!actorId) {
    formError.value = t('user.needSession')
    return
  }
  saving.value = true
  try {
    const res = editing.value && props.userId
      ? await updateUser(props.userId, {
        code: values.code,
        email: values.email,
        name: values.name,
        roleId: values.roleId,
        isActive: values.isActive,
        updatedBy: actorId,
      })
      : await userCreate({
        code: values.code,
        email: values.email,
        name: values.name,
        roleId: values.roleId,
        password: values.password || '',
        isActive: values.isActive,
        createdBy: actorId,
        updatedBy: actorId,
      })
    if (!res.success) {
      formError.value = res.message || t('user.saveError')
      return
    }
    emit('saved')
  } catch (err) {
    formError.value = readApiFailure(err) || t('user.saveError')
  } finally {
    saving.value = false
  }
})
</script>

<template>
  <form class="mt-1.5 grid gap-3" @submit.prevent="submit">
    <div>
      <FloatLabel>
        <InputText id="user-code" name="code" v-model="code" :invalid="Boolean(errors.code)" v-bind="codeAttrs"
          :disabled="loading" class="w-full" />
        <label for="user-code">{{ t('user.code') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.code }}</small>
    </div>
    <div>
      <FloatLabel>
        <InputText id="user-email" name="email" v-model="email" :invalid="Boolean(errors.email)" v-bind="emailAttrs"
          :disabled="loading" class="w-full" />
        <label for="user-email">{{ t('user.email') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.email }}</small>
    </div>
    <div>
      <FloatLabel>
        <InputText id="user-name" name="name" v-model="name" :invalid="Boolean(errors.name)" v-bind="nameAttrs"
          :disabled="loading" class="w-full" />
        <label for="user-name">{{ t('user.name') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.name }}</small>
    </div>
    <div>
      <FloatLabel>
        <Select input-id="user-role" name="roleId" v-model="roleId" :invalid="Boolean(errors.roleId)"
          v-bind="roleIdAttrs" :options="roleOptions" option-label="label" option-value="id" :disabled="loading"
          class="w-full" />
        <label for="user-role">{{ t('user.role') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.roleId }}</small>
    </div>
    <div v-if="!editing">
      <FloatLabel>
        <Password input-id="user-password" v-model="password" :invalid="Boolean(errors.password)" v-bind="passwordAttrs"
          autocomplete="new-password" :disabled="loading" class="w-full" :input-style="{ width: '100%' }" />
        <label for="user-password">{{ t('user.password') }}</label>
      </FloatLabel>
      <small class="p-error">{{ errors.password }}</small>
    </div>
    <div class="flex items-center gap-2.5">
      <ToggleSwitch input-id="user-active" v-model="isActive" :invalid="Boolean(errors.isActive)" v-bind="isActiveAttrs"
        :disabled="loading" />
      <label for="user-active">{{ t('user.active') }}</label>
      <small class="p-error">{{ errors.isActive }}</small>
    </div>
    <Message v-if="formError" severity="error">{{ formError }}</Message>
    <div class="flex flex-wrap justify-end gap-2">
      <Button type="button" :label="t('common.cancel')" :raised="false" text :disabled="saving"
        @click="emit('cancel')" />
      <Button type="submit" :loading="saving" :disabled="loading" :label="t('common.save')" icon="pi pi-save" />
    </div>
  </form>
</template>
