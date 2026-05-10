import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const uri = req.nextUrl.searchParams.get('uri')
  if (!uri) return NextResponse.json({ error: 'uri required' }, { status: 400 })

  // Only proxy Google API URIs
  if (!uri.startsWith('https://generativelanguage.googleapis.com/')) {
    return NextResponse.json({ error: 'Invalid URI' }, { status: 403 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })

  const res = await fetch(uri, { headers: { 'x-goog-api-key': apiKey } })
  if (!res.ok) return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status })

  const contentType = res.headers.get('Content-Type') ?? 'video/mp4'
  const download = req.nextUrl.searchParams.get('download')

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': download ? 'attachment; filename="video.mp4"' : 'inline',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
