import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AdminUser } from '@/types'
import { clearToken, getToken, setToken } from '@/utils/request'
import * as authApi from '@/api/auth'

const REFRESH_KEY = 'hytp_admin_refresh'
const PERM_KEY = 'hytp_admin_perms'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken())
  const admin = ref<AdminUser | null>(null)
  const permissions = ref<string[]>(JSON.parse(localStorage.getItem(PERM_KEY) || '[]'))

  const isLoggedIn = () => !!token.value
  const hasPermission = (key: string) => permissions.value.includes(key)

  async function login(username: string, password: string): Promise<void> {
    const result = await authApi.login(username, password)
    token.value = result.accessToken
    setToken(result.accessToken)
    localStorage.setItem(REFRESH_KEY, result.refreshToken)
    localStorage.setItem(PERM_KEY, JSON.stringify(result.permissions))
    admin.value = result.admin
    permissions.value = result.permissions
  }

  async function logout(): Promise<void> {
    const refresh = localStorage.getItem(REFRESH_KEY)
    if (refresh) {
      try {
        await authApi.logout(refresh)
      } catch {
        // 忽略
      }
    }
    token.value = null
    admin.value = null
    permissions.value = []
    clearToken()
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(PERM_KEY)
  }

  return { token, admin, permissions, isLoggedIn, hasPermission, login, logout }
})
