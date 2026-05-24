import { NextRequest, NextResponse } from 'next/server'
import { withHiggsfieldToken } from '@/lib/higgsfield-auth'

const GOOGLE_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const HIGGSFIELD_BASE = 'https://fnf.higgsfield.ai'

// ---------------------------------------------------------------------------
// Google Veo (AI Studio direct)
// ---------------------------------------------------------------------------

async function pollGoogleOperation(operationName: string, apiKey: string, maxAttempts = 40): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 10000))
    const res = await fetch(`${GOOGLE_BASE}/${operationName}`, {
      headers: { 'x-goog-api-key': apiKey },
    })
    if (!res.ok) continue
    const data = await res.json()
    if (data.error) throw new Error(`Veo error: ${data.error.message}`)
    if (data.done) {
      const uri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
      if (uri) return uri
      const raiReasons: string[] = data.response?.generateVideoResponse?.raiMediaFilteredReasons ?? []
      if (raiReasons.length > 0) {
        throw new Error(
          `Prompt bloqueado por Google: ${raiReasons[0]}.\n\nEdita el prompt y elimina referencias a marcas, celebridades o contenido de terceros.`
        )
      }
      throw new Error(`Veo done but no URI. Response: ${JSON.stringify(data.response).slice(0, 300)}`)
    }
  }
  throw new Error('Veo timed out after ~7 minutes')
}

async function generateWithGoogle(
  prompt: string,
  apiKey: string,
  imageBase64?: string,
  imageMime?: string
): Promise<{ videoUri: string; model: string }> {
  const instance: Record<string, unknown> = { prompt }
  if (imageBase64 && imageMime) {
    instance.image = { bytesBase64Encoded: imageBase64, mimeType: imageMime }
  }

  const body = {
    instances: [instance],
    parameters: { sampleCount: 1, durationSeconds: 8, aspectRatio: '9:16' },
  }

  const res = await fetch(
    `${GOOGLE_BASE}/models/veo-3.1-generate-preview:predictLongRunning`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Veo ${res.status}: ${err.slice(0, 200)}`)
  }

  const operation = await res.json()
  if (!operation.name) throw new Error('Veo: no operation name')

  const videoUri = await pollGoogleOperation(operation.name, apiKey)
  return { videoUri, model: 'veo-3.1-generate-preview' }
}

// ---------------------------------------------------------------------------
// Higgsfield — veo3_1_lite (cheapest / fast)
// ---------------------------------------------------------------------------

async function generateWithHiggsfield(
  prompt: string,
  apiToken: string,
  imageBase64?: string,
  imageMime?: string
): Promise<{ videoUri: string; model: string }> {
  let mediaId: string | undefined

  if (imageBase64 && imageMime) {
    // Step 1: request upload slot
    const uploadInitRes = await fetch(`${HIGGSFIELD_BASE}/agents/uploads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename: 'reference.jpg', content_type: imageMime }),
    })
    if (!uploadInitRes.ok) {
      const body = await uploadInitRes.text().catch(() => '')
      throw new Error(`Higgsfield upload init failed ${uploadInitRes.status}: ${body.slice(0, 200)}`)
    }
    const uploadData = await uploadInitRes.json() as {
      id?: string; upload_id?: string; url?: string; upload_url?: string
    }
    console.log('[generate-video] Higgsfield upload response:', JSON.stringify(uploadData).slice(0, 200))

    const uploadUrl = uploadData.url ?? uploadData.upload_url
    mediaId = uploadData.id ?? uploadData.upload_id

    if (uploadUrl) {
      // Step 2: PUT image bytes to presigned URL
      const imgBuf = Buffer.from(imageBase64, 'base64')
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: imgBuf,
        headers: { 'Content-Type': imageMime },
      })
      if (!putRes.ok) {
        console.warn(`[generate-video] Higgsfield upload PUT failed ${putRes.status}, proceeding without image`)
        mediaId = undefined
      }
    }
  }

  // Step 3: create video job
  const jobPayload: Record<string, unknown> = {
    job_set_type: 'grok_video',
    prompt,
    aspect_ratio: '9:16',
    duration: 3,
  }
  if (mediaId) jobPayload.media_ids = [mediaId]

  const createRes = await fetch(`${HIGGSFIELD_BASE}/agents/jobs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobPayload),
  })

  if (!createRes.ok) {
    const body = await createRes.text().catch(() => '')
    throw new Error(`Higgsfield video create failed ${createRes.status}: ${body.slice(0, 200)}`)
  }

  const job = await createRes.json() as { id?: string; job_id?: string }
  const jobId = job.id ?? job.job_id
  if (!jobId) throw new Error('Higgsfield: no job ID in video response')
  console.log(`[generate-video] Higgsfield video job created: ${jobId}`)

  // Poll until done (max 10 min)
  const TIMEOUT = 600_000
  const INTERVAL = 8_000
  const deadline = Date.now() + TIMEOUT

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, INTERVAL))

    const pollRes = await fetch(`${HIGGSFIELD_BASE}/agents/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    if (!pollRes.ok) continue

    const status = await pollRes.json() as {
      status?: string
      results?: Array<{ url?: string } | string>
      error?: unknown
    }
    console.log(`[generate-video] Higgsfield job ${jobId} status: ${status.status}`)

    if (['completed', 'done', 'succeeded'].includes(status.status ?? '')) {
      const results = status.results ?? []
      const first = results[0]
      const videoUrl = typeof first === 'string' ? first : first?.url
      if (!videoUrl) throw new Error('Higgsfield: no video URL in completed job')
      return { videoUri: videoUrl, model: 'higgsfield/grok_video' }
    }

    if (['failed', 'error', 'cancelled'].includes(status.status ?? '')) {
      throw new Error(`Higgsfield video job ${status.status}: ${JSON.stringify(status.error ?? '')}`)
    }
  }

  throw new Error('Higgsfield video: job timed out after 10 minutes')
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { prompt, imageBase64, imageMime, provider = 'google' } = await req.json() as {
      prompt: string
      imageBase64?: string
      imageMime?: string
      provider?: 'higgsfield' | 'google'
    }

    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    let result: { videoUri: string; model: string }

    if (provider === 'higgsfield') {
      result = await withHiggsfieldToken(token =>
        generateWithHiggsfield(prompt, token, imageBase64, imageMime)
      )
    } else {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
      result = await generateWithGoogle(prompt, apiKey, imageBase64, imageMime)
    }

    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/generate-video]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
