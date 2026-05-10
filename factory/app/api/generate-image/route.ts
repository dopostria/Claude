import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const H = (apiKey: string) => ({ 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' })
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const GEMINI_IMAGE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-2.0-flash-exp-image-generation',
]

async function tryGemini(modelId: string, prompt: string, apiKey: string): Promise<{ base64: string; mime: string; model: string }> {
  const res = await fetch(`${BASE}/${modelId}:generateContent`, {
    method: 'POST',
    headers: H(apiKey),
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      imageConfig: { aspectRatio: '9:16' },
    }),
  })
  if (!res.ok) throw new Error(`${modelId} ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  const parts: { inlineData?: { data: string; mimeType: string } }[] =
    data.candidates?.[0]?.content?.parts ?? []
  const img = parts.find(p => p.inlineData)
  if (!img?.inlineData) throw new Error(`${modelId}: no image in response`)
  return { base64: img.inlineData.data, mime: img.inlineData.mimeType, model: modelId }
}

async function tryImagen(prompt: string, apiKey: string): Promise<{ base64: string; mime: string; model: string }> {
  const candidates = [
    {
      url: `${BASE}/imagen-3.0-generate-002:generateImages`,
      body: { prompt, number_of_images: 1, aspect_ratio: '9:16', safety_filter_level: 'BLOCK_ONLY_HIGH' },
      extract: (d: Record<string, unknown>) => {
        const imgs = d.generated_images as { image?: { image_bytes?: string; mime_type?: string } }[] | undefined
        const b = imgs?.[0]?.image?.image_bytes
        const m = imgs?.[0]?.image?.mime_type ?? 'image/png'
        return b ? { base64: b, mime: m } : null
      },
      model: 'imagen-3.0-generate-002',
    },
    {
      url: `${BASE}/imagen-3.0-generate-002:predict`,
      body: { instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: '9:16' } },
      extract: (d: Record<string, unknown>) => {
        const pred = (d.predictions as { bytesBase64Encoded?: string; mimeType?: string }[])?.[0]
        return pred?.bytesBase64Encoded ? { base64: pred.bytesBase64Encoded, mime: pred.mimeType ?? 'image/png' } : null
      },
      model: 'imagen-3.0-generate-002',
    },
    {
      url: 'https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-002:predict',
      body: { instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: '9:16' } },
      extract: (d: Record<string, unknown>) => {
        const pred = (d.predictions as { bytesBase64Encoded?: string; mimeType?: string }[])?.[0]
        return pred?.bytesBase64Encoded ? { base64: pred.bytesBase64Encoded, mime: pred.mimeType ?? 'image/png' } : null
      },
      model: 'imagen-3.0-generate-002-v1',
    },
  ]

  const errors: string[] = []
  for (const c of candidates) {
    try {
      const res = await fetch(c.url, { method: 'POST', headers: H(apiKey), body: JSON.stringify(c.body) })
      if (!res.ok) { errors.push(`${c.model} ${res.status}: ${(await res.text()).slice(0, 200)}`); continue }
      const data = await res.json() as Record<string, unknown>
      const result = c.extract(data)
      if (result) return { ...result, model: c.model }
      errors.push(`${c.model}: unexpected response shape`)
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e))
    }
  }
  throw new Error(errors.join(' | '))
}

// Best-effort save to public/generated/ — silently skips on read-only filesystems.
async function trySaveToDisk(base64: string, mime: string, conceptId: string): Promise<string> {
  try {
    const ext = mime.includes('png') ? 'png' : 'jpg'
    const filename = `img-${conceptId}-${Date.now()}.${ext}`
    const outDir = join(process.cwd(), 'public', 'generated')
    await mkdir(outDir, { recursive: true })
    await writeFile(join(outDir, filename), Buffer.from(base64, 'base64'))
    return `/generated/${filename}`
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, conceptId } = await req.json() as { prompt: string; conceptId: string }
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })

    const errors: string[] = []
    let result: { base64: string; mime: string; model: string } | null = null

    for (const modelId of GEMINI_IMAGE_MODELS) {
      try { result = await tryGemini(modelId, prompt, apiKey); break }
      catch (e) { errors.push(e instanceof Error ? e.message : String(e)) }
    }

    if (!result) {
      try { result = await tryImagen(prompt, apiKey) }
      catch (e) { errors.push(e instanceof Error ? e.message : String(e)) }
    }

    if (!result) {
      return NextResponse.json({ error: `All image models failed:\n${errors.join('\n')}` }, { status: 500 })
    }

    const imagePath = await trySaveToDisk(result.base64, result.mime, conceptId)

    return NextResponse.json({
      success: true,
      base64: result.base64,
      mime: result.mime,
      model: result.model,
      imagePath,
      conceptId,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/generate-image]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
