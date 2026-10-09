import { BleClient, type BleDevice, type ScanResult as BleScanResult } from '@capacitor-community/bluetooth-le'

export async function initBluetooth(): Promise<void> {
  await BleClient.initialize()
}

export async function requestBleDevice(optionalServices: string[] = []): Promise<BleDevice> {
  await initBluetooth()
  return BleClient.requestDevice({
    optionalServices: optionalServices.filter(Boolean),
  })
}

export async function startBleScan(
  onDevice: (device: BleDevice & { rssi?: number }) => void,
  services: string[] = [],
): Promise<void> {
  await initBluetooth()
  await BleClient.requestLEScan(
    {
      services: services.filter(Boolean),
      allowDuplicates: false,
    },
    (result: BleScanResult) => {
      onDevice({
        ...result.device,
        rssi: result.rssi,
      })
    },
  )
}

export async function stopBleScan(): Promise<void> {
  try {
    await BleClient.stopLEScan()
  } catch {
    // ignore
  }
}

export async function connectBle(deviceId: string): Promise<void> {
  await BleClient.connect(deviceId)
}

export async function disconnectBle(deviceId: string): Promise<void> {
  await BleClient.disconnect(deviceId)
}

export async function subscribeBleNotify(
  deviceId: string,
  service: string,
  characteristic: string,
  onData: (text: string) => void,
): Promise<void> {
  await BleClient.startNotifications(deviceId, service, characteristic, (value) => {
    const bytes = new Uint8Array(value.buffer)
    onData(new TextDecoder().decode(bytes))
  })
}

export async function stopBleNotify(
  deviceId: string,
  service: string,
  characteristic: string,
): Promise<void> {
  await BleClient.stopNotifications(deviceId, service, characteristic)
}
