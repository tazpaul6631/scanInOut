import axios from 'axios'
import { useSettingsStore } from '@/stores/settings'
import { useNetworkStore } from '@/stores/network'
import { useAuthStore } from '@/stores/auth'
import { resolveApiUrl } from '@/services/repositories/settings'
import { trError } from '@/i18n'

export const http = axios.create({
  timeout: 1500000,
})

http.interceptors.request.use((config) => {
  const settings = useSettingsStore()
  const network = useNetworkStore()
  const auth = useAuthStore()
  config.baseURL = resolveApiUrl(settings.current.apiUrl)
  if (!network.online) {
    return Promise.reject(new Error(trError('offlineHttp')))
  }
  const token = auth.session?.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    const url = axios.isAxiosError(error) ? String(error.config?.url ?? '') : ''
    const isAuthCall = url.includes('/user/uc/validate') || url.includes('/user/uc/logout')
    if (status === 401 && !isAuthCall) {
      useAuthStore().beginUnauthorized()
    }
    return Promise.reject(error)
  },
)
