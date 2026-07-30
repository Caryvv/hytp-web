import { request } from '@/utils/request'
import type { CreditLog, PageData } from '@/types'

/** 某店信用流水（倒序分页）。 */
export function getCreditLogs(
  shopId: number,
  params: { page?: number; pageSize?: number } = {},
): Promise<PageData<CreditLog>> {
  return request<PageData<CreditLog>>({ url: `/shops/${shopId}/credit-logs`, method: 'get', params })
}

/** 处罚商家：deduct 扣分（需 points+reason）/ ban 封禁（需 reason）/ unban 解封。 */
export function penalizeShop(
  shopId: number,
  payload: { action: 'deduct' | 'ban' | 'unban'; points?: number; reason?: string },
): Promise<{ creditScore?: number; status?: number }> {
  return request({ url: `/shops/${shopId}/penalty`, method: 'post', data: payload })
}
