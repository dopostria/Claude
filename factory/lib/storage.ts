import fs from 'fs'
import path from 'path'
import type { SessionData, History, HistorySelection, UsedCombination } from './types'
import BRAND_CONTEXT from '../data/brand_context.json'

// On Vercel, cwd() is read-only — use /tmp for mutable data
const IS_VERCEL = process.env.VERCEL === '1'
const MUTABLE_DIR = IS_VERCEL ? '/tmp/factory-data' : path.join(process.cwd(), 'data')
const HISTORY_PATH = path.join(MUTABLE_DIR, 'history.json')
const SESSIONS_DIR = path.join(MUTABLE_DIR, 'sessions')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function readBrandContext(): Record<string, unknown> {
  return BRAND_CONTEXT as Record<string, unknown>
}

export function readHistory(): History {
  try {
    if (!fs.existsSync(HISTORY_PATH)) {
      return { selections: [], generated: [], lastUpdated: null }
    }
    const raw = fs.readFileSync(HISTORY_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { selections: [], generated: [], lastUpdated: null }
  }
}

export function writeHistory(history: History): void {
  try {
    ensureDir(MUTABLE_DIR)
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8')
  } catch { /* silent on read-only fs */ }
}

export function addHistorySelection(selection: HistorySelection): void {
  const history = readHistory()
  history.selections.unshift(selection)
  if (history.selections.length > 200) history.selections = history.selections.slice(0, 200)
  history.lastUpdated = new Date().toISOString()
  writeHistory(history)
}

export function getRecentSelections(days = 7): HistorySelection[] {
  const history = readHistory()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return history.selections.filter(s => new Date(s.date) >= cutoff)
}

export function readSession(date: string): SessionData | null {
  try {
    const sessionPath = path.join(SESSIONS_DIR, `${date}.json`)
    if (!fs.existsSync(sessionPath)) return null
    const raw = fs.readFileSync(sessionPath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function writeSession(session: SessionData): void {
  try {
    ensureDir(SESSIONS_DIR)
    const sessionPath = path.join(SESSIONS_DIR, `${session.date}.json`)
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), 'utf-8')
  } catch { /* silent on read-only fs */ }
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function getOrCreateTodaySession(): SessionData {
  const date = getTodayDate()
  const existing = readSession(date)
  if (existing) return existing
  const fresh: SessionData = {
    date,
    concepts: [],
    selected_concepts: [],
    image_prompts: {},
    generated_images: [],
    selected_image_id: null,
    generated_video: null,
    log: [],
    used_combinations: [],
  }
  writeSession(fresh)
  return fresh
}

export function getTodayUsedCombinations(): UsedCombination[] {
  const date = getTodayDate()
  const session = readSession(date)
  return session?.used_combinations ?? []
}

export function getWeeklyStats(): { postsThisWeek: number; avgScore: number; lastConceptTitle: string | null } {
  const history = readHistory()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const thisWeek = history.selections.filter(s => new Date(s.date) >= cutoff)
  return {
    postsThisWeek: thisWeek.length,
    avgScore: 0,
    lastConceptTitle: history.selections[0]?.concept_title ?? null,
  }
}