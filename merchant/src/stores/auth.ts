import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Shop } from '@/types'
import { clearToken, getToken, setToken } from '@/utils/request'
import * as authApi from '@/api/auth'
import { getShop } from '@/api/shop'

const REFRESH_KEY = 'hytp_merchant_refresh'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken())
  const shop = ref<Shop | null>(null)

  const isLoggedIn = () => !!token.value

  /** 账号密码登录。 */
  async function login(account: string, password: string): Promise<void> {
    const result = await authApi.login(account, password)
    token.value = result.accessToken
    setToken(result.accessToken)
    localStorage.setItem(REFRESH_KEY, result.refreshToken)
    shop.value = result.shop
  }

  /** 加载当前店铺信息（刷新页面后恢复）。 */
  async function loadShop(): Promise<void> {
    shop.value = await getShop()
  }

  /** 退出登录。 */
  async function logout(): Promise<void> {
    const refresh = localStorage.getItem(REFRESH_KEY)
    if (refresh) {
      try {
        await authApi.logout(refresh)
      } catch {
        // 忽略后端错误，本地照常清理
      }
    }
    token.value = null
    shop.value = null
    clearToken()
    localStorage.removeItem(REFRESH_KEY)
  }

  return { token, shop, isLoggedIn, login, loadShop, logout }
})
