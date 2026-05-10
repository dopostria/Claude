export type RoomState = 'idle' | 'working' | 'done' | 'error'

export type ActiveOverlay = 'none' | 'ideas' | 'images' | 'video'

export type ConceptTag = 'Bolivia' | 'POP_CULTURE' | 'COTIDIANO'

export interface ConceptScores {
  scroll_stop: number
  no_explanation: number
  contrast_not_cruelty: number
  no_audio: number
  overall: number
}

export interface Concept {
  id: string
  title: string
  setup: string
  punchline: string
  scores: ConceptScores
  tags: ConceptTag[]
  improved: boolean
}

// Single unified image prompt — style is chosen by Claude per concept
export type ImagePrompts = string

export interface AnimationConcept {
  id: string
  name: string
  energy: 'subtle' | 'dynamic' | 'surreal'
  movement: string
  camera_direction: string
  video_prompt: string
}

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
  animation_concept_id: string
  tool: 'gemini' | 'higgsfield'
  path: string
  prompt: string
  timestamp: string
}

export interface SessionEntry {
  timestamp: string
  type: 'concept_generated' | 'concept_selected' | 'image_generated' | 'image_selected' | 'animation_selected' | 'video_generated'
  data: Record<string, unknown>
  tool?: string
  status: 'pending' | 'done' | 'error'
}

export interface SessionData {
  date: string
  concepts: Concept[]
  selected_concepts: string[]
  image_prompts: Record<string, string>
  generated_images: GeneratedImage[]
  selected_image_id: string | null
  animation_concepts: AnimationConcept[]
  selected_animation_id: string | null
  generated_video: GeneratedVideo | null
  log: SessionEntry[]
}

export interface HistorySelection {
  date: string
  concept_id: string
  concept_title: string
  concept_setup: string
  concept_punchline: string
  tags: ConceptTag[]
  tool_used: string | null
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
  animationConcepts: AnimationConcept[]
  selectedAnimationId: string | null
  signal: { from: string; to: string } | null
}
