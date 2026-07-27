import express from 'express'
import { verifySign } from './sign.ts'
import { analyzeSentiment } from './deepseek.ts'

const app = express()
const PORT = Number(process.env.PORT ?? 8790)

// 健康检查（无需签名）
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'hytp-ai' })
})

/**
 * POST /ai/sentiment —— { texts: string[] } → { results: [{sentiment, keywords}] }
 * express.raw 捕获原始 body 供 HMAC 校验（verifySign 校验后再解析为 JSON）。
 */
app.post(
  '/ai/sentiment',
  express.raw({ type: '*/*', limit: '256kb' }),
  verifySign,
  async (req, res) => {
    const body = req.body as { texts?: unknown }
    const texts = Array.isArray(body.texts) ? body.texts.map((t) => String(t)) : []
    if (texts.length === 0) {
      res.json({ results: [] })
      return
    }
    try {
      const results = await analyzeSentiment(texts)
      res.json({ results })
    } catch (e) {
      // 让 Yii2 侧回退规则版；这里如实返 502 + 原因
      console.error('[sentiment] DeepSeek 调用失败:', e)
      res.status(502).json({ error: String(e instanceof Error ? e.message : e) })
    }
  },
)

app.listen(PORT, () => {
  console.log(`hytp-ai 微服务已启动: http://127.0.0.1:${PORT}`)
})
