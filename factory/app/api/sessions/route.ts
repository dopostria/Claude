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
import type { Concept, HistorySelection } from '@/lib/types'

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
      // Accept concepts directly in the body — avoids serverless /tmp isolation issues
      const { concept_ids, concepts: inlineConcepts } = body as {
        concept_ids: string[]
        concepts: Concept[]
      }

      // Generate image prompts using inline concepts (no storage read needed)
      const prompts: Record<string, { gemini: string; higgsfield: string }> = {}
      for (const id of concept_ids) {
        const concept = inlineConcepts?.find((c: Concept) => c.id === id)
        if (concept) {
          prompts[id] = await generateImagePrompts(concept)
        }
      }

      // Persist selection to history (best-effort, won't crash if fails)
      try {
        const date = getTodayDate()
        for (const id of concept_ids) {
          const concept = inlineConcepts?.find((c: Concept) => c.id === id)
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
      } catch { /* non-critical */ }

      return NextResponse.json({ success: true, prompts })
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
