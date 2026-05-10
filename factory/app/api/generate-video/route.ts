import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://generativelanguage.googleapis.com/v1beta'
const HEADERS = (apiKey: string) => ({ 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' })

// veo-2.0-generate-001 is Vertex AI only — not available on AI Studio endpoint
const MODELS = ['veo-3.1-generate-preview', 'veo-3.0-generate-preview']

async function pollOperation(operationName: string, apiKey: string, maxAttempts = 40): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 10000))
    const res = await fetch(`${BASE}/${operationName}`, { headers: { 'x-goog-api-key': apiKey } })
    if (!res.ok) continue
    const data = await res.json()
    if (data.error) throw new Error(`Veo error: ${data.error.message}`)
    if (data.done) {
      const uri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
      if (uri) return uri
      throw new Error(`Veo done but no URI. Response: ${JSON.stringify(data.response).slice(0, 300)}`)
    }
  }
  throw new Error('Veo timed out after ~7 minutes')
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, imageBase64, imageMime } = await req.json() as {
      prompt: string
      imageBase64?: string
      imageMime?: string
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    // Build instance — image is optional reference frame
    const instance: Record<string, unknown> = { prompt }
    if (imageBase64 && imageMime) {
      instance.image = { bytesBase64Encoded: imageBase64, mimeType: imageMime }
    }

    const body = {
      instances: [instance],
      parameters: { sampleCount: 1, durationSeconds: 8, aspectRatio: '9:16' },
    }

    const errors: string[] = []

    for (const model of MODELS) {
      try {
        const res = await fetch(`${BASE}/models/${model}:predictLongRunning`, {
          method: 'POST',
          headers: HEADERS(apiKey),
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const err = await res.text()
          errors.push(`${model} ${res.status}: ${err.slice(0, 200)}`)
          continue
        }

        const operation = await res.json()
        if (!operation.name) { errors.push(`${model}: no operation name`); continue }

        const videoUri = await pollOperation(operation.name, apiKey)
        return NextResponse.json({ success: true, videoUri, model, timestamp: new Date().toISOString() })
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
    }

    return NextResponse.json({ error: `Video generation failed:\n${errors.join('\n')}` }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/generate-video]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
