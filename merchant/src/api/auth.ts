import { request } from '@/utils/request'
import type { MerchantLoginResult, Shop } from '@/types'

/** 商家登录。 */
export function login(account: string, password: string): Promise<MerchantLoginResult> {
  return request<MerchantLoginResult>({
    url: '/auth/login',
    method: 'post',
    data: { account, password },
  })
}

/** 入驻注册。 */
export interface RegisterPayload {
  account: string
  password: string
  name: string
  type: number
  region: string
  contactName: string
  contactPhone: string
}

export function register(payload: RegisterPayload): Promise<Shop> {
  return request<Shop>({
    url: '/register',
    method: 'post',
    data: payload,
  })
}

/** 退出登录。 */
export function logout(refreshToken: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>({
    url: '/auth/logout',
    method: 'post',
    data: { refreshToken },
  })
}
