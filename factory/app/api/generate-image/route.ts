import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

const TMP_DIR = '/tmp/cantsleept-images'

// Models tried in order — first that returns image data wins
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash-preview-image-generation',
  'gemini-2.5-flash-image',
]

async function generateWithSDK(
  prompt: string,
  apiKey: string
): Promise<{ base64: string; mime: string; model: string }> {
  const ai = new GoogleGenAI({ apiKey })

  for (const model of MODELS) {
    // Try IMAGE-only first, then TEXT+IMAGE fallback
    for (const modalities of [['IMAGE'], ['TEXT', 'IMAGE']]) {
      let response
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseModalities: modalities,
          } as Record<string, unknown>,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('404') || msg.includes('not found')) {
          console.log(`[generate-image] ${model} not found, skipping`)
          break // skip remaining modality tries for this model
        }
        console.error(`[generate-image] ${model} modalities=${modalities} error:`, msg)
        continue
      }

      const parts = response.candidates?.[0]?.content?.parts ?? []
      const imgPart = parts.find(
        (p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data
      )

      if (imgPart?.inlineData?.data) {
        return {
          base64: imgPart.inlineData.data,
          mime: imgPart.inlineData.mimeType ?? 'image/jpeg',
          model,
        }
      }

      const textParts = parts
        .filter((p: { text?: string }) => p.text)
        .map((p: { text?: string }) => p.text)
        .join(' ')
      console.error(
        `[generate-image] ${model} modalities=${modalities} — no image. Text: ${textParts.slice(0, 300)}`
      )
    }
  }

  throw new Error('All models failed to return image data. Check server logs.')
}

async function toPortrait916(base64: string, mime: string): Promise<{ base64: string; mime: string }> {
  try {
    const buf = Buffer.from(base64, 'base64')
    const meta = await sharp(buf).metadata()
    const w = meta.width ?? 1024
    const h = meta.height ?? 1024

    const targetW = Math.round((h * 9) / 16)
    const targetH = h

    // If already portrait enough, skip
    if (Math.abs(w / h - 9 / 16) < 0.05) {
      return { base64, mime }
    }

    let processed: Buffer
    if (targetW <= w) {
      // Square or wide → center-crop to portrait 9:16
      processed = await sharp(buf)
        .extract({
          left: Math.round((w - targetW) / 2),
          top: 0,
          width: targetW,
          height: targetH,
        })
        .jpeg({ quality: 95 })
        .toBuffer()
    } else {
      // Already taller than wide — pad sides with black to reach 9:16
      processed = await sharp(buf)
        .resize(targetW, targetH, { fit: 'contain', background: '#000000' })
        .jpeg({ quality: 95 })
        .toBuffer()
    }

    return { base64: processed.toString('base64'), mime: 'image/jpeg' }
  } catch (err) {
    console.error('[generate-image] sharp 9:16 conversion failed:', err)
    return { base64, mime }
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
      conceptId,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/generate-image]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
