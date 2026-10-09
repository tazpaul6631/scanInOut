import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Network } from '@capacitor/network'

export const useNetworkStore = defineStore('network', () => {
  const online = ref(true)
  const connectionType = ref('unknown')

  async function init() {
    const status = await Network.getStatus()
    online.value = status.connected
    connectionType.value = status.connectionType
    Network.addListener('networkStatusChange', (next) => {
      online.value = next.connected
      connectionType.value = next.connectionType
    })
  }

  return { online, connectionType, init }
})
