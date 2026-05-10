import { NextRequest, NextResponse } from 'next/server'

async function pollOperation(operationName: string, apiKey: string, maxAttempts = 40): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
    )
    if (!res.ok) continue
    const data = await res.json()
    if (data.done) {
      // Try multiple response shapes
      const uri =
        data.response?.generatedSamples?.[0]?.video?.uri ??
        data.response?.videos?.[0]?.uri ??
        data.response?.video?.uri
      if (uri) return uri
      throw new Error(`Veo completed but no video URI. Response: ${JSON.stringify(data.response).slice(0, 200)}`)
    }
    if (data.error) throw new Error(`Veo error: ${data.error.message}`)
  }
  throw new Error('Veo 3 timed out after ~3 minutes')
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

    // Build contents with optional reference image
    const parts: object[] = []
    if (imageBase64 && imageMime) {
      parts.push({ inlineData: { mimeType: imageMime, data: imageBase64 } })
    }
    parts.push({ text: prompt })

    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: { durationSeconds: 8 },
    }

    // Try Veo 3.0 first, fall back to Veo 2.0
    const models = ['veo-3.0-generate-preview', 'veo-2.0-generate-001']
    let lastError = ''

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateVideo?key=${apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        )

        if (!res.ok) {
          const err = await res.text()
          lastError = `${model} ${res.status}: ${err.slice(0, 150)}`
          continue
        }

        const operation = await res.json()
        if (!operation.name) { lastError = `${model}: no operation name`; continue }

        const videoUri = await pollOperation(operation.name, apiKey)
        return NextResponse.json({ success: true, videoUri, model, timestamp: new Date().toISOString() })
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
        continue
      }
    }

    return NextResponse.json({ error: `Video generation failed: ${lastError}` }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/generate-video]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
