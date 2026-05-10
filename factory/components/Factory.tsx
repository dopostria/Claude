'use client'

import { useState, useCallback, useEffect } from 'react'
import StarBackground from './StarBackground'
import Sidebar from './Sidebar'
import BossRoom from './rooms/BossRoom'
import IdeasRoom from './rooms/IdeasRoom'
import { ImagesRoom, VideoRoom } from './rooms/IdeasRoom'
import IdeasOverlay from './overlays/IdeasOverlay'
import ImagesOverlay from './overlays/ImagesOverlay'
import type {
  FactoryState,
  Concept,
  ImagePrompts,
  RoomState,
} from '@/lib/types'

interface GeneratedImage {
  id: string
  conceptId: string
  tool: string
  imagePath: string
  base64: string
  mime: string
  prompt: string
  timestamp: string
}

function now(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
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
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(({ stats: s }) => {
        if (s) setStats({ postsThisWeek: s.postsThisWeek, lastConceptTitle: s.lastConceptTitle })
      })
      .catch(() => {})
  }, [])

  const fireSignal = useCallback((from: string, to: string) => {
    setState(s => ({ ...s, signal: { from, to } }))
    setTimeout(() => setState(s => ({ ...s, signal: null })), 1400)
  }, [])

  // ── NODO 1: Generate concepts ────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (generating) return
    setGenerating(true)
    setState(s => ({
      ...s,
      rooms: { ...s.rooms, boss: 'working', ideas: 'working' },
      sessionLog: [...s.sessionLog, { time: now(), message: 'Generating today\'s concepts...', type: 'working' }],
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
        sessionLog: [...s.sessionLog, { time: now(), message: `${concepts.length} conceptos listos!`, type: 'success' }],
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({
        ...s,
        rooms: { ...s.rooms, boss: 'error', ideas: 'error' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Error: ${msg}`, type: 'error' }],
      }))
    } finally {
      setGenerating(false)
    }
  }, [generating, fireSignal])

  // ── Select/deselect concept ──────────────────────────────────────────
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

  // ── NODO 2: Confirm selection + generate image prompts ───────────────
  const handleConfirmSelection = useCallback(async () => {
    const ids = state.selectedConceptIds
    if (ids.length === 0 || processingPrompts) return

    setProcessingPrompts(true)
    setState(s => ({
      ...s,
      rooms: { ...s.rooms, ideas: 'working' },
      sessionLog: [...s.sessionLog, { time: now(), message: `Generando prompts para ${ids.length} conceptos...`, type: 'working' }],
    }))

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'select_concepts', concept_ids: ids, concepts: state.concepts }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { prompts }: { prompts: Record<string, ImagePrompts> } = await res.json()

      setState(s => ({
        ...s,
        imagePrompts: { ...s.imagePrompts, ...prompts },
        rooms: { ...s.rooms, ideas: 'done', images: 'idle' },
        activeOverlay: 'images',
        sessionLog: [...s.sessionLog, { time: now(), message: 'Prompts listos! Abriendo Image Engine.', type: 'success' }],
      }))
      fireSignal('ideas', 'images')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({
        ...s,
        rooms: { ...s.rooms, ideas: 'error' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Prompt error: ${msg}`, type: 'error' }],
      }))
    } finally {
      setProcessingPrompts(false)
    }
  }, [state.selectedConceptIds, processingPrompts, fireSignal])

  // ── NODO 3: Generate image ───────────────────────────────────────────
  const handleGenerateImage = useCallback(async (
    conceptId: string,
    prompt: string,
    tool: 'gemini' | 'gemini-imagen3' | 'higgsfield-nano-banana' | 'higgsfield'
  ) => {
    if (generatingImage) return
    setGeneratingImage(true)
    setGeneratingFor(conceptId)

    setState(s => ({
      ...s,
      rooms: { ...s.rooms, images: 'working' },
      sessionLog: [...s.sessionLog, { time: now(), message: `Generando imagen con ${tool}...`, type: 'working' }],
    }))

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tool, conceptId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()

      const newImage: GeneratedImage = {
        id: `${conceptId}-${tool}-${Date.now()}`,
        conceptId,
        tool,
        imagePath: data.imagePath,
        base64: data.base64,
        mime: data.mime,
        prompt,
        timestamp: data.timestamp,
      }

      setGeneratedImages(prev => [...prev, newImage])
      setState(s => ({
        ...s,
        rooms: { ...s.rooms, images: 'done' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Imagen generada con ${tool}!`, type: 'success' }],
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({
        ...s,
        rooms: { ...s.rooms, images: 'error' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Image error: ${msg}`, type: 'error' }],
      }))
    } finally {
      setGeneratingImage(false)
      setGeneratingFor(null)
    }
  }, [generatingImage])

  // ── Select image + go to video ───────────────────────────────────────
  const handleSelectImage = useCallback((id: string) => {
    setSelectedImageId(id)
    setState(s => ({
      ...s,
      sessionLog: [...s.sessionLog, { time: now(), message: 'Imagen seleccionada!', type: 'success' }],
    }))
  }, [])

  const handleContinueToVideo = useCallback(() => {
    setState(s => ({
      ...s,
      activeOverlay: 'none',
      rooms: { ...s.rooms, video: 'idle' },
      sessionLog: [...s.sessionLog, { time: now(), message: 'Video Engine — coming soon!', type: 'info' }],
    }))
    fireSignal('images', 'video')
  }, [fireSignal])

  const handleCloseOverlay = useCallback(() => {
    setState(s => ({ ...s, activeOverlay: 'none' }))
  }, [])

  const handleOpenIdeas = useCallback(() => {
    if (state.concepts.length > 0) setState(s => ({ ...s, activeOverlay: 'ideas' }))
  }, [state.concepts.length])

  const handleOpenImages = useCallback(() => {
    if (state.selectedConceptIds.length > 0) setState(s => ({ ...s, activeOverlay: 'images' }))
  }, [state.selectedConceptIds.length])

  const selectedConcepts = state.concepts.filter(c => state.selectedConceptIds.includes(c.id))

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      <StarBackground />

      {state.signal && <SignalLine signal={state.signal} />}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: 12, overflow: 'hidden', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#222', letterSpacing: 3 }}>
            ✦ CANTSLEEPT CONTENT FACTORY ✦
          </div>
        </div>

        <BossRoom
          state={state.rooms.boss}
          postsThisWeek={stats.postsThisWeek}
          lastConceptTitle={stats.lastConceptTitle}
          onGenerate={handleGenerate}
          generating={generating}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '5fr 4fr 3fr', gap: 6, flex: 1, minHeight: 0 }}>
          <IdeasRoom
            state={state.rooms.ideas}
            conceptCount={state.concepts.length}
            selectedCount={state.selectedConceptIds.length}
            onClick={handleOpenIdeas}
          />
          <ImagesRoom
            state={state.rooms.images}
            imageCount={generatedImages.length}
            onClick={handleOpenImages}
          />
          <VideoRoom
            state={state.rooms.video}
            videoReady={false}
            onClick={() => {}}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, paddingBottom: 4 }}>
          {(['SALA IDEAS', 'SALA IMÁGENES', 'SALA VIDEO'] as const).map(label => (
            <div key={label} style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#1a1a2e', letterSpacing: 2 }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      <Sidebar log={state.sessionLog} />

      {/* Idea Engine overlay */}
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

      {/* Image Engine overlay */}
      {state.activeOverlay === 'images' && selectedConcepts.length > 0 && (
        <ImagesOverlay
          selectedConcepts={selectedConcepts}
          imagePrompts={state.imagePrompts}
          generatedImages={generatedImages}
          selectedImageId={selectedImageId}
          onGenerate={handleGenerateImage}
          onSelectImage={handleSelectImage}
          onContinueToVideo={handleContinueToVideo}
          onClose={handleCloseOverlay}
          generating={generatingImage}
          generatingFor={generatingFor}
        />
      )}
    </div>
  )
}

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
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
      <svg style={{ width: '100%', height: '100%', position: 'absolute' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke="#00ff88" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.6" />
      </svg>
      <div className="signal-dot" style={{ left: to.x, top: to.y, transform: 'translate(-50%, -50%)' }} />
    </div>
  )
}
