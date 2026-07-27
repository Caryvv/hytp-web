const API_KEY = process.env.DEEPSEEK_API_KEY ?? ''
const BASE_URL = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com'
const MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'

/** 情感：0 负面 / 1 中性 / 2 正面（对齐 ProductReview::SENTIMENT_*）。 */
export interface SentimentResult {
  sentiment: 0 | 1 | 2
  keywords: string[]
}

/** 智能问答结果。hitKnowledge=false 时前端引导转「萌新求助」社区。 */
export interface QaResult {
  answer: string
  hitKnowledge: boolean
}

/** 对话历史一轮。 */
export interface QaTurn {
  role: 'user' | 'assistant'
  content: string
}

const SENTIMENT_PROMPT = `你是汉服电商评价分析助手。对每条商品评价做情感分析并抽取品控关键词。
- sentiment：0=负面 1=中性 2=正面
- keywords：从评价中抽取的品控相关词（如 线头、色差、炸褶、做工、版型、面料、发货、客服、性价比、还原），最多5个，无则空数组
只输出 JSON，格式：{"results":[{"sentiment":0,"keywords":["色差"]}, ...]}，results 顺序与输入 texts 一一对应。`

const QA_PROMPT = `你是「汉韵同袍」App 的汉服知识助手，精通汉服形制（秦汉/魏晋/唐/宋/明）、山正与正版山寨区分、身材选款、穿搭配饰、甲胄合规、汉服文化礼仪等。
回答要点：
- 用友好、简洁的中文，像同袍前辈答新人，避免长篇大论。
- 只回答汉服及相关文化领域问题。若问题明显超出汉服领域（如编程、股票、闲聊），hitKnowledge 设为 false，answer 里礼貌说明这里只聊汉服，建议去「萌新求助」社区提问。
- 领域内问题 hitKnowledge 设为 true。
- 不编造不确定的史实；不确定时说明。
只输出 JSON：{"answer":"...","hitKnowledge":true}`

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
        { role: 'system', content: SENTIMENT_PROMPT },
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

/**
 * 汉服知识问答。question 为本轮提问，history 为最近若干轮对话（多轮上下文）。
 * 失败抛错，由调用方降级。
 */
export async function answerQa(question: string, history: QaTurn[] = []): Promise<QaResult> {
  if (API_KEY === '') {
    throw new Error('DEEPSEEK_API_KEY 未配置')
  }

  // 只带最近 6 轮历史，控制 token
  const recent = history.slice(-6).map((t) => ({ role: t.role, content: t.content }))

  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: QA_PROMPT },
        ...recent,
        { role: 'user', content: question },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  })

  if (!resp.ok) {
    throw new Error(`DeepSeek HTTP ${resp.status}: ${await resp.text()}`)
  }

  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content ?? ''
  const parsed = JSON.parse(content) as { answer?: unknown; hitKnowledge?: unknown }
  return {
    answer: String(parsed.answer ?? '').trim() || '抱歉，我没能理解这个问题，换个说法再问问？',
    hitKnowledge: parsed.hitKnowledge !== false,
  }
}
