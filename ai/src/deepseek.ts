const API_KEY = process.env.DEEPSEEK_API_KEY ?? ''
const BASE_URL = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com'
const MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'

/** 情感：0 负面 / 1 中性 / 2 正面（对齐 ProductReview::SENTIMENT_*）。 */
export interface SentimentResult {
  sentiment: 0 | 1 | 2
  keywords: string[]
}

const SYSTEM_PROMPT = `你是汉服电商评价分析助手。对每条商品评价做情感分析并抽取品控关键词。
- sentiment：0=负面 1=中性 2=正面
- keywords：从评价中抽取的品控相关词（如 线头、色差、炸褶、做工、版型、面料、发货、客服、性价比、还原），最多5个，无则空数组
只输出 JSON，格式：{"results":[{"sentiment":0,"keywords":["色差"]}, ...]}，results 顺序与输入 texts 一一对应。`

/**
 * 批量情感分析。调 DeepSeek（OpenAI 兼容 chat completions，强制 JSON 输出）。
 * 失败抛错，由调用方决定降级（本服务不静默兜底，让 Yii2 侧回退规则版）。
 */
export async function analyzeSentiment(texts: string[]): Promise<SentimentResult[]> {
  if (API_KEY === '') {
    throw new Error('DEEPSEEK_API_KEY 未配置')
  }
  if (texts.length === 0) {
    return []
  }

  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ texts }) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    }),
  })

  if (!resp.ok) {
    throw new Error(`DeepSeek HTTP ${resp.status}: ${await resp.text()}`)
  }

  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content ?? ''
  const parsed = JSON.parse(content) as { results?: unknown }
  const results = Array.isArray(parsed.results) ? parsed.results : []

  // 规整：越界情感落到中性，keywords 强制字符串数组，对齐输入长度
  return texts.map((_, i) => {
    const r = (results[i] ?? {}) as { sentiment?: unknown; keywords?: unknown }
    const s = Number(r.sentiment)
    return {
      sentiment: (s === 0 || s === 1 || s === 2 ? s : 1) as 0 | 1 | 2,
      keywords: Array.isArray(r.keywords)
        ? r.keywords.map((k) => String(k)).filter((k) => k !== '').slice(0, 5)
        : [],
    }
  })
}
