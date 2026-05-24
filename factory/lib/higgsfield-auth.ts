const AUTH_BASE = 'https://fnf-device-auth.higgsfield.ai'

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = process.env.HIGGSFIELD_REFRESH_TOKEN
  if (!refreshToken) return null

  try {
    const res = await fetch(`${AUTH_BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      console.warn(`[higgsfield-auth] /refresh returned ${res.status}`)
      return null
    }
    const data = await res.json() as { access_token?: string; expires_in?: number }
    if (!data.access_token) {
      console.warn('[higgsfield-auth] /refresh: no access_token in response')
      return null
    }
    cachedToken = data.access_token
    tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000
    console.log('[higgsfield-auth] Access token refreshed successfully')
    return cachedToken
  } catch (err) {
    console.warn('[higgsfield-auth] Refresh error:', err)
    return null
  }
}

export async function getHiggsfieldToken(forceRefresh = false): Promise<string> {
  const now = Date.now()

  if (!forceRefresh && cachedToken && now < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken
  }

  const refreshed = await refreshAccessToken()
  if (refreshed) return refreshed

  // Fall back to static env var
  const token = process.env.HIGGSFIELD_API_TOKEN
  if (!token) throw new Error('No Higgsfield token: set HIGGSFIELD_API_TOKEN or HIGGSFIELD_REFRESH_TOKEN')
  cachedToken = token
  tokenExpiresAt = now + 55 * 60 * 1000 // assume ~1h lifetime
  return token
}

export async function withHiggsfieldToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await getHiggsfieldToken()
  try {
    return await fn(token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('401') || msg.toLowerCase().includes('invalid or expired token')) {
      console.log('[higgsfield-auth] 401 detected — forcing token refresh')
      cachedToken = null
      tokenExpiresAt = 0
      const fresh = await getHiggsfieldToken(true)
      return await fn(fresh)
    }
    throw err
  }
}
