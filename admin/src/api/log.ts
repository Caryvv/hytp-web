import { request } from '@/utils/request'
import type { OperationLog, PageData } from '@/types'

/** 操作日志列表。 */
export function listLogs(params: {
  adminId?: number | ''
  module?: string
  page?: number
  pageSize?: number
}): Promise<PageData<OperationLog>> {
  return request<PageData<OperationLog>>({ url: '/logs', method: 'get', params })
}
