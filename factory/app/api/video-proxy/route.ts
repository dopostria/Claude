import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const uri = req.nextUrl.searchParams.get('uri')
  if (!uri) return NextResponse.json({ error: 'uri required' }, { status: 400 })

  if (!uri.startsWith('https://generativelanguage.googleapis.com/')) {
    return NextResponse.json({ error: 'Invalid URI' }, { status: 403 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })

  // Forward Range header so <video> seeking works
  const upstreamHeaders: Record<string, string> = { 'x-goog-api-key': apiKey }
  const range = req.headers.get('range')
  if (range) upstreamHeaders['range'] = range

  const res = await fetch(uri, { headers: upstreamHeaders })
  if (!res.ok && res.status !== 206) {
    return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status })
  }

  const contentType = res.headers.get('Content-Type') ?? 'video/mp4'
  const download = req.nextUrl.searchParams.get('download')

  const responseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
    'Content-Disposition': download ? 'attachment; filename="cantsleept-video.mp4"' : 'inline',
  }
  // Forward range-related headers from upstream
  const contentRange = res.headers.get('Content-Range')
  if (contentRange) responseHeaders['Content-Range'] = contentRange
  const contentLength = res.headers.get('Content-Length')
  if (contentLength) responseHeaders['Content-Length'] = contentLength

  return new NextResponse(res.body, { status: res.status, headers: responseHeaders })
}
