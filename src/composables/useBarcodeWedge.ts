import { onMounted, onUnmounted } from 'vue'

const WEDGE_INPUT_IDS = new Set(['manual-input', 'wedge-input'])

/**
 * Captures PDA laser keyboard-wedge scans (HID keystrokes ending with Enter).
 * Ignores typing in other inputs/textareas so forms stay usable.
 */
export function useBarcodeWedge(onScan: (value: string) => void | Promise<void>) {
  let buffer = ''
  let lastAt = 0

  function resetBuffer() {
    buffer = ''
    lastAt = 0
  }

  function onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    const tag = target?.tagName?.toUpperCase()
    const isEditable =
      tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(target?.isContentEditable)
    const isWedgeField = Boolean(target?.id && WEDGE_INPUT_IDS.has(target.id))

    if (isEditable && !isWedgeField) return

    if (event.key === 'Enter') {
      const fromField =
        isWedgeField && target instanceof HTMLInputElement ? target.value : buffer
      const value = fromField.trim()
      resetBuffer()
      if (!value) return
      event.preventDefault()
      void onScan(value)
      if (isWedgeField && target instanceof HTMLInputElement) {
        target.value = ''
        target.dispatchEvent(new Event('input', { bubbles: true }))
      }
      return
    }

    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return

    // Characters typed into the focused wedge/manual field are handled by v-model.
    if (isWedgeField) return

    const now = Date.now()
    if (lastAt && now - lastAt > 80) buffer = ''
    lastAt = now
    buffer += event.key
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown, true)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown, true)
    resetBuffer()
  })
}
