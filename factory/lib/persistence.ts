// Images-only localStorage layer.
// Concepts, prompts, and videos are stored in GitHub via /api/history.
// Key: cantsleept_img_YYYY-MM-DD

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

// Use LOCAL date (Bolivia = UTC-4; toISOString() gives "tomorrow" after 8 PM local)
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function imgKey(date: string) { return `cantsleept_img_${date}` }

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
