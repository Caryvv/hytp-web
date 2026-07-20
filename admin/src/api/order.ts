import { request } from '@/utils/request'
import type { Order, PageData, Refund } from '@/types'

/** 全平台订单监控（可按 shopId/status/keyword 筛选）。 */
export function listOrders(params: {
  shopId?: number | ''
  status?: number | ''
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<PageData<Order>> {
  return request<PageData<Order>>({ url: '/orders', method: 'get', params })
}

/** 订单详情。 */
export function getOrder(orderNo: string): Promise<Order> {
  return request<Order>({ url: `/orders/${orderNo}`, method: 'get' })
}

/** 售后仲裁队列。 */
export function listRefunds(params: {
  status?: number | ''
  page?: number
  pageSize?: number
}): Promise<PageData<Refund>> {
  return request<PageData<Refund>>({ url: '/refunds', method: 'get', params })
}

/** 售后仲裁：agree=true 同意退款，false 驳回（需 remark）。 */
export function arbitrateRefund(id: number, agree: boolean, remark = ''): Promise<Refund> {
  return request<Refund>({
    url: `/refunds/${id}/arbitrate`,
    method: 'post',
    data: { agree, remark },
  })
}
