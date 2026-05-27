// localStorage persistence layer.
// Images:  cantsleept_img_YYYY-MM-DD
// Session: cantsleept_session_YYYY-MM-DD  (concepts, prompts, videos)
//          Fallback when GitHub writes fail (403 / token issue).
//          GitHub is still attempted first on save and always tried first on load.

import type { Concept } from './types'

export interface PersistedImage {
  id: string
  conceptId: string
  base64: string
  mime: string
  prompt: string
  model: string
  timestamp: string
  url?: string   // CDN URL for provider-hosted images (Higgsfield); no base64 needed when set
}

export interface PersistedVideo {
  uri: string
  model: string
  prompt: string
  timestamp: string
}

export interface PersistedSession {
  date: string
  concepts: Concept[]
  selectedConceptIds: string[]
  imagePrompts: Record<string, string>
  videoPrompts: Record<string, string>
  videos: PersistedVideo[]
}

// Use LOCAL date (Bolivia = UTC-4; toISOString() gives "tomorrow" after 8 PM local)
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function imgKey(date: string)     { return `cantsleept_img_${date}` }
function sessionKey(date: string) { return `cantsleept_session_${date}` }

export function saveImages(date: string, images: PersistedImage[]): void {
  if (typeof window === 'undefined') return
  const k = imgKey(date)
  try {
    localStorage.setItem(k, JSON.stringify(images))
  } catch {
    // Quota: remove other days' image keys first, then retry
    try {
      for (const sk of Object.keys(localStorage)) {
        if (sk.startsWith('cantsleept_img_') && sk !== k) localStorage.removeItem(sk)
      }
      localStorage.setItem(k, JSON.stringify(images))
    } catch { /* truly full */ }
  }
}

export function loadImages(date: string): PersistedImage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(imgKey(date))
    return raw ? (JSON.parse(raw) as PersistedImage[]) : []
  } catch { return [] }
}

export function triggerDownload(base64: string, mime: string, filename: string): void {
  if (typeof window === 'undefined') return
  const a = document.createElement('a')
  a.href = `data:${mime};base64,${base64}`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Session persistence (concepts + prompts + videos) ──────────────────────
// Written synchronously on every state change; acts as fallback when
// GitHub writes fail (e.g. GITHUB_TOKEN has read-only scope).

export function saveLocalSession(session: PersistedSession): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(sessionKey(session.date), JSON.stringify(session))
  } catch { /* quota — not critical, images take priority */ }
}

export function loadLocalSession(date: string): PersistedSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(sessionKey(date))
    if (!raw) return null
    return JSON.parse(raw) as PersistedSession
  } catch { return null }
}
