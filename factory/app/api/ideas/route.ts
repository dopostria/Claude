import { NextResponse } from 'next/server'
import { generateConcepts } from '@/lib/claude'
import { readBrandContext, getRecentSelections, getTodayDate, getOrCreateTodaySession, writeSession } from '@/lib/storage'

export async function POST() {
  try {
    const brandContext = readBrandContext()
    const recentHistory = getRecentSelections(7)
    const date = getTodayDate()

    const concepts = await generateConcepts(brandContext, recentHistory, date)

    const session = getOrCreateTodaySession()
    session.concepts = concepts
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
