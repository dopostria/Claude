import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const TMP_DIR = '/tmp/cantsleept-images'

async function generateWithNewSDK(
  prompt: string,
  apiKey: string
): Promise<{ base64: string; mime: string; model: string }> {
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '9:16' },
    } as Record<string, unknown>,
  })

  const parts = response.candidates?.[0]?.content?.parts ?? []
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mime: part.inlineData.mimeType ?? 'image/jpeg',
        model: 'gemini-2.5-flash-image',
      }
    }
  }
  throw new Error('gemini-2.5-flash-image: no image in response')
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
    const { prompt, conceptId } = await req.json() as { prompt: string; conceptId: string }
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })

    const result = await generateWithNewSDK(prompt, apiKey)

    const filename = await saveToTmp(result.base64, result.mime, conceptId)

    return NextResponse.json({
      success: true,
      base64: result.base64,
      mime: result.mime,
      model: result.model,
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
