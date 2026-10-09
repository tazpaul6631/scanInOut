<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/AppButton.vue'
import InputText from '@/components/ui/AppInputText.vue'
import FloatLabel from '@/components/ui/AppFloatLabel.vue'
import Tag from '@/components/ui/AppTag.vue'
import { useScan } from '@/composables/useScan'
import { useBarcodeWedge } from '@/composables/useBarcodeWedge'
import type { ScanDirection } from '@/types'

const { t } = useI18n()
const direction = ref<ScanDirection>('in')
const { last, remember } = useScan(direction)
const manual = ref('')
const savedCount = ref(0)

function focusManual() {
  void nextTick(() => {
    document.getElementById('manual-input')?.focus()
  })
}

async function saveCode(value: string, kind: 'manual' | 'barcode', format: string) {
  const code = value.trim()
  if (!code) return
  await remember({ value: code, format, kind, direction: direction.value })
  manual.value = ''
  savedCount.value += 1
  focusManual()
}

useBarcodeWedge(async (value) => {
  await saveCode(value, 'barcode', 'WEDGE')
})

onMounted(() => {
  focusManual()
})

function setDirection(next: ScanDirection) {
  direction.value = next
  focusManual()
}

async function saveManual() {
  await saveCode(manual.value, 'manual', 'MANUAL')
}
</script>

<template>
  <div class="flex flex-col gap-3 p-1">
    <div>
      <h2 class="m-0 mb-1 text-xl">{{ t('nav.mobileScan') }}</h2>
      <p class="m-0 text-sm text-muted">{{ t('scan.wedgeHint') }}</p>
    </div>

    <div class="rounded-2xl border border-line bg-white p-3 shadow-panel">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <span class="text-sm font-semibold text-ink">{{ t('scan.direction') }}</span>
        <Button
          :label="t('scan.directionIn')"
          :severity="direction === 'in' ? 'success' : 'secondary'"
          :outlined="direction !== 'in'"
          @click="setDirection('in')"
        />
        <Button
          :label="t('scan.directionOut')"
          :severity="direction === 'out' ? 'warn' : 'secondary'"
          :outlined="direction !== 'out'"
          @click="setDirection('out')"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <FloatLabel class="min-w-32 flex-1">
          <InputText id="manual-input" name="manual-input" v-model="manual" class="w-full" autocomplete="off" />
          <label for="manual-input">{{ t('scan.manualPlaceholder') }}</label>
        </FloatLabel>
        <Button :label="t('common.save')" @click="saveManual" />
      </div>

      <div v-if="last" class="mt-3 rounded-2xl border border-line bg-[#f4faf7] p-2.5">
        <strong>{{ t('scan.result') }}:</strong> {{ last.value }}
        <div class="mt-1 flex flex-wrap items-center gap-2">
          <Tag
            :value="last.direction === 'out' ? t('scan.directionOut') : t('scan.directionIn')"
            :severity="last.direction === 'out' ? 'warn' : 'success'"
          />
          <span class="text-sm text-muted">{{ last.kind }} · {{ last.format }}</span>
        </div>
      </div>
      <p v-if="savedCount" class="mb-0 mt-2 text-sm text-muted">{{ t('mobile.savedSession', { n: savedCount }) }}</p>
    </div>
  </div>
</template>
