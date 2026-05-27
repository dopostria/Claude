import { NextResponse } from 'next/server'
import { readSessions, upsertSession } from '@/lib/github-storage'
import type { GitHubSession } from '@/lib/session-types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { sessions } = await readSessions()
    return NextResponse.json({ sessions })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({ error: msg, sessions: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { session: GitHubSession }
    if (!body.session?.date) {
      return NextResponse.json({ error: 'Missing session.date' }, { status: 400 })
    }
    await upsertSession(body.session)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
