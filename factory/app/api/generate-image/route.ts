import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Gemini 2.0 Flash — native image generation ────────────────────────
async function generateWithGeminiFlash(prompt: string): Promise<{ base64: string; mime: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-preview-image-generation',
  })

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

  if (!imagePart?.inlineData) throw new Error('Gemini no devolvió imagen. Intenta reformular el prompt.')

  return { base64: imagePart.inlineData.data, mime: imagePart.inlineData.mimeType }
}

// ── Higgsfield Nano Banana Pro ────────────────────────────────────────
async function generateWithHiggsfield(prompt: string, model = 'nano_banana_2'): Promise<{ base64: string; mime: string }> {
  const apiKey = process.env.HIGGSFIELD_API_KEY
  if (!apiKey) throw new Error('HIGGSFIELD_API_KEY not set')

  const res = await fetch('https://api.higgsfield.ai/v1/images/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      width: 1024,
      height: 1024,
      num_inference_steps: 30,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Higgsfield error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()

  // Handle async job
  if (data.id && !data.image_url && !data.images) {
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const poll = await fetch(`https://api.higgsfield.ai/v1/images/${data.id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      if (poll.ok) {
        const p = await poll.json()
        if (p.image_url || p.images?.[0]?.url) {
          const url = p.image_url ?? p.images?.[0]?.url
          const imgRes = await fetch(url)
          const buf = await imgRes.arrayBuffer()
          return { base64: Buffer.from(buf).toString('base64'), mime: 'image/png' }
        }
        if (p.status === 'failed') throw new Error('Higgsfield generation failed')
      }
    }
    throw new Error('Higgsfield image timed out')
  }

  // Sync response with URL
  const url = data.image_url ?? data.images?.[0]?.url ?? data.url
  if (url) {
    const imgRes = await fetch(url)
    const buf = await imgRes.arrayBuffer()
    return { base64: Buffer.from(buf).toString('base64'), mime: 'image/png' }
  }

  // Direct base64
  const b64 = data.image ?? data.images?.[0]?.b64_json ?? data.b64_json
  if (b64) return { base64: b64, mime: 'image/png' }

  throw new Error('No image data in Higgsfield response')
}

// ── Route handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { prompt, tool, conceptId } = await req.json() as {
      prompt: string
      tool: 'gemini' | 'higgsfield-nano-banana' | 'higgsfield'
      conceptId: string
    }

    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    let result: { base64: string; mime: string }

    if (tool === 'higgsfield-nano-banana' || tool === 'higgsfield') {
      result = await generateWithHiggsfield(prompt, 'nano_banana_2')
    } else {
      result = await generateWithGeminiFlash(prompt)
    }

    return NextResponse.json({
      success: true,
      base64: result.base64,
      mime: result.mime,
      conceptId,
      tool,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/generate-image]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
