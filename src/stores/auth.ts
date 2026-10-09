import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session } from '@/types'
import type { ApiResponse, ViewValidateUser } from '@/types/api'
import { userLogout, userValidate } from '@/services/api/user'
import {
  clearSession,
  loadSession,
  saveSession,
} from '@/services/repositories/session'

function sessionFromUser(user: ViewValidateUser): Session | null {
  const email = user.email?.trim()
  if (!email) return null
  return {
    email,
    loggedInAt: Date.now(),
    userId: user.id,
    code: user.code ?? undefined,
    name: user.name ?? undefined,
    roleId: user.roleId,
    roleName: user.roleName ?? undefined,
    accessToken: user.accessToken ?? undefined,
    refreshToken: user.refreshToken ?? undefined,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const loaded = ref(false)
  const unauthorized = ref(false)
  const countdown = ref(3)
  const isLoggedIn = computed(() => Boolean(session.value?.email))

  async function load() {
    session.value = await loadSession()
    loaded.value = true
  }

  async function login(email: string, password: string): Promise<ApiResponse<ViewValidateUser>> {
    const res = await userValidate({
      email: email.trim(),
      password,
      loginAt: new Date().toISOString(),
    })
    if (!res.success || !res.data) return res
    const next = sessionFromUser(res.data)
    if (!next) return { ...res, success: false }
    await saveSession(next)
    session.value = next
    unauthorized.value = false
    countdown.value = 3
    return res
  }

  function beginUnauthorized() {
    if (unauthorized.value || !session.value) return
    unauthorized.value = true
    countdown.value = 3
  }

  async function expireSession() {
    await clearSession()
    session.value = null
    unauthorized.value = false
    countdown.value = 3
  }

  async function logout() {
    const userId = session.value?.userId
    try {
      if (userId) await userLogout(userId)
    } catch {
      // still clear the local session
    }
    await expireSession()
  }

  return {
    session,
    loaded,
    unauthorized,
    countdown,
    isLoggedIn,
    load,
    login,
    logout,
    beginUnauthorized,
    expireSession,
  }
})
