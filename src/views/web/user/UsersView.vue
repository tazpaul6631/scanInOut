<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from '@/components/ui/AppDataTable.vue'
import Column from '@/components/ui/AppColumn.vue'
import Button from '@/components/ui/AppButton.vue'
import Tag from '@/components/ui/AppTag.vue'
import InputText from '@/components/ui/AppInputText.vue'
import FloatLabel from '@/components/ui/AppFloatLabel.vue'
import Skeleton from 'primevue/skeleton'
import Dialog from '@/components/ui/AppDialog.vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { deleteUser, queryUserResult } from '@/services/api/user'
import { readApiFailure } from '@/services/api/error'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/format'
import type { ViewUser } from '@/types/api'
import { detectDeviceShell, type DeviceShell } from '@/adapters/platform'
import UserFormView from '@/views/web/user/UserFormView.vue'

const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()
const auth = useAuthStore()
const users = ref<ViewUser[]>([])
const q = ref('')
const loading = ref(false)
const formOpen = ref(false)
const editingId = ref<string | null>(null)
const shell = ref<DeviceShell>(detectDeviceShell())
const compact = computed(() => shell.value === 'mobile')
const showCode = computed(() => shell.value !== 'mobile')
const showEmailColumn = computed(() => shell.value !== 'mobile')
const showActive = computed(() => shell.value !== 'mobile')
const showUpdated = computed(() => shell.value === 'web')
const paginatorTemplate = computed(() => {
  if (shell.value === 'mobile') return 'PrevPageLink CurrentPageReport NextPageLink'
  if (shell.value === 'tablet') return 'PrevPageLink PageLinks NextPageLink RowsPerPageDropdown'
  return 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport'
})
const pageReport = computed(() =>
  shell.value === 'mobile'
    ? '{first}-{last} / {totalRecords}'
    : 'Showing {first} to {last} of {totalRecords} entries',
)
const skeletonRows = Array.from({ length: 8 }, (_, index) => ({ id: `sk-${index}` }))
const tableRows = computed(() => (loading.value ? skeletonRows : users.value))

function refreshShell() {
  shell.value = detectDeviceShell()
}

