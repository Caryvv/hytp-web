import { request } from '@/utils/request'
import type { PageData, ProductDetail, ProductForm, ProductListItem } from '@/types'

/** 本店商品列表。 */
export function listProducts(params: {
  status?: number | ''
  page?: number
  pageSize?: number
}): Promise<PageData<ProductListItem>> {
  return request<PageData<ProductListItem>>({
    url: '/products',
    method: 'get',
    params,
  })
}

/** 商品详情。 */
export function getProduct(id: number): Promise<ProductDetail> {
  return request<ProductDetail>({ url: `/products/${id}`, method: 'get' })
}

/** 新建商品（提交进入审核）。 */
export function createProduct(payload: ProductForm): Promise<ProductDetail> {
  return request<ProductDetail>({ url: '/products', method: 'post', data: payload })
}

/** 编辑商品（重新进入审核）。 */
export function updateProduct(id: number, payload: ProductForm): Promise<ProductDetail> {
  return request<ProductDetail>({ url: `/products/${id}`, method: 'put', data: payload })
}

/** 上/下架切换。 */
export function toggleProduct(id: number): Promise<ProductListItem> {
  return request<ProductListItem>({ url: `/products/${id}/toggle`, method: 'post' })
}

/** 更新库存。 */
export function updateStock(id: number, stock: number): Promise<ProductListItem> {
  return request<ProductListItem>({
    url: `/products/${id}/stock`,
    method: 'put',
    data: { stock },
  })
}
