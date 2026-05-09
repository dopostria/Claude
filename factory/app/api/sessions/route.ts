import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import {
  getOrCreateTodaySession,
  readSession,
  writeSession,
  getWeeklyStats,
  addHistorySelection,
  getTodayDate,
} from '@/lib/storage'
import { generateImagePrompts } from '@/lib/claude'
import type { HistorySelection } from '@/lib/types'

export async function GET() {
  try {
    const session = getOrCreateTodaySession()
    const stats = getWeeklyStats()
    return NextResponse.json({ session, stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'select_concepts') {
      const { concept_ids } = body as { concept_ids: string[] }
      const session = getOrCreateTodaySession()
      session.selected_concepts = concept_ids
      session.log.push({
        timestamp: new Date().toISOString(),
        type: 'concept_selected',
        data: { ids: concept_ids },
        status: 'done',
      })
      writeSession(session)

      // Generate image prompts for each selected concept
      const prompts: Record<string, { gemini: string; higgsfield: string }> = {}
      for (const id of concept_ids) {
        const concept = session.concepts.find(c => c.id === id)
        if (concept) {
          prompts[id] = await generateImagePrompts(concept)
        }
      }
      session.image_prompts = { ...session.image_prompts, ...prompts }
      writeSession(session)

      // Track selections in history
      const date = getTodayDate()
      for (const id of concept_ids) {
        const concept = session.concepts.find(c => c.id === id)
        if (concept) {
          const sel: HistorySelection = {
            date,
            concept_id: concept.id,
            concept_title: concept.title,
            concept_setup: concept.setup,
            concept_punchline: concept.punchline,
            tags: concept.tags,
            tool_used: null,
          }
          addHistorySelection(sel)
        }
      }

      return NextResponse.json({ success: true, prompts, session })
    }

    if (action === 'get_session') {
      const { date } = body as { date?: string }
      const session = date ? readSession(date) : getOrCreateTodaySession()
      return NextResponse.json({ session })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/sessions]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
