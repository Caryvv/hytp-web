import { request } from '@/utils/request'
import type { Content, PageData } from '@/types'

/** 内容列表（分页，可按 type/status 筛选）。 */
export function listContents(params: {
  type?: number | ''
  status?: number | ''
  page?: number
  pageSize?: number
}): Promise<PageData<Content>> {
  return request<PageData<Content>>({ url: '/contents', method: 'get', params })
}

/** 新建内容。 */
export function createContent(payload: Partial<Content>): Promise<Content> {
  return request<Content>({ url: '/contents', method: 'post', data: payload })
}

/** 编辑内容。 */
export function updateContent(id: number, payload: Partial<Content>): Promise<Content> {
  return request<Content>({ url: `/contents/${id}`, method: 'put', data: payload })
}

/** 上/下线切换。 */
export function toggleContent(id: number): Promise<Content> {
  return request<Content>({ url: `/contents/${id}/toggle`, method: 'post' })
}

/** 删除。 */
export function deleteContent(id: number): Promise<{ id: number }> {
  return request<{ id: number }>({ url: `/contents/${id}`, method: 'delete' })
}
