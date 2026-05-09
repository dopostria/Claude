import fs from 'fs'
import path from 'path'
import type { SessionData, History, HistorySelection } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
const HISTORY_PATH = path.join(DATA_DIR, 'history.json')
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions')
const BRAND_CONTEXT_PATH = path.join(DATA_DIR, 'brand_context.json')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export function readBrandContext(): Record<string, unknown> {
  const raw = fs.readFileSync(BRAND_CONTEXT_PATH, 'utf-8')
  return JSON.parse(raw)
}

export function readHistory(): History {
  if (!fs.existsSync(HISTORY_PATH)) {
    return { selections: [], generated: [], lastUpdated: null }
  }
  const raw = fs.readFileSync(HISTORY_PATH, 'utf-8')
  return JSON.parse(raw)
}

export function writeHistory(history: History): void {
  ensureDir(DATA_DIR)
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8')
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
  const sessionPath = path.join(SESSIONS_DIR, `${date}.json`)
  if (!fs.existsSync(sessionPath)) return null
  const raw = fs.readFileSync(sessionPath, 'utf-8')
  return JSON.parse(raw)
}

export function writeSession(session: SessionData): void {
  ensureDir(SESSIONS_DIR)
  const sessionPath = path.join(SESSIONS_DIR, `${session.date}.json`)
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), 'utf-8')
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
    animation_concepts: [],
    selected_animation_id: null,
    generated_video: null,
    log: [],
  }
  writeSession(fresh)
  return fresh
}

export function getWeeklyStats(): { postsThisWeek: number; avgScore: number; lastConceptTitle: string | null } {
  const history = readHistory()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const thisWeek = history.selections.filter(s => new Date(s.date) >= cutoff)
  const postsThisWeek = thisWeek.length
  const avgScore = 0
  const lastConceptTitle = history.selections[0]?.concept_title ?? null
  return { postsThisWeek, avgScore, lastConceptTitle }
}
