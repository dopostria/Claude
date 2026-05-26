// lib/higgsfield-auth.ts
//
// Self-healing Higgsfield token management for Vercel serverless.
//
// Key facts (confirmed by live test):
//   - access_token  TTL: 3600s (1 hour)
//   - refresh_token TTL: 604800s (7 days), SINGLE-USE (rotates on every /refresh call)
//
// Architecture:
//   1. In-memory cache       — fast path for same-container requests
//   2. HIGGSFIELD_TOKEN_EXPIRES_AT env var — lets cold starts skip /refresh
//                              when the current access token is still valid
//   3. /refresh on expiry    — gets new access_token + new refresh_token
//   4. Vercel persistence    — writes new tokens + expires_at to Vercel env vars
//                              and triggers a redeploy so future cold starts
//                              bake in the fresh tokens (fire-and-forget)
//
// Required env vars:
//   HIGGSFIELD_REFRESH_TOKEN     — set in Vercel (7-day token, hfr_ prefix)
//   HIGGSFIELD_API_TOKEN         — set in Vercel (1-hour token, hf_ prefix)
//   VERCEL_TOKEN                 — personal Vercel API token
//   HIGGSFIELD_TOKEN_EXPIRES_AT  — created automatically on first refresh
//
// Auto-injected by Vercel (no action needed):
//   VERCEL_DEPLOYMENT_ID         — used to locate the project via Vercel API

const AUTH_BASE = 'https://fnf-device-auth.higgsfield.ai'
const VERCEL_API = 'https://api.vercel.com'

// ── In-memory cache (per container) ─────────────────────────────────────────

let cachedToken: string | null = null
let tokenExpiresAt = 0 // ms timestamp

// ── Types ────────────────────────────────────────────────────────────────────

interface RefreshResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  refresh_expires_in?: number
}

interface VercelEnvEntry {
  id: string
  key: string
}

// ── Core: call /refresh ───────────────────────────────────────────────────────

