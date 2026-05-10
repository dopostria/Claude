import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Veo 3.1 via Google AI REST API ────────────────────────────────────
async function generateWithVeo(prompt: string, imageBase64?: string, imageMime?: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  // Build request — with or without reference image
  const contents: object[] = []

  if (imageBase64 && imageMime) {
    contents.push({
      role: 'user',
      parts: [
        { inlineData: { mimeType: imageMime, data: imageBase64 } },
        { text: prompt },
      ],
    })
  } else {
    contents.push({ role: 'user', parts: [{ text: prompt }] })
  }

  // Start generation job
  const startRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:generateVideo?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    }
  )

  if (!startRes.ok) {
    const err = await startRes.text()
    throw new Error(`Veo 3.1 error ${startRes.status}: ${err.slice(0, 300)}`)
  }

  const operation = await startRes.json()
  const operationName = operation.name
  if (!operationName) throw new Error('No operation name from Veo API')

  // Poll for completion (max 3 min)
  const maxAttempts = 36
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 5000))

    const pollRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
    )
    if (!pollRes.ok) continue

    const poll = await pollRes.json()
    if (poll.done) {
      const videoUri = poll.response?.generatedSamples?.[0]?.video?.uri
        ?? poll.response?.videos?.[0]?.uri
      if (!videoUri) throw new Error('No video URI in Veo response')
      return { videoUri, source: 'veo-3.1' }
    }
  }

  throw new Error('Veo 3.1 timed out after 3 minutes')
}

// ── Higgsfield video ──────────────────────────────────────────────────
async function generateWithHiggsfield(prompt: string, imageBase64?: string, imageMime?: string) {
  const apiKey = process.env.HIGGSFIELD_API_KEY
  if (!apiKey) throw new Error('HIGGSFIELD_API_KEY not set')

  const body: Record<string, unknown> = {
    model: 'kling',
    prompt,
    duration: 5,
    aspect_ratio: '9:16',
  }

  if (imageBase64 && imageMime) {
    body.image = `data:${imageMime};base64,${imageBase64}`
  }

  const res = await fetch('https://api.higgsfield.ai/v1/video/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Higgsfield video error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()

  // Poll for completion if async
  if (data.id && !data.video_url) {
    for (let i = 0; i < 24; i++) {
      await new Promise(r => setTimeout(r, 5000))
      const poll = await fetch(`https://api.higgsfield.ai/v1/video/${data.id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })
      if (poll.ok) {
        const p = await poll.json()
        if (p.video_url || p.url) return { videoUri: p.video_url ?? p.url, source: 'higgsfield-kling' }
        if (p.status === 'failed') throw new Error('Higgsfield generation failed')
      }
    }
    throw new Error('Higgsfield video timed out')
  }

  const url = data.video_url ?? data.url
  if (!url) throw new Error('No video URL from Higgsfield')
  return { videoUri: url, source: 'higgsfield-kling' }
}

// ── Route handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { prompt, tool, imageBase64, imageMime, conceptId, animationId } = await req.json() as {
      prompt: string
      tool: 'veo' | 'higgsfield'
      imageBase64?: string
      imageMime?: string
      conceptId: string
      animationId: string
    }

    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    let result: { videoUri: string; source: string }

    if (tool === 'veo') {
      result = await generateWithVeo(prompt, imageBase64, imageMime)
    } else {
      result = await generateWithHiggsfield(prompt, imageBase64, imageMime)
    }

    return NextResponse.json({
      success: true,
      videoUri: result.videoUri,
      source: result.source,
      conceptId,
      animationId,
      tool,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/generate-video]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
