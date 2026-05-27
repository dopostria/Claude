import { NextRequest, NextResponse } from 'next/server'
import { withHiggsfieldToken } from '@/lib/higgsfield-auth'

// Vercel: allow up to 300s (Pro plan max). Hobby is capped at 60s by Vercel regardless.
export const maxDuration = 300

const GOOGLE_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const HIGGSFIELD_BASE = 'https://fnf.higgsfield.ai'

// ---------------------------------------------------------------------------
// Google Veo
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
      if (raiReasons.length > 0) throw new Error(`Prompt bloqueado por Google: ${raiReasons[0]}. Edita el prompt y elimina referencias a marcas, celebridades o contenido de terceros.`)
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
  const res = await fetch(`${GOOGLE_BASE}/models/veo-3.1-generate-preview:predictLongRunning`, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ instances: [instance], parameters: { sampleCount: 1, durationSeconds: 8, aspectRatio: '9:16' } }),
  })
  if (!res.ok) throw new Error(`Veo ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const operation = await res.json()
  if (!operation.name) throw new Error('Veo: no operation name')
  const videoUri = await pollGoogleOperation(operation.name, apiKey)
  return { videoUri, model: 'veo-3.1-generate-preview' }
}

// ---------------------------------------------------------------------------
// Higgsfield — correct upload flow (discovered via CLI inspection)
//
// POST /agents/uploads?type=image  → { id, url (CloudFront), upload_url (S3 presigned) }
// PUT  upload_url                  → upload bytes
// POST /agents/uploads/{id}/confirm?type=image → validates upload
// Job params.medias = [{ data: { id, url, type:"media_input" }, role:"start_image" }]
// ---------------------------------------------------------------------------

async function uploadStartFrame(
  apiToken: string,
  imageBase64: string,
  mime: string
): Promise<{ id: string; url: string } | undefined> {

  // Step 1 — request upload slot (type query param is required)
  const initRes = await fetch(`${HIGGSFIELD_BASE}/agents/uploads?type=image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'start_frame.jpg', content_type: mime }),
  })
  if (!initRes.ok) {
    console.warn(`[generate-video] upload init ${initRes.status}: ${(await initRes.text()).slice(0, 200)}`)
    return undefined
  }
  const init = await initRes.json() as { id?: string; url?: string; upload_url?: string }
  const { id, url: cloudFrontUrl, upload_url: uploadUrl } = init
  if (!id || !uploadUrl || !cloudFrontUrl) {
    console.warn('[generate-video] upload init missing fields:', JSON.stringify(init).slice(0, 200))
    return undefined
  }
  console.log(`[generate-video] upload slot: id=${id}`)

  // Step 2 — PUT image bytes to presigned S3 URL
  const imgBlob = new Blob([Buffer.from(imageBase64, 'base64')], { type: mime })
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: imgBlob,
    headers: { 'Content-Type': mime },
  })
  if (!putRes.ok) {
    console.warn(`[generate-video] upload PUT ${putRes.status}`)
    return undefined
  }

  // Step 3 — confirm (Higgsfield validates the upload before media can be used in a job)
  const confirmRes = await fetch(`${HIGGSFIELD_BASE}/agents/uploads/${id}/confirm?type=image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!confirmRes.ok) {
    console.warn(`[generate-video] confirm ${confirmRes.status}: ${(await confirmRes.text()).slice(0, 200)}`)
    return undefined
  }

  console.log(`[generate-video] start frame confirmed: ${id}`)
  return { id, url: cloudFrontUrl }
}

async function generateWithHiggsfield(
  prompt: string,
  apiToken: string,
  imageBase64?: string,
  imageMime?: string
): Promise<{ videoUri: string; model: string }> {
  let startFrame: { id: string; url: string } | undefined

  if (imageBase64) {
    try {
      startFrame = await uploadStartFrame(apiToken, imageBase64, imageMime ?? 'image/jpeg')
    } catch (e) {
      console.warn('[generate-video] start frame upload threw:', e)
    }
  }

  // Build job params — medias must be inside params (not top-level)
  const params: Record<string, unknown> = {
    prompt,
    aspect_ratio: '9:16',
    duration: 5,
  }
  if (startFrame) {
    params.medias = [{ data: { id: startFrame.id, url: startFrame.url, type: 'media_input' }, role: 'start_image' }]
  }

  const jobBody = { job_set_type: 'grok_video', params }
  console.log('[generate-video] job body:', JSON.stringify(jobBody).slice(0, 400))

  const createRes = await fetch(`${HIGGSFIELD_BASE}/agents/jobs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(jobBody),
  })
  if (!createRes.ok) throw new Error(`Higgsfield video create ${createRes.status}: ${(await createRes.text()).slice(0, 200)}`)

  const createRaw = await createRes.json()
  const firstItem = Array.isArray(createRaw) ? createRaw[0] : createRaw
  const jobId: string | undefined = typeof firstItem === 'string' ? firstItem : (firstItem?.id ?? firstItem?.job_id)
  if (!jobId) throw new Error(`Higgsfield: no job ID — raw: ${JSON.stringify(createRaw).slice(0, 200)}`)
  console.log(`[generate-video] grok_video job: ${jobId} | start_frame: ${startFrame?.id ?? 'none'}`)

  const deadline = Date.now() + 270_000  // 270s — fits inside Vercel's 300s maxDuration
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 8_000))
    const pollRes = await fetch(`${HIGGSFIELD_BASE}/agents/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    if (!pollRes.ok) continue
    const raw = await pollRes.json()
    const s = (Array.isArray(raw) ? raw[0] : raw) as { status?: string; result_url?: string; min_result_url?: string; error?: unknown }
    console.log(`[generate-video] job ${jobId}: ${s.status}`)
    if (['completed', 'done', 'succeeded'].includes(s.status ?? '')) {
      const videoUrl = s.result_url ?? s.min_result_url
      if (!videoUrl) throw new Error(`Higgsfield: no video URL — keys: ${Object.keys(s as object).join(', ')}`)
      return { videoUri: videoUrl, model: 'higgsfield/grok_video' }
    }
    if (['failed', 'error', 'cancelled'].includes(s.status ?? '')) {
      throw new Error(`Higgsfield job ${s.status}: ${JSON.stringify(s.error ?? '')}`)
    }
  }
  throw new Error('Higgsfield video timed out after 4.5 minutes')
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

// Fetch an image from a URL and return base64 + mime type
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mime: string } | undefined> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[generate-video] fetchImageAsBase64 ${res.status} for ${url.slice(0, 80)}`)
      return undefined
    }
    const buf = await res.arrayBuffer()
    const mime = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg'
    return { base64: Buffer.from(buf).toString('base64'), mime }
  } catch (err) {
    console.warn('[generate-video] fetchImageAsBase64 error:', err)
    return undefined
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, imageBase64: rawBase64, imageMime: rawMime, imageUrl, provider = 'google' } = await req.json() as {
      prompt: string
      imageBase64?: string
      imageMime?: string
      imageUrl?: string       // CDN URL for Higgsfield-hosted images (no base64 stored)
      provider?: 'higgsfield' | 'google'
    }
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    // Resolve image — prefer supplied base64, fall back to fetching CDN URL
    let imageBase64 = rawBase64
    let imageMime   = rawMime
    if ((!imageBase64 || imageBase64.length === 0) && imageUrl) {
      console.log(`[generate-video] No base64 — fetching start frame from CDN: ${imageUrl.slice(0, 80)}`)
      const fetched = await fetchImageAsBase64(imageUrl)
      if (fetched) { imageBase64 = fetched.base64; imageMime = fetched.mime }
    }

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