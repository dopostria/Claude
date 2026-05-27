import type { Concept } from './types'

export interface GitHubSession {
  date: string           // YYYY-MM-DD
  savedAt: string        // ISO timestamp
  concepts: Concept[]
  selectedConceptIds: string[]
  imagePrompts: Record<string, string>
  videoPrompts: Record<string, string>
  videos: Array<{ uri: string; model: string; prompt: string; timestamp: string }>
}