async function load() {
  loading.value = true
  try {
    const res = await queryUserResult({
      page: 1,
      pageSize: 100,
      keyword: q.value.trim() || undefined,
    })
    if (!res.success) {
      users.value = []
      toast.add({ severity: 'error', summary: res.message || t('user.loadError'), life: 3500 })
      return
    }
    users.value = res.data?.items ?? []
  } catch (err) {
    users.value = []
    toast.add({ severity: 'error', summary: readApiFailure(err) || t('user.loadError'), life: 3500 })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  formOpen.value = true
}

function openEdit(id: string) {
  editingId.value = id
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingId.value = null
}

async function onSaved() {
  closeForm()
  toast.add({ severity: 'success', summary: t('user.saved'), life: 2000 })
  await load()
}

function remove(user: ViewUser) {
  confirm.require({
    header: t('user.deleteTitle'),
    message: t('user.deleteMessage', { name: user.name || user.email || user.code }),
    acceptLabel: t('common.delete'),
    rejectLabel: t('common.cancel'),
    acceptIcon: 'pi pi-trash',
    acceptClass: 'p-button-danger',
    rejectClass: 'p-button-secondary',
    acceptProps: {
      raised: true,
      ripple: false,
      icon: 'pi pi-trash',
    },
    rejectProps: {
      text: true,
      raised: false,
      ripple: false,
    },
    accept: async () => {
      try {
        const updatedBy = auth.session?.userId
        const res = await deleteUser(user.id, updatedBy ? { updatedBy } : undefined)
        if (!res.success) {
          toast.add({ severity: 'error', summary: res.message || t('user.deleteError'), life: 3500 })
          return
        }
        toast.add({ severity: 'success', summary: res.message || t('user.deleted'), life: 2000 })
        await load()
      } catch (err) {
        toast.add({ severity: 'error', summary: readApiFailure(err) || t('user.deleteError'), life: 3500 })
      }
    },
  })
}

function clearFilter() {
  q.value = ''
  void load()
}

onMounted(() => {
  refreshShell()
  window.addEventListener('resize', refreshShell)
  void load()
})

onUnmounted(() => {
  window.removeEventListener('resize', refreshShell)
})
</script>

<template>
  <div class="page-fill users-page" :data-shell="shell">
    <div class="page-fill-panel rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <div class="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 max-md:flex-col max-md:items-stretch">
        <div class="flex min-w-0 flex-1 items-center gap-2 max-md:w-full">
          <FloatLabel class="min-w-32 flex-1">
            <InputText id="user-search" name="user-search" v-model="q" class="w-full" @keydown.enter="load" />
            <label for="user-search">{{ t('user.searchPlaceholder') }}</label>
          </FloatLabel>
          <Button :label="compact ? undefined : t('common.clearFilter')" :ripple="false" icon="pi pi-filter-slash"
            :loading="loading" :disabled="!q.trim()" :aria-label="t('common.clearFilter')" @click="clearFilter" />
        </div>
        <div class="shrink-0 max-md:w-full max-md:[&_.p-button]:w-full">
          <Button :label="t('user.add')" :ripple="false" icon="pi pi-plus" @click="openCreate" />
        </div>
      </div>
      <div class="table-wrap-fill w-full max-w-full overflow-x-auto">
        <DataTable :value="tableRows" paginator :rows="10" :rows-per-page-options="[5, 10, 20]" striped-rows row-hover
          scrollable scroll-height="flex" :paginator-template="paginatorTemplate"
          :current-page-report-template="pageReport">
          <Column v-if="showCode" field="code" :header="t('user.code')" :sortable="!loading">
            <template #body="{ data }">
              <Skeleton v-if="loading" width="60%" height="1rem" />
              <span v-else>{{ data.code }}</span>
            </template>
          </Column>
          <Column field="name" :header="t('user.name')" :sortable="!loading">
            <template #body="{ data }">
              <Skeleton v-if="loading" width="65%" height="1rem" />
              <div v-else class="flex min-w-0 flex-col gap-0.5">
                <span>{{ data.name }}</span>
                <small v-if="compact" class="text-muted [overflow-wrap:anywhere]">{{ data.email }}</small>
              </div>
            </template>
          </Column>
          <Column v-if="showEmailColumn" field="email" :header="t('user.email')" :sortable="!loading">
            <template #body="{ data }">
              <Skeleton v-if="loading" width="70%" height="1rem" />
              <span v-else>{{ data.email }}</span>
            </template>
          </Column>
          <Column v-if="showActive" :header="t('user.active')">
            <template #body="{ data }">
              <Skeleton v-if="loading" width="3rem" height="1.25rem" />
              <Tag v-else :value="data.isActive ? t('common.yes') : t('common.no')"
                :severity="data.isActive ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column v-if="showUpdated" :header="t('user.updated')">
            <template #body="{ data }">
              <Skeleton v-if="loading" width="50%" height="1rem" />
              <span v-else>{{ formatDateTime(data.updatedAt) }}</span>
            </template>
          </Column>
          <Column :header="t('common.actions')" class="text-center">
            <template #body="{ data }">
              <Skeleton v-if="loading" width="4rem" height="2rem" />
              <div v-else class="flex justify-evenly">
                <Button icon="pi pi-pencil" :ripple="false" :aria-label="t('user.editTitle')"
                  @click="openEdit(data.id)" />
                <Button icon="pi pi-trash" :ripple="false" severity="danger" :aria-label="t('common.delete')"
                  @click="remove(data)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="table-empty flex min-h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center text-muted">
              <i class="pi pi-inbox text-[1.75rem]" />
              <p class="m-0 font-semibold text-ink">{{ t('user.emptyTitle') }}</p>
              <p class="m-0">{{ t('user.emptyHint') }}</p>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <Dialog v-model:visible="formOpen" modal dismissable-mask :closable="false"
      :header="editingId ? t('user.editTitle') : t('user.addTitle')" :style="{ width: 'min(520px, 96vw)' }"
      @hide="closeForm">
      <UserFormView v-if="formOpen" :user-id="editingId" @saved="onSaved" @cancel="closeForm" />
    </Dialog>
  </div>
</template>
