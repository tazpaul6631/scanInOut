<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from '@/components/ui/AppButton.vue'
import Message from '@/components/ui/AppMessage.vue'
import { useToast } from 'primevue/usetoast'
import { capturePhoto, pickFromGallery, startVideoStream, createRecorder, saveVideoBlob, stopStream } from '@/adapters/camera'
import { addMedia, deleteMedia, listMedia } from '@/services/repositories/media'
import { getFileUri } from '@/storage/files'
import { formatBytes, formatDateTime } from '@/utils/format'
import type { MediaItem } from '@/types'

const { t } = useI18n()
const toast = useToast()
const items = ref<Array<MediaItem & { preview?: string }>>([])
const error = ref('')
const recording = ref(false)
const videoEl = ref<HTMLVideoElement | null>(null)
let stream: MediaStream | null = null
let stopRecorder: (() => Promise<Blob>) | null = null

async function reload() {
  const list = await listMedia()
  items.value = await Promise.all(
    list.map(async (item) => {
      try {
        return { ...item, preview: await getFileUri(item.path) }
      } catch {
        return item
      }
    }),
  )
}

onMounted(reload)

onUnmounted(() => {
  stopStream(stream)
})

async function wrap(work: () => Promise<void>) {
  error.value = ''
  try {
    await work()
    await reload()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

function photo() {
  return wrap(async () => {
    const captured = await capturePhoto()
    await addMedia({ kind: 'photo', path: captured.path, mime: captured.mime, size: captured.size })
    toast.add({ severity: 'success', summary: t('media.savedPhoto'), life: 2000 })
  })
}

function gallery() {
  return wrap(async () => {
    const captured = await pickFromGallery()
    await addMedia({ kind: 'photo', path: captured.path, mime: captured.mime, size: captured.size })
  })
}

async function startRec() {
  error.value = ''
  if (!videoEl.value) return
  try {
    stream = await startVideoStream(videoEl.value)
    const rec = createRecorder(stream)
    stopRecorder = rec.stop
    recording.value = true
  } catch (err) {
    stopStream(stream)
    stream = null
    error.value = err instanceof Error ? err.message : String(err)
  }
}

async function stopRec() {
  if (!stopRecorder) return
  try {
    const blob = await stopRecorder()
    const captured = await saveVideoBlob(blob)
    await addMedia({
      kind: 'video',
      path: captured.path,
      mime: captured.mime,
      size: captured.size,
    })
    toast.add({ severity: 'success', summary: t('media.savedVideo'), life: 2000 })
    await reload()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    stopRecorder = null
    recording.value = false
    stopStream(stream)
    stream = null
  }
}

function remove(id: string) {
  return wrap(async () => {
    await deleteMedia(id)
  })
}
</script>

<template>
  <div class="mb-2.5 flex items-end justify-between gap-3 max-md:flex-col max-md:items-stretch">
    <div class="min-w-0">
      <h2 class="m-0 mb-1 text-[26px] max-lg:text-[22px] max-md:text-xl">{{ t('media.subtitle') }}</h2>
    </div>
  </div>

  <Message v-if="error" class="mb-3" severity="error">{{ error }}</Message>

  <div class="mb-4 rounded-2xl border border-line bg-white p-2.5 shadow-panel">
    <div class="mb-3 flex flex-wrap gap-2">
      <Button :label="t('media.capture')" icon="pi pi-camera" @click="photo" />
      <Button :label="t('media.gallery')" icon="pi pi-images" severity="secondary" @click="gallery" />
      <Button v-if="!recording" :label="t('media.recordStart')" icon="pi pi-circle" severity="danger"
        @click="startRec" />
      <Button v-else :label="t('media.recordStop')" icon="pi pi-stop" @click="stopRec" />
    </div>
    <video ref="videoEl" muted playsinline class="w-full max-w-[480px] rounded-xl bg-neutral-900" />
  </div>

  <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 max-md:grid-cols-1">
    <div v-for="item in items" :key="item.id" class="rounded-2xl border border-line bg-white p-2.5 shadow-panel">
      <img v-if="item.kind === 'photo' && item.preview" class="h-[140px] w-full rounded-xl bg-neutral-900 object-cover"
        :src="item.preview" alt="" />
      <video v-else-if="item.preview" class="h-[140px] w-full rounded-xl bg-neutral-900 object-cover" :src="item.preview"
        controls />
      <div class="mt-2">
        <strong>{{ item.kind }}</strong>
        <div>{{ formatBytes(item.size) }}</div>
        <div>{{ formatDateTime(item.createdAt) }}</div>
        <Button size="small" severity="danger" text :label="t('common.delete')" @click="remove(item.id)" />
      </div>
    </div>
  </div>
</template>
