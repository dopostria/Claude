import { NextResponse } from 'next/server'
import { fetchAndSaveTrends } from '@/lib/trending'

export async function POST() {
  try {
    const feed = await fetchAndSaveTrends()
    return NextResponse.json({ success: true, count: feed.trends.length, last_updated: feed.last_updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/trends]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
