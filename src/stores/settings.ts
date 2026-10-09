import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppSettings } from '@/types'
import { defaultSettings, loadSettings, resolveApiUrl, saveSettings } from '@/services/repositories/settings'

export const useSettingsStore = defineStore('settings', () => {
  const current = ref<AppSettings>({ ...defaultSettings })
  const loaded = ref(false)

  async function load() {
    current.value = await loadSettings()
    loaded.value = true
  }

  async function update(patch: Partial<AppSettings>) {
    const next = { ...patch }
    if (next.apiUrl !== undefined) next.apiUrl = resolveApiUrl(next.apiUrl)
    current.value = { ...current.value, ...next }
    await saveSettings(next)
  }

  return { current, loaded, load, update }
})
