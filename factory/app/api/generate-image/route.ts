import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

const IS_VERCEL = process.env.VERCEL === '1'
const OUTPUTS_DIR = IS_VERCEL ? '/tmp/outputs' : path.join(process.cwd(), 'public', 'outputs')

function ensureOutputsDir() {
  if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true })
}

function timestamp() {
  return Date.now().toString()
}

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

  if (!imagePart?.inlineData) throw new Error('Gemini no devolvió imagen. Intenta otro prompt.')

  return { base64: imagePart.inlineData.data, mime: imagePart.inlineData.mimeType }
}

// ── Imagen 3 via Google AI REST ───────────────────────────────────────
async function generateWithImagen3(prompt: string): Promise<{ base64: string; mime: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  // Try v1beta endpoint
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1 },
      }),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    // Imagen 3 requires special access — fall back to Gemini Flash
    if (res.status === 403 || res.status === 404 || res.status === 400) {
      console.warn('Imagen 3 not available, falling back to Gemini Flash')
      return generateWithGeminiFlash(prompt)
    }
    throw new Error(`Imagen 3 error ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const imageB64 = data.predictions?.[0]?.bytesBase64Encoded
  if (!imageB64) {
    console.warn('Imagen 3 returned no image, falling back to Gemini Flash')
    return generateWithGeminiFlash(prompt)
  }

  return { base64: imageB64, mime: 'image/png' }
}

// ── Route handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { prompt, tool, conceptId } = await req.json() as {
      prompt: string
      tool: 'gemini' | 'gemini-imagen3' | 'higgsfield'
      conceptId: string
    }

    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    let result: { base64: string; mime: string }

    if (tool === 'gemini-imagen3') {
      result = await generateWithImagen3(prompt)
    } else if (tool === 'gemini') {
      result = await generateWithGeminiFlash(prompt)
    } else {
      return NextResponse.json({ error: 'Higgsfield not yet connected' }, { status: 501 })
    }

    // Save to disk (best-effort — skip on Vercel if /tmp fills)
    let imagePath = null
    try {
      ensureOutputsDir()
      const ext = result.mime.includes('png') ? 'png' : 'jpg'
      const filename = `${tool}-${timestamp()}.${ext}`
      const filepath = path.join(OUTPUTS_DIR, filename)
      fs.writeFileSync(filepath, Buffer.from(result.base64, 'base64'))
      imagePath = IS_VERCEL ? null : `/outputs/${filename}`
    } catch { /* non-critical */ }

    return NextResponse.json({
      success: true,
      imagePath,
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