async function doRefresh(): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
} | null> {
  const refreshToken = process.env.HIGGSFIELD_REFRESH_TOKEN
  if (!refreshToken) {
    console.warn('[higgsfield-auth] HIGGSFIELD_REFRESH_TOKEN not set')
    return null
  }

  try {
    const res = await fetch(`${AUTH_BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`[higgsfield-auth] /refresh returned ${res.status}: ${body.slice(0, 200)}`)
      return null
    }

    const data = await res.json() as RefreshResponse

    if (!data.access_token) {
      console.warn('[higgsfield-auth] /refresh: no access_token in response')
      return null
    }

    return {
      accessToken: data.access_token,
      // Use the new refresh_token if returned; fall back to the one we sent.
      // (Higgsfield rotates on every call, so new one is always present.)
      refreshToken: data.refresh_token ?? refreshToken,
      expiresIn: data.expires_in ?? 3600,
    }
  } catch (err) {
    console.warn('[higgsfield-auth] /refresh network error:', err)
    return null
  }
}

// ── Check if the env-var token is still fresh ─────────────────────────────────
// HIGGSFIELD_TOKEN_EXPIRES_AT is a Unix epoch (seconds) written by this module
// after each successful refresh. Cold starts read it to decide whether to skip
// calling /refresh (preventing unnecessary rotation collisions).

function envTokenIsValid(): boolean {
  const raw = process.env.HIGGSFIELD_TOKEN_EXPIRES_AT
  if (!raw) return false
  const expiresAtMs = parseInt(raw, 10) * 1000
  if (isNaN(expiresAtMs)) return false
  // 5-minute safety buffer so we refresh before expiry, not after
  return Date.now() < expiresAtMs - 5 * 60 * 1000
}

// ── Vercel persistence (fire-and-forget) ─────────────────────────────────────
// Writes new tokens + expiry timestamp to Vercel env vars, then triggers a
// redeploy so the next generation of cold starts bakes in the fresh values.
// All failures are logged but never propagate — this is purely best-effort.

async function persistToVercel(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const vercelToken = process.env.VERCEL_TOKEN
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID // auto-injected by Vercel

  if (!vercelToken) {
    console.log('[higgsfield-auth] VERCEL_TOKEN not set — skipping env var update')
    return
  }
  if (!deploymentId) {
    console.log('[higgsfield-auth] VERCEL_DEPLOYMENT_ID not set (local dev?) — skipping env var update')
    return
  }

  try {
    // Step 1: Derive project ID from current deployment
    const deployRes = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    })
    if (!deployRes.ok) {
      console.warn(`[higgsfield-auth] Could not fetch deployment info (${deployRes.status})`)
      return
    }
    const { projectId } = await deployRes.json() as { projectId: string }
    if (!projectId) {
      console.warn('[higgsfield-auth] No projectId in deployment response')
      return
    }

    // Step 2: Fetch existing env var list to get their IDs
    const envsRes = await fetch(`${VERCEL_API}/v9/projects/${projectId}/env`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    })
    if (!envsRes.ok) {
      console.warn(`[higgsfield-auth] Could not list env vars (${envsRes.status})`)
      return
    }
    const { envs } = await envsRes.json() as { envs: VercelEnvEntry[] }

    const expiresAtValue = String(Math.floor(Date.now() / 1000) + expiresIn)

    const toUpdate: Record<string, string> = {
      HIGGSFIELD_API_TOKEN: accessToken,
      HIGGSFIELD_REFRESH_TOKEN: refreshToken,
      HIGGSFIELD_TOKEN_EXPIRES_AT: expiresAtValue,
    }

    const existingKeys = new Set(envs.map(e => e.key))
    const patchOps: Promise<void>[] = []
    const createVars: Array<{ key: string; value: string; type: string; target: string[] }> = []

    for (const [key, value] of Object.entries(toUpdate)) {
      const entry = envs.find(e => e.key === key)
      if (entry) {
        // PATCH existing env var by its Vercel ID
        patchOps.push(
          fetch(`${VERCEL_API}/v9/projects/${projectId}/env/${entry.id}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value }),
          }).then(r => {
            if (r.ok) {
              console.log(`[higgsfield-auth] ✓ Updated ${key} in Vercel`)
            } else {
              console.warn(`[higgsfield-auth] Failed to update ${key}: ${r.status}`)
            }
          })
        )
      } else if (!existingKeys.has(key)) {
        // POST new env var (only for HIGGSFIELD_TOKEN_EXPIRES_AT on first run)
        createVars.push({
          key,
          value,
          type: key === 'HIGGSFIELD_TOKEN_EXPIRES_AT' ? 'plain' : 'encrypted',
          target: ['production', 'preview', 'development'],
        })
      }
    }

    await Promise.all(patchOps)

    if (createVars.length > 0) {
      const createRes = await fetch(`${VERCEL_API}/v10/projects/${projectId}/env`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createVars),
      })
      if (createRes.ok) {
        console.log(`[higgsfield-auth] ✓ Created new env vars: ${createVars.map(v => v.key).join(', ')}`)
      } else {
        const err = await createRes.text().catch(() => '')
        console.warn(`[higgsfield-auth] Failed to create env vars: ${createRes.status} ${err.slice(0, 100)}`)
      }
    }

    // Step 3: Trigger a Vercel redeploy so next cold starts use the new env vars
    // Uses the current deployment as the source — same code, new env vars baked in.
    const redeployRes = await fetch(`${VERCEL_API}/v13/deployments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deploymentId,
        name: 'cantsleept-factory',
        target: 'production',
      }),
    })

    if (redeployRes.ok) {
      const { id: newDeployId } = await redeployRes.json() as { id?: string }
      console.log(`[higgsfield-auth] ✓ Vercel redeploy triggered (${newDeployId ?? 'queued'}) — new tokens active in ~60s`)
    } else {
      const body = await redeployRes.text().catch(() => '')
      console.warn(`[higgsfield-auth] Redeploy request failed (${redeployRes.status}): ${body.slice(0, 150)}`)
      console.log('[higgsfield-auth] Tokens were written to Vercel env vars. Redeploy manually to activate them.')
    }
  } catch (err) {
    console.warn('[higgsfield-auth] Vercel persistence error (non-fatal):', err)
  }
}

// ── Public: getHiggsfieldToken ────────────────────────────────────────────────

export async function getHiggsfieldToken(forceRefresh = false): Promise<string> {
  const now = Date.now()

  // 1. In-memory cache — fastest path, same container
  if (!forceRefresh && cachedToken && now < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken
  }

  // 2. Env token still valid per HIGGSFIELD_TOKEN_EXPIRES_AT timestamp —
  //    skip /refresh to avoid burning the refresh token unnecessarily.
  //    This is the key guard against multi-container rotation collisions.
  if (!forceRefresh && envTokenIsValid()) {
    const staticToken = process.env.HIGGSFIELD_API_TOKEN
    if (staticToken) {
      cachedToken = staticToken
      tokenExpiresAt = parseInt(process.env.HIGGSFIELD_TOKEN_EXPIRES_AT!, 10) * 1000
      console.log('[higgsfield-auth] Env token is valid — skipping refresh')
      return staticToken
    }
  }

  // 3. Refresh needed
  console.log('[higgsfield-auth] Refreshing Higgsfield token...')
  const refreshed = await doRefresh()

  if (refreshed) {
    cachedToken = refreshed.accessToken
    tokenExpiresAt = now + refreshed.expiresIn * 1000
    console.log(`[higgsfield-auth] ✓ Token refreshed (expires in ${refreshed.expiresIn}s)`)

    // Write new tokens back to Vercel and redeploy — non-blocking
    persistToVercel(
      refreshed.accessToken,
      refreshed.refreshToken,
      refreshed.expiresIn
    ).catch(() => {})

    return cachedToken
  }

  // 4. Fallback — use whatever is in HIGGSFIELD_API_TOKEN (may be expired)
  const staticToken = process.env.HIGGSFIELD_API_TOKEN
  if (!staticToken) {
    throw new Error(
      'No Higgsfield token available. ' +
      'Set HIGGSFIELD_REFRESH_TOKEN (and VERCEL_TOKEN for auto-rotation) ' +
      'or manually update HIGGSFIELD_API_TOKEN in Vercel env vars.'
    )
  }

  console.warn('[higgsfield-auth] Refresh failed — using HIGGSFIELD_API_TOKEN as fallback (may be expired)')
  cachedToken = staticToken
  tokenExpiresAt = now + 3600 * 1000
  return staticToken
}

// ── Public: withHiggsfieldToken ───────────────────────────────────────────────

export async function withHiggsfieldToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await getHiggsfieldToken()
  try {
    return await fn(token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isAuthError =
      msg.includes('401') ||
      msg.includes('403') ||
      msg.toLowerCase().includes('invalid') ||
      msg.toLowerCase().includes('expired') ||
      msg.toLowerCase().includes('unauthorized')

    if (isAuthError) {
      console.log('[higgsfield-auth] Auth error detected — forcing token refresh and retrying once')
      cachedToken = null
      tokenExpiresAt = 0
      const fresh = await getHiggsfieldToken(true)
      return await fn(fresh)
    }
    throw err
  }
}
