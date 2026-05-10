import { NextRequest, NextResponse } from 'next/server'

const API_KEY_HEADER = (apiKey: string) => ({ 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' })
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Gemini Flash native image generation (generateContent + responseModalities)
const GEMINI_IMAGE_MODELS = [
  'gemini-2.5-flash-image',       // "Nano Banana" — GA as of 2025
  'gemini-2.0-flash-exp-image-generation', // older exp fallback
]

async function tryGemini(modelId: string, prompt: string, apiKey: string): Promise<{ base64: string; mime: string; model: string }> {
  const res = await fetch(`${BASE}/${modelId}:generateContent`, {
    method: 'POST',
    headers: API_KEY_HEADER(apiKey),
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${modelId} ${res.status}: ${err.slice(0, 200)}`)
  }
  const data = await res.json()
  const parts: { inlineData?: { data: string; mimeType: string } }[] =
    data.candidates?.[0]?.content?.parts ?? []
  const img = parts.find(p => p.inlineData)
  if (!img?.inlineData) throw new Error(`${modelId}: no image in response`)
  return { base64: img.inlineData.data, mime: img.inlineData.mimeType, model: modelId }
}

// Imagen 3 via :predict endpoint (NOT :generateImages — that's Vertex AI only)
async function tryImagen3(prompt: string, apiKey: string): Promise<{ base64: string; mime: string; model: string }> {
  const res = await fetch(`${BASE}/imagen-3.0-generate-002:predict`, {
    method: 'POST',
    headers: API_KEY_HEADER(apiKey),
    body: JSON.stringify({
      instances: [{ prompt }],          // flat string, NOT {text: '...'}
      parameters: { sampleCount: 1 },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`imagen-3 ${res.status}: ${err.slice(0, 200)}`)
  }
  const data = await res.json()
  const pred = data.predictions?.[0]
  if (!pred) throw new Error(`imagen-3: no predictions in response`)
  return {
    base64: pred.bytesBase64Encoded,
    mime: pred.mimeType ?? 'image/png',
    model: 'imagen-3.0-generate-002',
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, conceptId } = await req.json() as { prompt: string; conceptId: string }
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })

    const errors: string[] = []

    for (const modelId of GEMINI_IMAGE_MODELS) {
      try {
        const result = await tryGemini(modelId, prompt, apiKey)
        return NextResponse.json({ success: true, ...result, conceptId, timestamp: new Date().toISOString() })
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
    }

    try {
      const result = await tryImagen3(prompt, apiKey)
      return NextResponse.json({ success: true, ...result, conceptId, timestamp: new Date().toISOString() })
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e))
    }

    return NextResponse.json({ error: `All image models failed:\n${errors.join('\n')}` }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/generate-image]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
