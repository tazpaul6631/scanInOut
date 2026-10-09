import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BleDevice } from '@capacitor-community/bluetooth-le'
import type { LiveWeight } from '@/types'

export const useHardwareStore = defineStore('hardware', () => {
  const usbConnected = ref(false)
  const bleConnected = ref(false)
  const bleDevice = ref<BleDevice | null>(null)
  const nfcListening = ref(false)
  const liveWeight = ref<LiveWeight | null>(null)
  const lastError = ref('')

  function setWeight(weight: LiveWeight | null) {
    liveWeight.value = weight
  }

  return {
    usbConnected,
    bleConnected,
    bleDevice,
    nfcListening,
    liveWeight,
    lastError,
    setWeight,
  }
})
