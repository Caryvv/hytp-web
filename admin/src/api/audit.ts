import { request } from '@/utils/request'
import type { FeedListItem, PageData, ProductListItem, Shop } from '@/types'

/** 商家列表（可按状态/类型/关键词筛选）。 */
export function listShops(params: {
  status?: number | ''
  type?: number | ''
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<PageData<Shop>> {
  return request<PageData<Shop>>({ url: '/shops', method: 'get', params })
}

/** 审核商家：pass=true 通过，false 驳回（需 remark）。 */
export function auditShop(id: number, pass: boolean, remark = ''): Promise<Shop> {
  return request<Shop>({
    url: `/shops/${id}/audit`,
    method: 'post',
    data: { pass, remark },
  })
}

/** 商品审核队列（默认 status=2 审核中）。 */
export function listProducts(params: {
  status?: number | ''
  shopId?: number | ''
  page?: number
  pageSize?: number
}): Promise<PageData<ProductListItem>> {
  return request<PageData<ProductListItem>>({ url: '/products', method: 'get', params })
}

/** 审核商品：pass=true 通过（在售），false 驳回（违规下架，需 remark）。 */
export function auditProduct(id: number, pass: boolean, remark = ''): Promise<ProductListItem> {
  return request<ProductListItem>({
    url: `/products/${id}/audit`,
    method: 'post',
    data: { pass, remark },
  })
}

/** 动态巡查列表（默认 status=1 正常）。 */
export function listFeeds(params: {
  status?: number | ''
  userId?: number | ''
  page?: number
  pageSize?: number
}): Promise<PageData<FeedListItem>> {
  return request<PageData<FeedListItem>>({ url: '/feeds', method: 'get', params })
}

/** 巡查处置：off=true 下架（需 remark），false 恢复。 */
export function setFeedStatus(id: number, off: boolean, remark = ''): Promise<FeedListItem> {
  return request<FeedListItem>({
    url: `/feeds/${id}/audit`,
    method: 'post',
    data: { off, remark },
  })
}
