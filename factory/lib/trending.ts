import fs from 'fs'
import path from 'path'

const IS_VERCEL = process.env.VERCEL === '1'
const MUTABLE_DIR = IS_VERCEL ? '/tmp/factory-data' : path.join(process.cwd(), 'data')
const TREND_PATH = path.join(MUTABLE_DIR, 'trend_feed.json')

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

const TREND_PROMPT = `Search for the top 5 most talked-about news or events in Bolivia right now.
For each one, return ONLY a JSON array with this structure, nothing else:
[
  {
    "id": "trend_001",
    "topic": "nombre del tema",
    "source": "tiktok | twitter | news",
    "summary": "qué está pasando en máximo 2 oraciones",
    "humor_angle": "por qué esto puede ser absurdo, irónico o chistoso para un boliviano",
    "tags": ["política", "cotidiano", "viral", "deportes", "economía"],
    "expires": "[fecha de hoy + 2 días]"
  }
]
Return only the JSON array. No preamble. No markdown.`

export interface TrendItem {
  id: string
  topic: string
  source: string
  summary: string
  humor_angle: string
  tags: string[]
  expires: string
}

export interface TrendFeed {
  last_updated: string
  trends: TrendItem[]
}

export function readTrendFeed(): TrendFeed {
  try {
    if (fs.existsSync(TREND_PATH)) {
      return JSON.parse(fs.readFileSync(TREND_PATH, 'utf-8')) as TrendFeed
    }
  } catch { /* fall through */ }
  return { last_updated: '', trends: [] }
}

function saveTrendFeed(feed: TrendFeed): void {
  try {
    if (!fs.existsSync(MUTABLE_DIR)) fs.mkdirSync(MUTABLE_DIR, { recursive: true })
    fs.writeFileSync(TREND_PATH, JSON.stringify(feed, null, 2), 'utf-8')
  } catch { /* silent on read-only fs */ }
}

function isFresh(feed: TrendFeed): boolean {
  if (!feed.last_updated || feed.trends.length === 0) return false
  return Date.now() - new Date(feed.last_updated).getTime() < CACHE_TTL_MS
}

export async function fetchAndSaveTrends(): Promise<TrendFeed> {
  const existing = readTrendFeed()
  if (isFresh(existing)) return existing

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return existing

  try {
    // Raw fetch bypasses SDK version constraints — web_search_20250305 needs beta header
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        tools: [{ type: 'web_search_20250305', max_uses: 5 }],
        messages: [{ role: 'user', content: TREND_PROMPT }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic API ${res.status}: ${err.slice(0, 200)}`)
    }

    const data = await res.json() as {
      content: Array<{ type: string; text?: string }>
    }

    const text = data.content
      .filter(b => b.type === 'text' && b.text)
      .map(b => b.text!)
      .join('')

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in trends response')

    const trends = JSON.parse(jsonMatch[0]) as TrendItem[]
    const feed: TrendFeed = { last_updated: new Date().toISOString(), trends }
    saveTrendFeed(feed)
    console.log(`[trending] fetched ${trends.length} trends`)
    return feed
  } catch (err) {
    console.error('[trending] fetch failed, using cache:', err instanceof Error ? err.message : err)
    return existing
  }
}
