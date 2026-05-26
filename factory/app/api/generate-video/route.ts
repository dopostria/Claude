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
// Higgsfield — grok_video with start frame via media upload
// ---------------------------------------------------------------------------

async function generateWithHiggsfield(
  prompt: string,
  apiToken: string,
  imageBase64?: string,
  imageMime?: string
): Promise<{ videoUri: string; model: string }> {
  let mediaId: string | undefined

  // Upload start frame image if provided
  if (imageBase64) {
    try {
      const mime = imageMime ?? 'image/jpeg'
      const imgBuf = Buffer.from(imageBase64, 'base64')

      // Step 1: request upload slot
      const uploadInitRes = await fetch(`${HIGGSFIELD_BASE}/agents/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'start_frame.jpg', content_type: mime }),
      })
      if (uploadInitRes.ok) {
        const uploadData = await uploadInitRes.json() as {
          id?: string; upload_id?: string; url?: string; upload_url?: string
        }
        const uploadUrl = uploadData.url ?? uploadData.upload_url
        mediaId = uploadData.id ?? uploadData.upload_id
        if (uploadUrl) {
          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: imgBuf,
            headers: { 'Content-Type': mime },
          })
          if (!putRes.ok) {
            console.warn('[generate-video] Higgsfield upload PUT failed, proceeding without start frame')
            mediaId = undefined
          }
        }
      }
    } catch (e) {
      console.warn('[generate-video] image upload skipped:', e)
    }
  }

  // Create video job — start_image carries the uploaded media ID
  const params: Record<string, unknown> = { prompt, aspect_ratio: '9:16', duration: 3 }
  if (mediaId) params.start_image = mediaId

  const createRes = await fetch(`${HIGGSFIELD_BASE}/agents/jobs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_set_type: 'grok_video', params }),
  })
  if (!createRes.ok) {
    const body = await createRes.text().catch(() => '')
    throw new Error(`Higgsfield video create failed ${createRes.status}: ${body.slice(0, 200)}`)
  }

  const createRaw = await createRes.json()
  const firstItem = Array.isArray(createRaw) ? createRaw[0] : createRaw
  const jobId: string | undefined = typeof firstItem === 'string' ? firstItem : (firstItem?.id ?? firstItem?.job_id)
  if (!jobId) throw new Error(`Higgsfield: no video job ID — raw: ${JSON.stringify(createRaw).slice(0, 200)}`)
  console.log(`[generate-video] Higgsfield video job created: ${jobId}`)

  const TIMEOUT = 600_000
  const INTERVAL = 8_000
  const deadline = Date.now() + TIMEOUT

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, INTERVAL))
    const pollRes = await fetch(`${HIGGSFIELD_BASE}/agents/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    if (!pollRes.ok) continue

    const pollRaw = await pollRes.json()
    const status = (Array.isArray(pollRaw) ? pollRaw[0] : pollRaw) as {
      status?: string; result_url?: string; min_result_url?: string; error?: unknown
    }
    console.log(`[generate-video] Higgsfield job ${jobId} status: ${status.status}`)

    if (['completed', 'done', 'succeeded'].includes(status.status ?? '')) {
      const videoUrl = status.result_url ?? status.min_result_url
      if (!videoUrl) throw new Error(`Higgsfield: no video URL — keys: ${Object.keys(status as object).join(', ')}`)
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
