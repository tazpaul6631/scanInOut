import { http } from '@/services/http'
import type { ApiResponse } from '@/types/api'

const SYNC_FROM_API = 'http://10.0.111.127:7094/asset/aic/syncfromapi'

export async function syncFromApi() {
  const { data } = await http.post<ApiResponse<number>>(SYNC_FROM_API, {})
  return data
}