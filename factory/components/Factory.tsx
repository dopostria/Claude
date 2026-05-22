'use client'

import { useState, useCallback, useEffect } from 'react'
import StarBackground from './StarBackground'
import Sidebar from './Sidebar'
import BossRoom from './rooms/BossRoom'
import IdeasRoom from './rooms/IdeasRoom'
import { ImagesRoom, VideoRoom } from './rooms/IdeasRoom'
import IdeasOverlay from './overlays/IdeasOverlay'
import ImagesOverlay from './overlays/ImagesOverlay'
import VideoOverlay from './overlays/VideoOverlay'
import type {
  FactoryState,
  Concept,
  AnimationConcept,
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
  videoPrompts: {},
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
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const [videoUri, setVideoUri] = useState<string | null>(null)
  const [videoModel, setVideoModel] = useState<string | null>(null)
  const [animationConcepts, setAnimationConcepts] = useState<AnimationConcept[] | null>(null)
  const [loadingAnimations, setLoadingAnimations] = useState(false)
  const [bossLaunching, setBossLaunching] = useState(false)
  const [pillPath, setPillPath] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(({ stats: s }) => {
        if (s) setStats({ postsThisWeek: s.postsThisWeek, lastConceptTitle: s.lastConceptTitle })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/trends', { method: 'POST' }).catch(() => {})
  }, [])

  const fireSignal = useCallback((from: string, to: string) => {
    setState(s => ({ ...s, signal: { from, to } }))
    setTimeout(() => setState(s => ({ ...s, signal: null })), 1400)

    const fromEl = document.getElementById(`room-${from}`)
    const toEl   = document.getElementById(`room-${to}`)
    if (fromEl && toEl) {
      const fr = fromEl.getBoundingClientRect()
      const tr = toEl.getBoundingClientRect()
      const sx = fr.left + fr.width  / 2
      const sy = fr.top  + fr.height / 2
      const ex = tr.left + tr.width  / 2
      const ey = tr.top  + tr.height / 2
      const cx = (sx + ex) / 2
      const cy = Math.min(sy, ey) - 100
      setPillPath(`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`)
      setTimeout(() => setPillPath(null), 900)
    }

    if (from === 'boss') {
      setBossLaunching(true)
      setTimeout(() => setBossLaunching(false), 200)
    }
  }, [])

  // ── NODO 1 ───────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (generating) return
    setGenerating(true)
    setState(s => ({
      ...s,
      rooms: { ...s.rooms, boss: 'working', ideas: 'working' },
      sessionLog: [...s.sessionLog, { time: now(), message: 'Generando conceptos...', type: 'working' }],
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

  // ── NODO 2 ───────────────────────────────────────────────────────────
  const handleConfirmSelection = useCallback(async () => {
    const ids = state.selectedConceptIds
    if (ids.length === 0 || processingPrompts) return

    setProcessingPrompts(true)
    setState(s => ({
      ...s,
      rooms: { ...s.rooms, ideas: 'working' },
      sessionLog: [...s.sessionLog, { time: now(), message: `Generando prompts para ${ids.length} concepto(s)...`, type: 'working' }],
    }))

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'select_concepts', concept_ids: ids, concepts: state.concepts }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { imagePrompts, videoPrompts }: { imagePrompts: Record<string, string>; videoPrompts: Record<string, string> } = await res.json()

      setState(s => ({
        ...s,
        imagePrompts: { ...s.imagePrompts, ...imagePrompts },
        videoPrompts: { ...s.videoPrompts, ...videoPrompts },
        rooms: { ...s.rooms, ideas: 'done' },
        sessionLog: [...s.sessionLog, { time: now(), message: 'Prompts listos! Revisa y edita.', type: 'success' }],
      }))
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
  }, [state.selectedConceptIds, processingPrompts, state.concepts])

  const handleOpenImages = useCallback((editedImagePrompts: Record<string, string>, editedVideoPrompts: Record<string, string>) => {
    setState(s => ({
      ...s,
      imagePrompts: editedImagePrompts,
      videoPrompts: editedVideoPrompts,
      activeOverlay: 'images',
      rooms: { ...s.rooms, images: 'idle' },
      sessionLog: [...s.sessionLog, { time: now(), message: 'Abriendo PIXEL DAMAGE...', type: 'info' }],
    }))
    fireSignal('ideas', 'images')
  }, [fireSignal])

  // ── NODO 3 ───────────────────────────────────────────────────────────
  const handleGenerateImage = useCallback(async (conceptId: string, prompt: string) => {
    if (generatingImage) return
    setGeneratingImage(true)
    setGeneratingFor(conceptId)

    setState(s => ({
      ...s,
      rooms: { ...s.rooms, images: 'working' },
      sessionLog: [...s.sessionLog, { time: now(), message: 'Generando imagen...', type: 'working' }],
    }))

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, conceptId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()

      const native916 = data.native916 as boolean | undefined
      const originalDimensions = data.originalDimensions as string | undefined
      const aspectLabel = native916
        ? '9:16 nativo'
        : `9:16 crop (orig ${originalDimensions ?? '?'})`

      const newImage: GeneratedImage = {
        id: `${conceptId}-${Date.now()}`,
        conceptId,
        tool: data.model ?? 'gemini',
        imagePath: data.imagePath ?? '',
        base64: data.base64,
        mime: data.mime,
        prompt,
        timestamp: data.timestamp,
      }

      setGeneratedImages(prev => [...prev, newImage])
      setState(s => ({
        ...s,
        rooms: { ...s.rooms, images: 'done' },
        sessionLog: [
          ...s.sessionLog,
          { time: now(), message: `Imagen lista! ${data.model} · ${aspectLabel}`, type: 'success' },
        ],
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

  const handleSelectImage = useCallback((id: string) => {
    setSelectedImageId(id)
    setState(s => ({
      ...s,
      sessionLog: [...s.sessionLog, { time: now(), message: 'Imagen seleccionada!', type: 'success' }],
    }))
  }, [])

  // ── NODO 4 ───────────────────────────────────────────────────────────
  const handleContinueToVideo = useCallback(async () => {
    setState(s => ({
      ...s,
      activeOverlay: 'video',
      rooms: { ...s.rooms, video: 'idle' },
      sessionLog: [...s.sessionLog, { time: now(), message: 'Abriendo MOTION SICK...', type: 'info' }],
    }))
    fireSignal('images', 'video')

    const selectedImg = generatedImages.find(img => img.id === selectedImageId)
    const concept = state.concepts.find(c => state.selectedConceptIds.includes(c.id) && c.id === selectedImg?.conceptId)
      ?? state.concepts.find(c => state.selectedConceptIds.includes(c.id))

    if (!concept) return

    setLoadingAnimations(true)
    setAnimationConcepts(null)

    try {
      const res = await fetch('/api/animation-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, imagePrompt: selectedImg?.prompt ?? '' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAnimationConcepts(data.animations ?? [])
      setState(s => ({
        ...s,
        sessionLog: [...s.sessionLog, { time: now(), message: '3 conceptos de animación listos!', type: 'success' }],
      }))
    } catch {
      setAnimationConcepts([])
    } finally {
      setLoadingAnimations(false)
    }
  }, [fireSignal, generatedImages, selectedImageId, state.concepts, state.selectedConceptIds])

  // ── NODO 5 ───────────────────────────────────────────────────────────
  const handleGenerateVideo = useCallback(async (prompt: string) => {
    if (generatingVideo) return
    const selectedImg = generatedImages.find(img => img.id === selectedImageId)
    setGeneratingVideo(true)
    setVideoUri(null)
    setVideoModel(null)

    setState(s => ({
      ...s,
      rooms: { ...s.rooms, video: 'working' },
      sessionLog: [...s.sessionLog, { time: now(), message: 'Generando video con Veo 3...', type: 'working' }],
    }))

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageBase64: selectedImg?.base64,
          imageMime: selectedImg?.mime,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setVideoUri(data.videoUri)
      setVideoModel(data.model)
      setState(s => ({
        ...s,
        rooms: { ...s.rooms, video: 'done' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Video listo con ${data.model}!`, type: 'success' }],
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({
        ...s,
        rooms: { ...s.rooms, video: 'error' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Video error: ${msg}`, type: 'error' }],
      }))
    } finally {
      setGeneratingVideo(false)
    }
  }, [generatingVideo, generatedImages, selectedImageId])

  const handleCloseOverlay  = useCallback(() => setState(s => ({ ...s, activeOverlay: 'none' })), [])
  const handleOpenIdeas     = useCallback(() => { if (state.concepts.length > 0) setState(s => ({ ...s, activeOverlay: 'ideas' })) }, [state.concepts.length])
  const handleOpenImagesOverlay = useCallback(() => { if (state.selectedConceptIds.length > 0) setState(s => ({ ...s, activeOverlay: 'images' })) }, [state.selectedConceptIds.length])

  const selectedConcepts = state.concepts.filter(c => state.selectedConceptIds.includes(c.id))
  const selectedImg = generatedImages.find(img => img.id === selectedImageId)
  const videoPromptForSelected = selectedImg
    ? state.videoPrompts[selectedImg.conceptId] ?? ''
    : state.videoPrompts[state.selectedConceptIds[0]] ?? ''

  return (
    <div className="factory-root">
      <StarBackground />

      {/* Pill arc */}
      {pillPath && (
        <div className="pill-fly" style={{ offsetPath: `path('${pillPath}')` } as React.CSSProperties} />
      )}

      {/* Signal overlay */}
      {state.signal && <SignalLine signal={state.signal} />}

      {/* HUD top */}
      <div className="hud-bar">
        <span className="hud-label">✦ CANTSLEEPT CONTENT FACTORY ✦</span>
        <div className="hud-sep" />
        <span className="hud-label">POSTS/WK</span>
        <span className="hud-value">{stats.postsThisWeek}</span>
        {stats.lastConceptTitle && (
          <>
            <div className="hud-sep" />
            <span className="hud-label">LAST</span>
            <span className="hud-value" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {stats.lastConceptTitle.toUpperCase()}
            </span>
          </>
        )}
        <div className="hud-spacer" />
        <span className="hud-label">{new Date().toISOString().split('T')[0]}</span>
      </div>

      {/* Factory body: 2×2 grid + comms panel */}
      <div className="factory-body">
        <div className="factory-grid">
          <BossRoom
            state={state.rooms.boss}
            postsThisWeek={stats.postsThisWeek}
            lastConceptTitle={stats.lastConceptTitle}
            onGenerate={handleGenerate}
            generating={generating}
            launching={bossLaunching}
          />
          <IdeasRoom
            state={state.rooms.ideas}
            conceptCount={state.concepts.length}
            selectedCount={state.selectedConceptIds.length}
            onClick={handleOpenIdeas}
          />
          <ImagesRoom
            state={state.rooms.images}
            imageCount={generatedImages.length}
            onClick={handleOpenImagesOverlay}
          />
          <VideoRoom
            state={state.rooms.video}
            videoReady={!!videoUri}
            onClick={() => { if (videoUri) setState(s => ({ ...s, activeOverlay: 'video' })) }}
          />
        </div>

        <Sidebar log={state.sessionLog} />
      </div>

      {/* Overlays */}
      {state.activeOverlay === 'ideas' && state.concepts.length > 0 && (
        <IdeasOverlay
          concepts={state.concepts}
          selectedIds={state.selectedConceptIds}
          imagePrompts={state.imagePrompts}
          videoPrompts={state.videoPrompts}
          onSelectConcept={handleSelectConcept}
          onConfirmSelection={handleConfirmSelection}
          onOpenImages={handleOpenImages}
          onClose={handleCloseOverlay}
          processingPrompts={processingPrompts}
        />
      )}

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

      {state.activeOverlay === 'video' && (
        <VideoOverlay
          selectedConcepts={selectedConcepts}
          selectedImage={generatedImages.find(img => img.id === selectedImageId) ?? null}
          animationConcepts={animationConcepts}
          loadingAnimations={loadingAnimations}
          videoUri={videoUri}
          videoModel={videoModel}
          defaultVideoPrompt={videoPromptForSelected}
          onGenerateVideo={handleGenerateVideo}
          onBack={() => setState(s => ({ ...s, activeOverlay: 'images' }))}
          onClose={handleCloseOverlay}
          generating={generatingVideo}
        />
      )}
    </div>
  )
}

function SignalLine({ signal }: { signal: { from: string; to: string } }) {
  const positions: Record<string, { x: string; y: string }> = {
    boss:   { x: '25%', y: '30%' },
    ideas:  { x: '75%', y: '30%' },
    images: { x: '25%', y: '70%' },
    video:  { x: '75%', y: '70%' },
  }
  const from = positions[signal.from]
  const to   = positions[signal.to]
  if (!from || !to) return null

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
      <svg style={{ width: '100%', height: '100%', position: 'absolute' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <line
          x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke="#00c4a0" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.5"
        />
      </svg>
      <div className="signal-dot" style={{ left: to.x, top: to.y, transform: 'translate(-50%, -50%)' }} />
    </div>
  )
}
