import dayjs from 'dayjs'

export function formatDateTime(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const parsed = typeof value === 'number' ? value : Date.parse(value)
  if (!parsed) return '—'
  return dayjs(parsed).format('DD/MM/YYYY HH:mm:ss')
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function stripMarks(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export function personInitials(name: string): string {
  const words = stripMarks(name).trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  const first = words[0][0] ?? ''
  if (words.length === 1) return first.toUpperCase()
  const last = words[words.length - 1][0] ?? ''
  return `${first}${last}`.toUpperCase()
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
