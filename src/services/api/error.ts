import axios from 'axios'
import { trError } from '@/i18n'

function pickMessage(body: Record<string, unknown>): string {
  for (const key of ['message', 'detail', 'title']) {
    const value = body[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

export function readApiFailure(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data
    if (body && typeof body === 'object') {
      return pickMessage(body as Record<string, unknown>) || error.message
    }
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      return trError('network')
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return String(error)
}
