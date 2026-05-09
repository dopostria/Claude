import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

const OUTPUTS_DIR = path.join(process.cwd(), 'public', 'outputs')

function ensureOutputsDir() {
  if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true })
}

function timestamp() {
  return Date.now().toString()
}

// ── Gemini image generation via gemini-2.0-flash (native image output) ──
async function generateWithGemini(prompt: string): Promise<{ path: string; base64: string; mime: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-preview-image-generation',
  })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      // @ts-expect-error: responseModalities is valid but not in types yet
      responseModalities: ['IMAGE'],
    },
  })

  const parts = result.response.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData)

  if (!imagePart?.inlineData) throw new Error('No image in Gemini response')

  const { data: base64, mimeType: mime } = imagePart.inlineData
  const ext = mime.includes('png') ? 'png' : 'jpg'
  const ts = timestamp()
  const filename = `gemini-${ts}.${ext}`
  const filepath = path.join(OUTPUTS_DIR, filename)

  ensureOutputsDir()
  fs.writeFileSync(filepath, Buffer.from(base64, 'base64'))

  return { path: `/outputs/${filename}`, base64, mime }
}

// ── Imagen 3 via REST API ─────────────────────────────────────────────
async function generateWithImagen3(prompt: string): Promise<{ path: string; base64: string; mime: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: { text: prompt },
        number_of_images: 1,
        aspect_ratio: '1:1',
        safety_filter_level: 'BLOCK_ONLY_HIGH',
        person_generation: 'ALLOW_ADULT',
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Imagen 3 API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const imageData = data.generatedImages?.[0]?.image?.imageBytes
  if (!imageData) throw new Error('No image in Imagen 3 response')

  const mime = 'image/png'
  const ts = timestamp()
  const filename = `imagen3-${ts}.png`
  const filepath = path.join(OUTPUTS_DIR, filename)

  ensureOutputsDir()
  fs.writeFileSync(filepath, Buffer.from(imageData, 'base64'))

  return { path: `/outputs/${filename}`, base64: imageData, mime }
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

    let result: { path: string; base64: string; mime: string }

    if (tool === 'gemini-imagen3') {
      result = await generateWithImagen3(prompt)
    } else if (tool === 'gemini') {
      result = await generateWithGemini(prompt)
    } else {
      return NextResponse.json({ error: 'Higgsfield not yet connected' }, { status: 501 })
    }

    return NextResponse.json({
      success: true,
      imagePath: result.path,
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
