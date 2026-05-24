import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { withHiggsfieldToken } from '@/lib/higgsfield-auth'

const TMP_DIR = '/tmp/cantsleept-images'
const HIGGSFIELD_BASE = 'https://fnf.higgsfield.ai'

// ---------------------------------------------------------------------------
// Higgsfield — nano_banana (budget) or nano_banana_pro (unlimited sub)
// ---------------------------------------------------------------------------

async function generateWithHiggsfield(
  prompt: string,
  apiToken: string,
  model = 'nano_banana'
): Promise<{ base64: string; mime: string; model: string }> {
  const createRes = await fetch(`${HIGGSFIELD_BASE}/agents/jobs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      job_set_type: model,
      prompt,
      aspect_ratio: '9:16',
    }),
  })

  if (!createRes.ok) {
    const body = await createRes.text().catch(() => '')
    throw new Error(`Higgsfield create failed ${createRes.status}: ${body.slice(0, 200)}`)
  }

  const job = await createRes.json() as { id?: string; job_id?: string }
  const jobId = job.id ?? job.job_id
  if (!jobId) throw new Error('Higgsfield: no job ID in response')
  console.log(`[generate-image] Higgsfield job created: ${jobId}`)

  const TIMEOUT = 180_000
  const INTERVAL = 4_000
  const deadline = Date.now() + TIMEOUT

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, INTERVAL))

    const pollRes = await fetch(`${HIGGSFIELD_BASE}/agents/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    if (!pollRes.ok) throw new Error(`Higgsfield poll failed ${pollRes.status}`)

    const status = await pollRes.json() as {
      status?: string
      results?: Array<{ url?: string } | string>
      error?: unknown
    }
    console.log(`[generate-image] Higgsfield job ${jobId} status: ${status.status}`)

    if (['completed', 'done', 'succeeded'].includes(status.status ?? '')) {
      const results = status.results ?? []
      const first = results[0]
      const imageUrl = typeof first === 'string' ? first : first?.url
      if (!imageUrl) throw new Error('Higgsfield: no image URL in completed job')

      const imgRes = await fetch(imageUrl)
      if (!imgRes.ok) throw new Error(`Higgsfield image download failed ${imgRes.status}`)
      const buf = await imgRes.arrayBuffer()
      const mime = imgRes.headers.get('content-type') ?? 'image/jpeg'

      return { base64: Buffer.from(buf).toString('base64'), mime, model: `higgsfield/${model}` }
    }

    if (['failed', 'error', 'cancelled'].includes(status.status ?? '')) {
      throw new Error(`Higgsfield job ${status.status}: ${JSON.stringify(status.error ?? '')}`)
    }
  }

  throw new Error('Higgsfield: job timed out after 3 minutes')
}

// ---------------------------------------------------------------------------
// Gemini — free experimental model first
// ---------------------------------------------------------------------------

async function generateWithGemini(
  prompt: string,
  apiKey: string
): Promise<{ base64: string; mime: string; model: string }> {
  const ai = new GoogleGenAI({ apiKey })

  const candidates = [
    'gemini-2.0-flash-exp-image-generation',
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.5-flash-image',
  ]

  let lastError: Error | null = null

  for (const model of candidates) {
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
          imageConfig: { aspectRatio: '9:16' },
        } as Record<string, unknown>,
      })

      for await (const chunk of stream) {
        const parts = (chunk as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string }; text?: string }> } }> })
          .candidates?.[0]?.content?.parts ?? []

        const imgPart = parts.find(p => p.inlineData?.data)
        if (imgPart?.inlineData?.data) {
          console.log(`[generate-image] ✓ Gemini model: ${model}`)
          return {
            base64: imgPart.inlineData.data,
            mime: imgPart.inlineData.mimeType ?? 'image/jpeg',
            model,
          }
        }
      }
      throw new Error(`${model}: no image returned`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')
      console.warn(`[generate-image] ${model} failed${isQuota ? ' (quota)' : ''}: ${msg.slice(0, 120)}`)
      lastError = err instanceof Error ? err : new Error(msg)
      if (!isQuota) break
    }
  }

  throw lastError ?? new Error('All Gemini models failed')
}

// ---------------------------------------------------------------------------
// Sharp: crop/letterbox to 9:16
// ---------------------------------------------------------------------------

async function toPortrait916(
  base64: string,
  mime: string
): Promise<{ base64: string; mime: string; native916: boolean; originalDimensions: string }> {
  try {
    const buf = Buffer.from(base64, 'base64')
    const meta = await sharp(buf).metadata()
    const w = meta.width ?? 1024
    const h = meta.height ?? 1024
    const originalDimensions = `${w}x${h}`

    if (Math.abs(w / h - 9 / 16) < 0.05) {
      return { base64, mime, native916: true, originalDimensions }
    }

    const targetW = Math.round((h * 9) / 16)
    const targetH = h

    let processed: Buffer
    if (targetW <= w) {
      processed = await sharp(buf)
        .extract({ left: Math.round((w - targetW) / 2), top: 0, width: targetW, height: targetH })
        .jpeg({ quality: 95 })
        .toBuffer()
    } else {
      processed = await sharp(buf)
        .resize(targetW, targetH, { fit: 'contain', background: '#000000' })
        .jpeg({ quality: 95 })
        .toBuffer()
    }

    return { base64: processed.toString('base64'), mime: 'image/jpeg', native916: false, originalDimensions }
  } catch (err) {
    console.error('[generate-image] sharp conversion failed:', err)
    return { base64, mime, native916: false, originalDimensions: 'unknown' }
  }
}

async function saveToTmp(base64: string, mime: string, conceptId: string): Promise<string> {
  const ext = mime.includes('png') ? 'png' : 'jpg'
  const filename = `img-${conceptId}-${Date.now()}.${ext}`
  await mkdir(TMP_DIR, { recursive: true })
  await writeFile(join(TMP_DIR, filename), Buffer.from(base64, 'base64'))
  return filename
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { prompt, conceptId, provider = 'gemini' } = (await req.json()) as {
      prompt: string
      conceptId: string
      provider?: 'higgsfield' | 'gemini'
    }
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const geminiKey = process.env.GEMINI_API_KEY

    let raw: { base64: string; mime: string; model: string }

    if (provider === 'higgsfield') {
      raw = await withHiggsfieldToken(token =>
        generateWithHiggsfield(prompt, token, 'text2image_soul_v2')
      )
    } else {
      if (!geminiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
      raw = await generateWithGemini(prompt, geminiKey)
    }

    const portrait = await toPortrait916(raw.base64, raw.mime)
    const filename = await saveToTmp(portrait.base64, portrait.mime, conceptId)

    return NextResponse.json({
      success: true,
      base64: portrait.base64,
      mime: portrait.mime,
      model: raw.model,
      imagePath: `/api/images/${filename}`,
      native916: portrait.native916,
      originalDimensions: portrait.originalDimensions,
      conceptId,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/generate-image]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
