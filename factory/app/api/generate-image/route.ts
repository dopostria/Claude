import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_MODELS = [
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
]

async function tryGeminiSDK(modelId: string, prompt: string, apiKey: string): Promise<{ base64: string; mime: string; model: string }> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: modelId })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      // @ts-expect-error: responseModalities valid but not typed yet
      responseModalities: ['IMAGE', 'TEXT'],
    },
  })

  const parts = result.response.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find(
    (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData
  )
  if (!imagePart?.inlineData) throw new Error('No image in response')
  return { base64: imagePart.inlineData.data, mime: imagePart.inlineData.mimeType, model: modelId }
}

async function tryImagen3(prompt: string, apiKey: string): Promise<{ base64: string; mime: string; model: string }> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: { text: prompt },
        numberOfImages: 1,
        aspectRatio: '1:1',
        safetyFilterLevel: 'BLOCK_ONLY_HIGH',
        personGeneration: 'ALLOW_ADULT',
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Imagen 3 ${res.status}: ${err.slice(0, 200)}`)
  }
  const data = await res.json()
  // Handle multiple possible response shapes
  const img =
    data.generatedImages?.[0]?.image ??
    data.images?.[0] ??
    data.predictions?.[0]
  if (!img) throw new Error(`Imagen 3 returned no image. Keys: ${Object.keys(data).join(', ')}`)
  const base64 = img.imageBytes ?? img.bytesBase64Encoded ?? img.image_bytes
  const mime = img.mimeType ?? img.mime_type ?? 'image/png'
  if (!base64) throw new Error('Imagen 3: no base64 bytes found')
  return { base64, mime, model: 'imagen-3.0-generate-002' }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, conceptId } = await req.json() as { prompt: string; conceptId: string }
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })

    const errors: string[] = []

    // Try Gemini SDK models first (best → good)
    for (const modelId of GEMINI_MODELS) {
      try {
        const result = await tryGeminiSDK(modelId, prompt, apiKey)
        return NextResponse.json({ success: true, ...result, conceptId, timestamp: new Date().toISOString() })
      } catch (e) {
        errors.push(`${modelId}: ${e instanceof Error ? e.message.slice(0, 80) : String(e)}`)
      }
    }

    // Fall back to Imagen 3 REST
    try {
      const result = await tryImagen3(prompt, apiKey)
      return NextResponse.json({ success: true, ...result, conceptId, timestamp: new Date().toISOString() })
    } catch (e) {
      errors.push(`imagen-3: ${e instanceof Error ? e.message.slice(0, 100) : String(e)}`)
    }

    return NextResponse.json({ error: `All image models failed:\n${errors.join('\n')}` }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/generate-image]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
