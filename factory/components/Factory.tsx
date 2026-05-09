'use client'

import { useState, useCallback, useEffect } from 'react'
import StarBackground from './StarBackground'
import Sidebar from './Sidebar'
import BossRoom from './rooms/BossRoom'
import IdeasRoom from './rooms/IdeasRoom'
import { ImagesRoom, VideoRoom } from './rooms/IdeasRoom'
import IdeasOverlay from './overlays/IdeasOverlay'
import type {
  FactoryState,
  Concept,
  ImagePrompts,
  LogEntry,
  RoomState,
} from '@/lib/types'

function now(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

function log(state: FactoryState, message: string, type: LogEntry['type']): LogEntry[] {
  return [...state.sessionLog, { time: now(), message, type }]
}

const INITIAL_STATE: FactoryState = {
  rooms: { boss: 'idle', ideas: 'idle', images: 'idle', video: 'idle' },
  activeOverlay: 'none',
  session: null,
  sessionLog: [],
  concepts: [],
  selectedConceptIds: [],
  imagePrompts: {},
  generatedImages: [],
  selectedImageId: null,
  animationConcepts: [],
  selectedAnimationId: null,
  signal: null,
}

export default function Factory() {
  const [state, setState] = useState<FactoryState>(INITIAL_STATE)
  const [stats, setStats] = useState({ postsThisWeek: 0, lastConceptTitle: null as string | null })
  const [generating, setGenerating] = useState(false)
  const [processingPrompts, setProcessingPrompts] = useState(false)

  // Load session stats on mount
  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(({ stats: s }) => {
        if (s) setStats({ postsThisWeek: s.postsThisWeek, lastConceptTitle: s.lastConceptTitle })
      })
      .catch(() => {})
  }, [])

  // ── Signal animation helper ──────────────────────────────────────────
  const fireSignal = useCallback((from: string, to: string) => {
    setState(s => ({ ...s, signal: { from, to } }))
    setTimeout(() => setState(s => ({ ...s, signal: null })), 1400)
  }, [])

  // ── Set room state helper ────────────────────────────────────────────
  const setRoom = useCallback((room: keyof FactoryState['rooms'], roomState: RoomState) => {
    setState(s => ({
      ...s,
      rooms: { ...s.rooms, [room]: roomState },
    }))
  }, [])

  // ── NODO 1: Generate concepts ────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (generating) return
    setGenerating(true)

    setState(s => ({
      ...s,
      rooms: { ...s.rooms, boss: 'working', ideas: 'working' },
      sessionLog: [...s.sessionLog, {
        time: now(),
        message: 'Generating today\'s concepts...',
        type: 'working',
      }],
    }))

    fireSignal('boss', 'ideas')

    try {
      const res = await fetch('/api/ideas', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const { concepts }: { concepts: Concept[] } = await res.json()

      setState(s => ({
        ...s,
        concepts,
        rooms: { ...s.rooms, boss: 'done', ideas: 'done' },
        activeOverlay: 'ideas',
        sessionLog: [...s.sessionLog, {
          time: now(),
          message: `${concepts.length} concepts generated!`,
          type: 'success',
        }],
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({
        ...s,
        rooms: { ...s.rooms, boss: 'error', ideas: 'error' },
        sessionLog: [...s.sessionLog, {
          time: now(),
          message: `Error: ${msg}`,
          type: 'error',
        }],
      }))
    } finally {
      setGenerating(false)
    }
  }, [generating, fireSignal])

  // ── Select/deselect a concept ────────────────────────────────────────
  const handleSelectConcept = useCallback((id: string) => {
    setState(s => {
      const already = s.selectedConceptIds.includes(id)
      return {
        ...s,
        selectedConceptIds: already
          ? s.selectedConceptIds.filter(x => x !== id)
          : [...s.selectedConceptIds, id],
      }
    })
  }, [])

  // ── Confirm selection + generate image prompts (Nodo 2) ──────────────
  const handleConfirmSelection = useCallback(async () => {
    const ids = state.selectedConceptIds
    if (ids.length === 0 || processingPrompts) return

    setProcessingPrompts(true)
    setState(s => ({
      ...s,
      rooms: { ...s.rooms, ideas: 'working' },
      sessionLog: [...s.sessionLog, {
        time: now(),
        message: `Generating image prompts for ${ids.length} concepts...`,
        type: 'working',
      }],
    }))

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'select_concepts', concept_ids: ids }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const { prompts }: { prompts: Record<string, ImagePrompts> } = await res.json()

      setState(s => ({
        ...s,
        imagePrompts: { ...s.imagePrompts, ...prompts },
        rooms: { ...s.rooms, ideas: 'done' },
        sessionLog: [...s.sessionLog, {
          time: now(),
          message: 'Image prompts ready! Select a tool.',
          type: 'success',
        }],
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({
        ...s,
        rooms: { ...s.rooms, ideas: 'error' },
        sessionLog: [...s.sessionLog, {
          time: now(),
          message: `Prompt error: ${msg}`,
          type: 'error',
        }],
      }))
    } finally {
      setProcessingPrompts(false)
    }
  }, [state.selectedConceptIds, processingPrompts])

  // ── Close overlay ────────────────────────────────────────────────────
  const handleCloseOverlay = useCallback(() => {
    setState(s => ({ ...s, activeOverlay: 'none' }))
  }, [])

  // ── Open overlay ─────────────────────────────────────────────────────
  const handleOpenIdeas = useCallback(() => {
    if (state.concepts.length > 0) {
      setState(s => ({ ...s, activeOverlay: 'ideas' }))
    }
  }, [state.concepts.length])

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1,
    }}>
      <StarBackground />

      {/* Signal animation layer */}
      {state.signal && (
        <SignalLine signal={state.signal} />
      )}

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 12,
        overflow: 'hidden',
        minWidth: 0,
      }}>
        {/* Top label */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 2,
        }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            color: '#222',
            letterSpacing: 3,
          }}>
            ✦ CANTSLEEPT CONTENT FACTORY ✦
          </div>
        </div>

        {/* BOSS ROOM — full width */}
        <BossRoom
          state={state.rooms.boss}
          postsThisWeek={stats.postsThisWeek}
          lastConceptTitle={stats.lastConceptTitle}
          onGenerate={handleGenerate}
          generating={generating}
        />

        {/* Bottom 3 rooms */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '5fr 4fr 3fr',
          gap: 6,
          flex: 1,
          minHeight: 0,
        }}>
          <IdeasRoom
            state={state.rooms.ideas}
            conceptCount={state.concepts.length}
            selectedCount={state.selectedConceptIds.length}
            onClick={handleOpenIdeas}
          />
          <ImagesRoom
            state={state.rooms.images}
            imageCount={state.generatedImages.length}
            onClick={() => {}}
          />
          <VideoRoom
            state={state.rooms.video}
            videoReady={!!state.session?.generated_video}
            onClick={() => {}}
          />
        </div>

        {/* Floor label */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          paddingBottom: 4,
        }}>
          {(['SALA IDEAS', 'SALA IMÁGENES', 'SALA VIDEO'] as const).map(label => (
            <div key={label} style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 5,
              color: '#1a1a2e',
              letterSpacing: 2,
            }}>{label}</div>
          ))}
        </div>
      </div>

      {/* Right sidebar */}
      <Sidebar log={state.sessionLog} />

      {/* Overlays */}
      {state.activeOverlay === 'ideas' && state.concepts.length > 0 && (
        <IdeasOverlay
          concepts={state.concepts}
          selectedIds={state.selectedConceptIds}
          imagePrompts={state.imagePrompts}
          onSelectConcept={handleSelectConcept}
          onConfirmSelection={handleConfirmSelection}
          onClose={handleCloseOverlay}
          processingPrompts={processingPrompts}
        />
      )}
    </div>
  )
}

// ── Signal animation component ────────────────────────────────────────

function SignalLine({ signal }: { signal: { from: string; to: string } }) {
  const positions: Record<string, { x: string; y: string }> = {
    boss: { x: '30%', y: '18%' },
    ideas: { x: '20%', y: '65%' },
    images: { x: '55%', y: '65%' },
    video: { x: '78%', y: '65%' },
  }

  const from = positions[signal.from]
  const to = positions[signal.to]
  if (!from || !to) return null

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 20,
    }}>
      <svg
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#00ff88"
          strokeWidth="0.3"
          strokeDasharray="1,1"
          opacity="0.6"
        />
      </svg>

      {/* Traveling dot */}
      <div
        className="signal-dot"
        style={{
          left: to.x,
          top: to.y,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  )
}
