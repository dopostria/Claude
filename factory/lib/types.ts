export type RoomState = 'idle' | 'working' | 'done' | 'error'

export type ActiveOverlay = 'none' | 'ideas' | 'images' | 'video'

export type ConceptTag = 'Bolivia' | 'POP_CULTURE' | 'COTIDIANO'

export type ArchetypeId = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'A8' | 'A9' | 'A10'
export type PunchlineFormat = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6'

export interface QualityScore {
  F1_scroll_stop: boolean
  F2_punchline_clear: boolean
  F3_contrast_not_cruel: boolean
  F4_works_silent: boolean
  total: string
}

export interface Concept {
  id: string
  title: string
  archetype: ArchetypeId
  setup: string
  punchline_format: PunchlineFormat
  punchline: string
  tags: ConceptTag[]
  quality_score: QualityScore
  why_it_works: string
  humor_engine: string
  humor_score: string
  character: string
  setting: string
}

// Single unified image prompt — style is chosen by Claude per concept
export type ImagePrompts = string

export interface GeneratedImage {
  id: string
  concept_id: string
  tool: 'gemini' | 'higgsfield'
  path: string
  prompt: string
  timestamp: string
}

export interface GeneratedVideo {
  id: string
  image_id: string
  tool: 'gemini' | 'higgsfield'
  path: string
  prompt: string
  timestamp: string
}

export interface SessionEntry {
  timestamp: string
  type: 'concept_generated' | 'concept_selected' | 'image_generated' | 'image_selected' | 'video_generated'
  data: Record<string, unknown>
  tool?: string
  status: 'pending' | 'done' | 'error'
}

export interface UsedCombination {
  character: string
  setting: string
  concept_id: string
}

export interface SessionData {
  date: string
  concepts: Concept[]
  selected_concepts: string[]
  image_prompts: Record<string, string>
  generated_images: GeneratedImage[]
  selected_image_id: string | null
  generated_video: GeneratedVideo | null
  log: SessionEntry[]
  used_combinations: UsedCombination[]
}

export interface HistorySelection {
  date: string
  concept_id: string
  concept_title: string
  concept_setup: string
  concept_punchline: string
  tags: ConceptTag[]
  tool_used: string | null
  character?: string
}

export interface History {
  selections: HistorySelection[]
  generated: Array<{ date: string; count: number; titles: string[] }>
  lastUpdated: string | null
}

export interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'error' | 'working'
}

export interface FactoryState {
  rooms: {
    boss: RoomState
    ideas: RoomState
    images: RoomState
    video: RoomState
  }
  activeOverlay: ActiveOverlay
  session: SessionData | null
  sessionLog: LogEntry[]
  concepts: Concept[]
  selectedConceptIds: string[]
  imagePrompts: Record<string, string>
  videoPrompts: Record<string, string>
  generatedImages: GeneratedImage[]
  selectedImageId: string | null
  signal: { from: string; to: string } | null
}
