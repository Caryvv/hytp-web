import { request } from '@/utils/request'
import type { AdminLoginResult } from '@/types'

/** 管理员登录。 */
export function login(username: string, password: string): Promise<AdminLoginResult> {
  return request<AdminLoginResult>({
    url: '/auth/login',
    method: 'post',
    data: { username, password },
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
