import { NextResponse } from 'next/server'

export async function GET() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  const higgsfieldToken = process.env.HIGGSFIELD_API_TOKEN
  const higgsfieldRefresh = process.env.HIGGSFIELD_REFRESH_TOKEN
  const githubToken = process.env.GITHUB_TOKEN

  // Test GitHub write access by doing a dry-run read (just check token is present)
  let githubStatus = '❌ MISSING'
  if (githubToken) {
    try {
      const r = await fetch(
        'https://api.github.com/repos/dopostria/Claude/contents/factory/data/sessions.json?ref=cantsleept-iso',
        { headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' }, cache: 'no-store' }
      )
      githubStatus = r.ok ? `✅ read OK (${githubToken.slice(0, 8)}...)` : `⚠️ read ${r.status} (${githubToken.slice(0, 8)}...)`
    } catch {
      githubStatus = `⚠️ network error (${githubToken.slice(0, 8)}...)`
    }
  }

  const status = {
    ANTHROPIC_API_KEY: anthropicKey ? `✅ set (${anthropicKey.slice(0, 8)}...)` : '❌ MISSING',
    GEMINI_API_KEY: geminiKey ? `✅ set (${geminiKey.slice(0, 8)}...)` : '❌ MISSING',
    HIGGSFIELD_API_TOKEN: higgsfieldToken ? `✅ set (${higgsfieldToken.slice(0, 12)}...)` : '❌ MISSING',
    HIGGSFIELD_REFRESH_TOKEN: higgsfieldRefresh ? `✅ set (${higgsfieldRefresh.slice(0, 12)}...)` : '❌ MISSING',
    GITHUB_TOKEN: githubStatus,
    VERCEL: process.env.VERCEL ?? 'not set (local)',
    NODE_ENV: process.env.NODE_ENV,
  }

  const allOk = !!anthropicKey && !!geminiKey
  return NextResponse.json(status, { status: allOk ? 200 : 500 })
}
