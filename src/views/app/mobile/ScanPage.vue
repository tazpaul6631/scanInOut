<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Button from '@/components/ui/AppButton.vue'
import InputNumber from '@/components/ui/AppInputNumber.vue'
import FloatLabel from '@/components/ui/AppFloatLabel.vue'
import Tag from '@/components/ui/AppTag.vue'
import { useScan } from '@/composables/useScan'
import { useBarcodeWedge } from '@/composables/useBarcodeWedge'
import { existsScanLog } from '@/services/repositories/scans'
import type { ScanDirection, ScanResult } from '@/types'

const { t } = useI18n()
const toast = useToast()

/**
 * Comment 1 dòng trong list để khóa chiều còn lại (tự active, không cần nhấn).
 * Cả 2 còn → mặc định `in`.
 */
const enabledDirections: ScanDirection[] = [
  'in',
  // 'out',
]

const showDirectionIn = enabledDirections.includes('in')
const showDirectionOut = enabledDirections.includes('out')

function resolveDefaultDirection(): ScanDirection {
  if (showDirectionIn) return 'in'
  if (showDirectionOut) return 'out'
  return 'in'
}

const direction = ref<ScanDirection>(resolveDefaultDirection())
const { remember } = useScan(direction)
const manual = ref<number | null>(null)
const sessionItems = ref<ScanResult[]>([])
const savedCount = computed(() => sessionItems.value.length)

async function saveCode(value: string, kind: 'manual' | 'barcode', format: string) {
  const code = value.trim()
  if (!code) return
  if (await existsScanLog(code, direction.value)) {
    toast.add({
      severity: 'warn',
      summary: t('scan.duplicate'),
      life: 2500,
      closable: false,
    })
    manual.value = null
    return
  }
  const item: ScanResult = { value: code, format, kind, direction: direction.value }
  await remember(item)
  sessionItems.value.unshift(item)
  manual.value = null
}

useBarcodeWedge(async (value) => {
  await saveCode(value, 'barcode', 'WEDGE')
})

function setDirection(next: ScanDirection) {
  if (next === 'in' && !showDirectionIn) return
  if (next === 'out' && !showDirectionOut) return
  direction.value = next
}

async function saveManual() {
  if (manual.value == null) return
  await saveCode(String(manual.value), 'manual', 'MANUAL')
}
</script>

<template>
  <div class="page-fill gap-3 overflow-hidden" :style="{ paddingBottom: 'var(--safe-bottom)' }">
    <div class="page-fill-panel rounded-2xl border border-line bg-white p-3 shadow-panel">
      <div v-if="showDirectionIn || showDirectionOut" class="mb-3 flex shrink-0 flex-wrap items-center gap-2">
        <!-- Muốn khóa 1 chiều: comment 'in' hoặc 'out' trong enabledDirections (script), nút còn lại tự active -->
        <Button v-if="showDirectionIn" :label="t('scan.directionIn')"
          :severity="direction === 'in' ? 'success' : 'secondary'" :outlined="direction !== 'in'"
          @click="setDirection('in')" />
        <!-- <Button v-if="showDirectionOut" :label="t('scan.directionOut')"
          :severity="direction === 'out' ? 'warn' : 'secondary'" :outlined="direction !== 'out'"
          @click="setDirection('out')" /> -->
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <FloatLabel class="min-w-0 flex-1">
          <InputNumber input-id="manual-input" name="manual-input" v-model="manual" :use-grouping="false" :min="0"
            :max-fraction-digits="0" class="w-full" />
          <label for="manual-input">{{ t('scan.manualPlaceholder') }}</label>
        </FloatLabel>
        <Button class="shrink-0" :label="t('common.save')" @click="saveManual" />
      </div>

      <div v-if="sessionItems.length" class="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        <div v-for="(item, index) in sessionItems" :key="`${item.value}-${item.direction}-${item.kind}`"
          class="shrink-0 rounded-2xl border p-2.5"
          :class="index === 0 ? 'border-[#7dcea0] bg-[#d5f5e3]' : 'border-line bg-white'">
          <div class="flex items-center gap-2">
            <span class="shrink-0 text-sm font-semibold text-muted">#{{ sessionItems.length - index }}</span>
            <div class="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span class="min-w-0 break-all">
                <strong>{{ t('scan.result') }}:</strong> {{ item.value }}
              </span>
              <Tag class="shrink-0 font-semibold" :class="item.direction === 'out'
                ? '!border-transparent !bg-amber-500 !text-white'
                : '!border-transparent !bg-emerald-600 !text-white'"
                :value="item.direction === 'out' ? t('scan.directionOut') : t('scan.directionIn')" />
            </div>
          </div>
        </div>
      </div>
      <p v-if="savedCount" class="mb-0 mt-2 shrink-0 text-sm text-muted">{{ t('mobile.savedSession', { n: savedCount })
      }}</p>
    </div>
  </div>
</template>
