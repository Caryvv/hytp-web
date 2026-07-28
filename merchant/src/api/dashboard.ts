import { request } from '@/utils/request'

/** 本店评价情感分布 + 高频品控关键词（对齐 ReviewStatService::shopReviewStats）。 */
export interface ReviewStats {
  total: number
  sentiment: { positive: number; neutral: number; negative: number }
  keywords: Array<{ word: string; count: number }>
}

/** 评价洞察：情感分布 + 高频关键词。 */
export function getReviewStats(): Promise<ReviewStats> {
  return request<ReviewStats>({ url: '/dashboard/review-keywords', method: 'get' })
}
