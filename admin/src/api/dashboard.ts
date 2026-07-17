import { request } from '@/utils/request'
import type { DashboardData } from '@/types'

/** 概览指标。 */
export function getDashboard(): Promise<DashboardData> {
  return request<DashboardData>({ url: '/dashboard', method: 'get' })
}
