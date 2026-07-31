import { request } from '@/utils/request'
import type { AppVersion } from '@/types'

/** 版本列表。 */
export function listAppVersions(platform = 'android'): Promise<{ list: AppVersion[] }> {
  return request<{ list: AppVersion[] }>({ url: '/app-versions', method: 'get', params: { platform } })
}

/** 分片大小 1MB —— 远低于 nginx/PHP 上传限制，无需改服务器配置。 */
const CHUNK_SIZE = 1024 * 1024

/**
 * 分片上传 APK：切块逐个 POST，最后 merge。返回可访问的下载 URL + 文件名。
 * onProgress 回传 0~100。
 */
export async function uploadApk(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ fileName: string; url: string; size: number }> {
  const uploadId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  const total = Math.ceil(file.size / CHUNK_SIZE)

  for (let i = 0; i < total; i++) {
    const start = i * CHUNK_SIZE
    const blob = file.slice(start, start + CHUNK_SIZE)
    const form = new FormData()
    form.append('uploadId', uploadId)
    form.append('index', String(i))
    form.append('chunk', blob, `${i}.part`)
    await request({ url: '/app-versions/chunk', method: 'post', data: form })
    onProgress?.(Math.round(((i + 1) / total) * 100))
  }

  return request<{ fileName: string; url: string; size: number }>({
    url: '/app-versions/merge',
    method: 'post',
    data: { uploadId, total, fileName: file.name },
  })
}

/** 新增版本记录。 */
export function createAppVersion(payload: Partial<AppVersion>): Promise<AppVersion> {
  return request<AppVersion>({ url: '/app-versions', method: 'post', data: payload })
}

/** 更新版本记录。 */
export function updateAppVersion(id: number, payload: Partial<AppVersion>): Promise<AppVersion> {
  return request<AppVersion>({ url: `/app-versions/${id}`, method: 'put', data: payload })
}

/** 上/下线。 */
export function toggleAppVersion(id: number, enabled: boolean): Promise<AppVersion> {
  return request<AppVersion>({ url: `/app-versions/${id}/toggle`, method: 'post', data: { enabled } })
}

/** 删除。 */
export function deleteAppVersion(id: number): Promise<{ id: number }> {
  return request<{ id: number }>({ url: `/app-versions/${id}`, method: 'delete' })
}
