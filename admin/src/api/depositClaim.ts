import { request } from '@/utils/request'
import type { DepositClaim, PageData } from '@/types'

/** 品质保障金理赔队列。 */
export function listDepositClaims(params: {
  status?: number | ''
  page?: number
  pageSize?: number
}): Promise<PageData<DepositClaim>> {
  return request<PageData<DepositClaim>>({ url: '/deposit-claims', method: 'get', params })
}

/** 判定：approve=true 成立赔付（扣商家保障金+信用分），false 驳回（需 remark）。 */
export function arbitrateDepositClaim(id: number, approve: boolean, remark = ''): Promise<DepositClaim> {
  return request<DepositClaim>({
    url: `/deposit-claims/${id}/arbitrate`,
    method: 'post',
    data: { approve, remark },
  })
}
