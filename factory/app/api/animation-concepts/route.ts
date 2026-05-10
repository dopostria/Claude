import { NextRequest, NextResponse } from 'next/server'
import { generateAnimationConcepts } from '@/lib/claude'
import type { Concept } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { concept, imagePrompt } = await req.json() as {
      concept: Concept
      imagePrompt: string
    }
    if (!concept) return NextResponse.json({ error: 'concept required' }, { status: 400 })

    const animations = await generateAnimationConcepts(concept, imagePrompt ?? '')
    return NextResponse.json({ success: true, animations })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/animation-concepts]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
