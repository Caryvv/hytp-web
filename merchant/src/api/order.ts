import { request } from '@/utils/request'
import type { Order, PageData, Refund } from '@/types'

/** 本店订单列表。 */
export function listOrders(params: {
  status?: number | ''
  page?: number
  pageSize?: number
}): Promise<PageData<Order>> {
  return request<PageData<Order>>({ url: '/orders', method: 'get', params })
}

/** 订单详情。 */
export function getOrder(orderNo: string): Promise<Order> {
  return request<Order>({ url: `/orders/${orderNo}`, method: 'get' })
}

/** 发货（填物流公司 + 单号）。 */
export function shipOrder(
  orderNo: string,
  payload: { expressCompany: string; expressNo: string },
): Promise<Order> {
  return request<Order>({ url: `/orders/${orderNo}/ship`, method: 'post', data: payload })
}

/** 租赁：确认归还（待归还→已完成，退押金）。 */
export function confirmReturn(orderNo: string): Promise<Order> {
  return request<Order>({ url: `/orders/${orderNo}/confirm-return`, method: 'post' })
}

/** 本店售后列表。 */
export function listRefunds(params: {
  status?: number | ''
  page?: number
  pageSize?: number
}): Promise<PageData<Refund>> {
  return request<PageData<Refund>>({ url: '/refunds', method: 'get', params })
}

/** 处理售后（同意/拒绝）。 */
export function handleRefund(
  id: number,
  payload: { agree: boolean; remark: string },
): Promise<Refund> {
  return request<Refund>({ url: `/refunds/${id}/handle`, method: 'post', data: payload })
}
