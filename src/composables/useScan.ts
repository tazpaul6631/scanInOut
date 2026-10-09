import { onUnmounted, ref, type Ref } from 'vue'
import { scanOnce, startLiveScan, stopLiveScan } from '@/adapters/barcode'
import { startNfcScan, stopNfcScan } from '@/adapters/nfc'
import { addScanLog } from '@/services/repositories/scans'
import type { ScanDirection, ScanResult } from '@/types'

export function useScan(direction?: Ref<ScanDirection>) {
  const last = ref<ScanResult | null>(null)
  const scanning = ref(false)
  const nfcOn = ref(false)
  const error = ref('')

  function resolveDirection(result: ScanResult): ScanDirection {
    return result.direction ?? direction?.value ?? 'in'
  }

  async function remember(result: ScanResult) {
    const dir = resolveDirection(result)
    last.value = { ...result, direction: dir }
    await addScanLog({
      kind: result.kind,
      value: result.value,
      format: result.format,
      direction: dir,
    })
  }

  async function nativeScan() {
    error.value = ''
    scanning.value = true
    try {
      await remember(await scanOnce())
    } catch (err) {
      // error.value = err instanceof Error ? err.message : String(err)
    } finally {
      scanning.value = false
    }
  }

  async function liveScan(elementId: string, onEach?: (result: ScanResult) => void) {
    error.value = ''
    scanning.value = true
    try {
      await startLiveScan(elementId, async (result) => {
        await remember(result)
        onEach?.(result)
      })
    } catch (err) {
      scanning.value = false
      error.value = err instanceof Error ? err.message : String(err)
    }
  }

  async function stopLive() {
    await stopLiveScan()
    scanning.value = false
  }

  async function startNfc() {
    error.value = ''
    await startNfcScan(async (result) => {
      await remember(result)
    })
    nfcOn.value = true
  }

  async function stopNfc() {
    await stopNfcScan()
    nfcOn.value = false
  }

  onUnmounted(() => {
    void stopLive()
    void stopNfc()
  })

  return {
    last,
    scanning,
    nfcOn,
    error,
    nativeScan,
    liveScan,
    stopLive,
    startNfc,
    stopNfc,
    remember,
  }
}
