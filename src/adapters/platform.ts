import { Capacitor } from '@capacitor/core'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function applyNativeChrome(): Promise<void> {
  if (!isNative()) return
  document.documentElement.classList.add('is-native')
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setOverlaysWebView({ overlay: true })
    await StatusBar.setBackgroundColor({ color: '#00000000' })
    await StatusBar.setStyle({ style: Style.Dark })
  } catch {
    // WebView / emulator may not support overlay.
  }
}

export function platformName(): string {
  return Capacitor.getPlatform()
}

export function hasWebSerial(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.serial)
}

export function hasWebNfc(): boolean {
  return typeof window !== 'undefined' && Boolean(window.NDEFReader)
}

export function hasGetUserMedia(): boolean {
  return Boolean(navigator.mediaDevices?.getUserMedia)
}

export type DeviceShell = 'web' | 'tablet' | 'mobile'

export function detectDeviceShell(): DeviceShell {
  const width = typeof window === 'undefined' ? 1280 : window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'web'
}

export function homePathForShell(shell = detectDeviceShell()): string {
  // PDA / mobile: land on mobile scan shell.
  if (isNative() || shell === 'mobile') return '/app/mobile/scan'
  return '/'
}
