import { request } from '@/utils/request'
import type { Qualification, Shop } from '@/types'

/** 本店信息。 */
export function getShop(): Promise<Shop> {
  return request<Shop>({ url: '/shop', method: 'get' })
}

/** 更新店铺信息。 */
export interface ShopUpdatePayload {
  name?: string
  logo?: string
  region?: string
  contactName?: string
  contactPhone?: string
  type?: number
}

export function updateShop(payload: ShopUpdatePayload): Promise<Shop> {
  return request<Shop>({ url: '/shop', method: 'put', data: payload })
}

/** 资质列表。 */
export function getQualifications(): Promise<Qualification[]> {
  return request<Qualification[]>({ url: '/qualifications', method: 'get' })
}

/** 提交资质。 */
export function addQualification(qualType: string, fileUrl: string): Promise<Qualification> {
  return request<Qualification>({
    url: '/qualifications',
    method: 'post',
    data: { qualType, fileUrl },
  })
}
