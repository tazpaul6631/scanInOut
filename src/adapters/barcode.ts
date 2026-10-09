import { Capacitor } from '@capacitor/core'
import { Html5Qrcode } from 'html5-qrcode'
import { isNative } from '@/adapters/platform'
import type { ScanResult } from '@/types'
import { trError } from '@/i18n'

let html5: Html5Qrcode | null = null

type MlKit = typeof import('@capacitor-mlkit/barcode-scanning')

function loadMlKit(): Promise<MlKit> {
  return import('@capacitor-mlkit/barcode-scanning')
}

async function ensureGoogleScannerModule({
  BarcodeScanner,
  GoogleBarcodeScannerModuleInstallState,
}: MlKit) {
  if (Capacitor.getPlatform() !== 'android') return
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()
  if (available) return

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      void BarcodeScanner.removeAllListeners()
      reject(new Error(trError('scanEmpty')))
    }, 60_000)

    void BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', (event) => {
      if (event.state === GoogleBarcodeScannerModuleInstallState.COMPLETED) {
        clearTimeout(timer)
        void BarcodeScanner.removeAllListeners().then(() => resolve())
      }
      if (
        event.state === GoogleBarcodeScannerModuleInstallState.FAILED
        || event.state === GoogleBarcodeScannerModuleInstallState.CANCELED
      ) {
        clearTimeout(timer)
        void BarcodeScanner.removeAllListeners().then(() => reject(new Error(trError('scanEmpty'))))
      }
    })
      .then(() => BarcodeScanner.installGoogleBarcodeScannerModule())
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export async function scanBarcodeNative(): Promise<ScanResult> {
  const ml = await loadMlKit()
  const { BarcodeScanner, BarcodeFormat } = ml

  if (Capacitor.getPlatform() !== 'android') {
    const { camera } = await BarcodeScanner.requestPermissions()
    if (camera !== 'granted' && camera !== 'limited') {
      throw new Error(trError('cameraPermission'))
    }
  } else {
    await ensureGoogleScannerModule(ml)
  }

  const { barcodes } = await BarcodeScanner.scan({
    formats: [
      BarcodeFormat.QrCode,
      BarcodeFormat.Code128,
      BarcodeFormat.Code39,
      BarcodeFormat.Code93,
      BarcodeFormat.Ean13,
      BarcodeFormat.Ean8,
      BarcodeFormat.UpcA,
      BarcodeFormat.UpcE,
      BarcodeFormat.DataMatrix,
      BarcodeFormat.Aztec,
    ],
    autoZoom: true,
  })
  const first = barcodes[0]
  const value = first?.rawValue?.trim()
  if (!value) throw new Error(trError('scanEmpty'))
  const format = String(first.format ?? '')
  const kind = format.toLowerCase().includes('qr') ? 'qr' : 'barcode'
  return { value, format, kind }
}

export async function scanOnce(): Promise<ScanResult> {
  if (isNative()) return scanBarcodeNative()
  throw new Error(trError('useLiveScan'))
}

export async function startLiveScan(
  elementId: string,
  onResult: (result: ScanResult) => void,
): Promise<void> {
  await stopLiveScan()
  html5 = new Html5Qrcode(elementId)
  await html5.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 260, height: 260 } },
    (decoded) => {
      onResult({
        value: decoded,
        format: 'LIVE',
        kind: decoded.length > 20 ? 'qr' : 'barcode',
      })
    },
    () => undefined,
  )
}

export async function stopLiveScan(): Promise<void> {
  if (!html5) return
  try {
    if (html5.isScanning) await html5.stop()
    html5.clear()
  } catch {
    // ignore
  }
  html5 = null
}

export function canNativeScan(): boolean {
  return isNative()
}
