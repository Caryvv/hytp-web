import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'

const SECRET = process.env.INTERNAL_SIGN_SECRET ?? ''
const TTL = Number(process.env.SIGN_TTL_SECONDS ?? 300)

/**
 * 内部调用签名校验（doc 13 §7）。
 * 调用方发 X-Timestamp + X-Internal-Sign = HMAC-SHA256(timestamp + "\n" + rawBody, secret)。
 * 时间戳超 TTL 拒绝，防重放。原始 body 由 express.raw 捕获（见 server.ts）。
 */
export function verifySign(req: Request, res: Response, next: NextFunction): void {
  if (SECRET === '') {
    res.status(500).json({ error: 'INTERNAL_SIGN_SECRET 未配置' })
    return
  }
  const ts = String(req.header('X-Timestamp') ?? '')
  const sign = String(req.header('X-Internal-Sign') ?? '')
  if (ts === '' || sign === '') {
    res.status(401).json({ error: '缺少签名头' })
    return
  }
  if (Math.abs(Date.now() / 1000 - Number(ts)) > TTL) {
    res.status(401).json({ error: '签名过期' })
    return
  }

  const raw = (req.body as Buffer).toString('utf8')
  const expected = createHmac('sha256', SECRET).update(`${ts}\n${raw}`).digest('hex')

  const a = Buffer.from(sign)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: '签名无效' })
    return
  }

  // 校验通过：把原始 body 解析为 JSON 供后续处理
  try {
    req.body = raw === '' ? {} : JSON.parse(raw)
  } catch {
    res.status(400).json({ error: 'body 非合法 JSON' })
    return
  }
  next()
}
