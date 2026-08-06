import OSS from 'ali-oss'
import { request } from '@/utils/request'

/** OSS 直传临时凭证（对齐后端 AliyunStsService::assumeRole）。 */
interface StsToken {
  enabled: boolean
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  region: string
  bucket: string
  endpoint: string
  dir: string // content/{adminId}/{YYYYMM}/，STS 权限限于此前缀
}

/** 取 STS 凭证。 */
function getStsToken(): Promise<StsToken> {
  return request<StsToken>({ url: '/upload/sts', method: 'get' })
}

/**
 * 浏览器直传图片到 OSS（字节不经服务器），返回可访问 URL。
 * 未配置 STS 时抛错，由调用方提示。
 */
export async function uploadImageToOss(file: File): Promise<string> {
  const sts = await getStsToken()
  if (!sts.enabled) {
    throw new Error('OSS 未配置，无法上传')
  }

  const client = new OSS({
    region: sts.region,
    accessKeyId: sts.accessKeyId,
    accessKeySecret: sts.accessKeySecret,
    stsToken: sts.securityToken,
    bucket: sts.bucket,
    secure: true,
  })

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const objectKey = `${sts.dir}${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`
  await client.put(objectKey, file)

  // 公开访问 URL：https://{bucket}.{host}/{key}
  const host = sts.endpoint.replace(/^https?:\/\//, '')
  return `https://${sts.bucket}.${host}/${objectKey}`
}
