import { NextResponse } from 'next/server'
import { generateConcepts } from '@/lib/claude'
import { readBrandContext, getRecentSelections, getTodayDate, getOrCreateTodaySession, writeSession } from '@/lib/storage'

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no está configurada en Vercel → Settings → Environment Variables' }, { status: 500 })
  }

  try {
    let additionalContext: string | undefined
    try {
      const body = await req.json()
      additionalContext = body?.additionalContext ?? undefined
    } catch { /* body empty — fine */ }

    const brandContext = readBrandContext()
    const recentHistory = getRecentSelections(7)
    const date = getTodayDate()

    const concepts = await generateConcepts(brandContext, recentHistory, date, additionalContext)

    const session = getOrCreateTodaySession()
    session.concepts = concepts
    session.used_combinations = concepts
      .filter(c => c.character && c.setting)
      .map(c => ({ character: c.character.toLowerCase(), setting: c.setting.toLowerCase(), concept_id: c.id }))
    session.log.push({
      timestamp: new Date().toISOString(),
      type: 'concept_generated',
      data: { count: concepts.length },
      status: 'done',
    })
    writeSession(session)

    return NextResponse.json({ concepts, date })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/ideas]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
