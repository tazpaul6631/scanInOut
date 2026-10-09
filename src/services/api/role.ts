import { http } from '@/services/http'
import type { ApiResponse, ViewRole } from '@/types/api'

export async function queryRoleResult(isActive: boolean) {
  const { data } = await http.post<ApiResponse<ViewRole[]>>('/role/rc/getbaselist', { isActive })
  return data
}
