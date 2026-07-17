import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'

/** 业务错误码（对齐后端 ErrorCode 常用项）。 */
export const BizCode = {
  SUCCESS: 0,
  PARAM_INVALID: 1001,
  UNAUTHORIZED: 1002,
  FORBIDDEN: 1003,
} as const

const TOKEN_KEY = 'hytp_merchant_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

const instance: AxiosInstance = axios.create({
  baseURL: '/merchant',
  timeout: 15000,
})

// 请求拦截：带上 Bearer token
instance.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：解包 {code,message,data}
instance.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>
    if (body.code === BizCode.SUCCESS) {
      return body.data as never
    }
    // 未登录/失效：清 token 跳登录
    if (body.code === BizCode.UNAUTHORIZED) {
      clearToken()
      if (location.hash !== '#/login') {
        location.hash = '#/login'
      }
    }
    ElMessage.error(body.message || `请求失败(${body.code})`)
    return Promise.reject(new BizError(body.code, body.message))
  },
  (error) => {
    ElMessage.error('网络异常，请稍后重试')
    return Promise.reject(error)
  },
)

/** 业务错误（code!=0）。 */
export class BizError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.name = 'BizError'
  }
}

/** 泛型请求：返回已解包的 data。 */
export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return instance.request<unknown, T>(config)
}

export default instance
