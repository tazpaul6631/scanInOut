import { onUnmounted } from 'vue'
import { requestUsbPort, listenUsbLines, disconnectUsb } from '@/adapters/usb'
import {
  requestBleDevice,
  connectBle as connectBleDevice,
  disconnectBle as disconnectBleDevice,
  subscribeBleNotify,
  stopBleNotify,
} from '@/adapters/bluetooth'
import { parseScaleLine } from '@/adapters/scale'
import { useHardwareStore } from '@/stores/hardware'
import { useSettingsStore } from '@/stores/settings'
import { addScaleReading } from '@/services/repositories/scale'
import type { LiveWeight } from '@/types'
import { trError } from '@/i18n'

export function useScale() {
  const hardware = useHardwareStore()
  const settings = useSettingsStore()

  function ingest(line: string, source: LiveWeight['source']) {
    const parsed = parseScaleLine(line, source)
    if (parsed) hardware.setWeight(parsed)
  }

  async function connectUsb() {
    hardware.lastError = ''
    await requestUsbPort(settings.current.scaleBaudRate)
    hardware.usbConnected = true
    await listenUsbLines((line) => ingest(line, 'usb'))
  }

  async function connectBle() {
    hardware.lastError = ''
    const { bleServiceUuid, bleCharacteristicUuid } = settings.current
    if (!bleServiceUuid || !bleCharacteristicUuid) {
      throw new Error(trError('bleUuid'))
    }
    const device = await requestBleDevice([bleServiceUuid])
    await connectBleDevice(device.deviceId)
    hardware.bleDevice = device
    hardware.bleConnected = true
    await subscribeBleNotify(device.deviceId, bleServiceUuid, bleCharacteristicUuid, (text) => {
      ingest(text, 'ble')
    })
  }

  async function disconnect() {
    if (hardware.usbConnected) await disconnectUsb()
    if (hardware.bleConnected && hardware.bleDevice) {
      const { bleServiceUuid, bleCharacteristicUuid } = settings.current
      if (bleServiceUuid && bleCharacteristicUuid) {
        try {
          await stopBleNotify(hardware.bleDevice.deviceId, bleServiceUuid, bleCharacteristicUuid)
        } catch {
          // ignore
        }
      }
      await disconnectBleDevice(hardware.bleDevice.deviceId)
    }
    hardware.usbConnected = false
    hardware.bleConnected = false
    hardware.bleDevice = null
  }

  async function capture() {
    if (!hardware.liveWeight) throw new Error(trError('noWeight'))
    return addScaleReading(hardware.liveWeight)
  }

  onUnmounted(() => {
    void disconnect()
  })

  return { connectUsb, connectBle, disconnect, capture }
}
