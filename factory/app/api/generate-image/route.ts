import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

const TMP_DIR = '/tmp/cantsleept-images'

async function generateWithSDK(
  prompt: string,
  apiKey: string
): Promise<{ base64: string; mime: string; model: string }> {
  const ai = new GoogleGenAI({ apiKey })

  // Try models in order: experimental (free tier) → preview (requires billing)
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
          console.log(`[generate-image] ✓ model: ${model}`)
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
      if (!isQuota) break // non-quota errors won't improve with another model
    }
  }

  throw lastError ?? new Error('All image generation models failed. Check GEMINI_API_KEY billing or quota.')
}

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
      console.log(`[generate-image] ✓ native 9:16 — ${originalDimensions}`)
      return { base64, mime, native916: true, originalDimensions }
    }

    const targetW = Math.round((h * 9) / 16)
    const targetH = h
    console.log(`[generate-image] sharp crop ${originalDimensions} → ${targetW}x${targetH}`)

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

export async function POST(req: NextRequest) {
  try {
    const { prompt, conceptId } = (await req.json()) as { prompt: string; conceptId: string }
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })

    const raw = await generateWithSDK(prompt, apiKey)
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
