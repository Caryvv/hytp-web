import { request } from '@/utils/request'
import type { SysConfigItem } from '@/types'

/** 全部平台配置项（含已知 key 的含义映射）。 */
export function listConfigs(): Promise<{ list: SysConfigItem[] }> {
  return request<{ list: SysConfigItem[] }>({ url: '/configs', method: 'get' })
}

/** 新增或更新一个配置项。 */
export function saveConfig(key: string, value: string): Promise<SysConfigItem> {
  return request<SysConfigItem>({
    url: `/configs/${encodeURIComponent(key)}`,
    method: 'put',
    data: { value },
  })
}

/** 删除一个配置项（已知 key 删除后回落代码默认值）。 */
export function deleteConfig(key: string): Promise<{ key: string }> {
  return request<{ key: string }>({
    url: `/configs/${encodeURIComponent(key)}`,
    method: 'delete',
  })
}
