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
  images: PersistedImage[]
  videos: PersistedVideo[]
}

function key(date: string) { return `cantsleept_${date}` }

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
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
  const attempt = (data: PersistedDay) => {
    localStorage.setItem(key(data.date), JSON.stringify(data))
  }
  try {
    attempt(day)
  } catch {
    // quota: drop images until it fits, keep metadata
    const trimmed = { ...day, images: day.images.slice(-3) }
    try { attempt(trimmed) } catch { /* give up */ }
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
