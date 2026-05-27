// Server-side only — reads/writes factory/data/sessions.json in GitHub
import type { GitHubSession } from './session-types'

const REPO      = 'dopostria/Claude'
const FILE_PATH = 'factory/data/sessions.json'
const BRANCH    = 'cantsleept-iso'

function ghHeaders() {
  const t = process.env.GITHUB_TOKEN
  if (!t) throw new Error('GITHUB_TOKEN not set')
  return {
    Authorization: `Bearer ${t}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export async function readSessions(): Promise<{ sessions: GitHubSession[]; sha: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
    { headers: ghHeaders(), cache: 'no-store' },
  )
  if (!res.ok) {
    if (res.status === 404) return { sessions: [], sha: '' }
    throw new Error(`GitHub read failed: ${res.status}`)
  }
  const data = await res.json() as { content: string; sha: string }
  const content = Buffer.from(data.content.replace(/\s/g, ''), 'base64').toString('utf8')
  const parsed = JSON.parse(content) as { sessions?: GitHubSession[] }
  return { sessions: parsed.sessions ?? [], sha: data.sha }
}

export async function upsertSession(session: GitHubSession): Promise<void> {
  const { sessions, sha } = await readSessions()

  const idx = sessions.findIndex(s => s.date === session.date)
  if (idx >= 0) sessions[idx] = session
  else sessions.push(session)

  // Sort newest-first, prune to 60
  sessions.sort((a, b) => b.date.localeCompare(a.date))
  const pruned = sessions.slice(0, 60)

  const newContent = Buffer.from(JSON.stringify({ sessions: pruned }, null, 2)).toString('base64')

  const body: Record<string, string> = {
    message: `chore: session ${session.date}`,
    content: newContent,
    branch: BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body) },
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(`GitHub write failed: ${res.status} ${err.message ?? ''}`)
  }
}
