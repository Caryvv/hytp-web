import OSS from 'ali-oss'
import { request } from '@/utils/request'

/** OSS 直传临时凭证（对齐后端 AliyunStsService::assumeRole，shop 命名空间）。 */
export interface StsToken {
  enabled: boolean
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  expiration: string
  region: string
  bucket: string
  endpoint: string
  dir: string
}

/** 取本店 OSS 直传临时凭证。 */
export function getStsToken(): Promise<StsToken> {
  return request<StsToken>({ url: '/upload/sts', method: 'get' })
}

/**
 * 上传图片到 OSS（客户端直传，字节不经服务器），返回可访问 URL。
 * STS 未配置（enabled=false）时抛错，调用方提示改用手填 URL 或联系管理员。
 */
export async function uploadImage(file: File): Promise<string> {
  const sts = await getStsToken()
  if (!sts.enabled) {
    throw new Error('图片直传未启用，请联系管理员配置 OSS')
  }

  const client = new OSS({
    region: sts.region,
    accessKeyId: sts.accessKeyId,
    accessKeySecret: sts.accessKeySecret,
    stsToken: sts.securityToken,
    bucket: sts.bucket,
    secure: true,
  })

  // objectKey 用后端下发的 dir 前缀（与 STS 权限一致，越权写不进去）+ 随机名保留扩展名
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '.jpg'
  const objectKey = sts.dir + crypto.randomUUID() + ext

  await client.put(objectKey, file)

  // 公开访问 URL：https://{bucket}.{endpoint}/{key}
  const host = sts.endpoint.replace(/^https?:\/\//, '')
  return `https://${sts.bucket}.${host}/${objectKey}`
}
