import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

  if (!imagePart?.inlineData) throw new Error('Gemini no devolvió imagen — intenta otro prompt.')
  return { base64: imagePart.inlineData.data, mime: imagePart.inlineData.mimeType }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, conceptId } = await req.json() as { prompt: string; conceptId: string }
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const result = await generateWithGeminiFlash(prompt)

    return NextResponse.json({
      success: true,
      base64: result.base64,
      mime: result.mime,
      conceptId,
      tool: 'gemini-flash',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/generate-image]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
