import { hasWebSerial } from '@/adapters/platform'
import { trError } from '@/i18n'

let activePort: SerialPort | null = null
let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
let closed: Promise<void> | null = null

export function canUseUsbSerial(): boolean {
  return hasWebSerial()
}

export async function requestUsbPort(baudRate = 9600): Promise<SerialPort> {
  if (!navigator.serial) {
    throw new Error(trError('noSerial'))
  }
  await disconnectUsb()
  const port = await navigator.serial.requestPort()
  await port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none' })
  activePort = port
  return port
}

export async function listenUsbLines(
  onLine: (line: string) => void,
): Promise<void> {
  if (!activePort?.readable) throw new Error(trError('usbNotConnected'))
  const decoder = new TextDecoder()
  let buffer = ''
  reader = activePort.readable.getReader()

  closed = (async () => {
    try {
      while (true) {
        const { value, done } = await reader!.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split(/\r?\n/)
        buffer = parts.pop() ?? ''
        for (const line of parts) {
          const trimmed = line.trim()
          if (trimmed) onLine(trimmed)
        }
      }
    } catch {
      // disconnected
    }
  })()
}

export async function disconnectUsb(): Promise<void> {
  try {
    await reader?.cancel()
  } catch {
    // ignore
  }
  reader?.releaseLock()
  reader = null
  if (closed) {
    await closed.catch(() => undefined)
    closed = null
  }
  if (activePort) {
    try {
      await activePort.close()
    } catch {
      // ignore
    }
  }
  activePort = null
}

export function isUsbConnected(): boolean {
  return Boolean(activePort)
}
