import { NextResponse } from 'next/server'

export async function GET() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  const higgsfieldToken = process.env.HIGGSFIELD_API_TOKEN
  const higgsfieldRefresh = process.env.HIGGSFIELD_REFRESH_TOKEN

  const status = {
    ANTHROPIC_API_KEY: anthropicKey ? `✅ set (${anthropicKey.slice(0, 8)}...)` : '❌ MISSING',
    GEMINI_API_KEY: geminiKey ? `✅ set (${geminiKey.slice(0, 8)}...)` : '❌ MISSING',
    HIGGSFIELD_API_TOKEN: higgsfieldToken ? `✅ set (${higgsfieldToken.slice(0, 12)}...)` : '❌ MISSING',
    HIGGSFIELD_REFRESH_TOKEN: higgsfieldRefresh ? `✅ set (${higgsfieldRefresh.slice(0, 12)}...)` : '❌ MISSING',
    VERCEL: process.env.VERCEL ?? 'not set (local)',
    NODE_ENV: process.env.NODE_ENV,
  }

  const allOk = !!anthropicKey && !!geminiKey
  return NextResponse.json(status, { status: allOk ? 200 : 500 })
}
