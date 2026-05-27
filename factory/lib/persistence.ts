import type { Concept } from './types'

export interface PersistedImage {
  id: string
  conceptId: string
  base64: string
  mime: string
  prompt: string
  model: string
  timestamp: string
}

export interface PersistedVideo {
  uri: string
  model: string
  prompt: string
  timestamp: string
}

export interface PersistedDay {
  date: string
  concepts: Concept[]
  imagePrompts: Record<string, string>
  selectedConceptIds: string[]
  selectedImageId?: string | null
  images: PersistedImage[]
  videos: PersistedVideo[]
}

function key(date: string) { return `cantsleept_${date}` }

// Use LOCAL date (not UTC) — Bolivia is UTC-4; toISOString() gives
// "tomorrow" after 8 PM local time, causing save/load key mismatches.
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function loadDay(date: string): PersistedDay | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key(date))
    return raw ? (JSON.parse(raw) as PersistedDay) : null
  } catch { return null }
}

export function saveDay(day: PersistedDay): void {
  if (typeof window === 'undefined') return
  const k = key(day.date)
  const attempt = (data: PersistedDay) => {
    localStorage.setItem(k, JSON.stringify(data))
  }
  try {
    attempt(day)
  } catch {
    // Quota exceeded: strip images from OTHER days first to free space,
    // then retry saving today's full data (including today's images).
    try {
      for (const sk of Object.keys(localStorage)) {
        if (sk.startsWith('cantsleept_') && sk !== k) {
          const raw = localStorage.getItem(sk)
          if (raw) {
            try {
              const old = JSON.parse(raw) as PersistedDay
              if (old.images?.length > 0) {
                // Keep metadata (concepts/prompts/selection), strip images only
                localStorage.setItem(sk, JSON.stringify({ ...old, images: [] }))
              }
            } catch { localStorage.removeItem(sk) }
          }
        }
      }
      attempt(day) // retry after freeing space
    } catch {
      // Last resort: save today without images (concepts + prompts survive)
      const stripped = { ...day, images: [] }
      try { attempt(stripped) } catch { /* storage truly full — give up */ }
    }
  }
}

export function loadAllDays(): PersistedDay[] {
  if (typeof window === 'undefined') return []
  const days: PersistedDay[] = []
  for (const k of Object.keys(localStorage)) {
    if (!k.startsWith('cantsleept_')) continue
    try {
      const raw = localStorage.getItem(k)
      if (raw) days.push(JSON.parse(raw) as PersistedDay)
    } catch { /* skip corrupt entry */ }
  }
  return days.sort((a, b) => b.date.localeCompare(a.date))
}

export function patchToday(patch: Partial<Omit<PersistedDay, 'date'>>): PersistedDay {
  const date = todayStr()
  const base = loadDay(date) ?? {
    date, concepts: [], imagePrompts: {}, selectedConceptIds: [], images: [], videos: [],
  }
  const updated: PersistedDay = { ...base, ...patch, date }
  saveDay(updated)
  return updated
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