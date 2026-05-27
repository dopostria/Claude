'use client'

import { useState, useCallback, useEffect } from 'react'
import StarBackground from './StarBackground'
import Sidebar from './Sidebar'
import IdeasOverlay from './overlays/IdeasOverlay'
import ImagesOverlay from './overlays/ImagesOverlay'
import VideoOverlay from './overlays/VideoOverlay'
import type { FactoryState, Concept } from '@/lib/types'
import {
  saveImages, loadImages, triggerDownload,
  saveLocalSession, loadLocalSession,
  todayStr,
  type PersistedImage, type PersistedVideo,
} from '@/lib/persistence'
import type { GitHubSession } from '@/lib/session-types'
import QuickNav from './QuickNav'
import ChatOverlay from './overlays/ChatOverlay'

interface GeneratedImage {
  id: string; conceptId: string; tool: string; imagePath: string
  base64: string; mime: string; prompt: string; timestamp: string
  url?: string   // CDN URL for Higgsfield images (survives reload via PersistedImage.url)
}

function now() { return new Date().toLocaleTimeString('en-US', { hour12: false }) }
function getRoomClass(s: string) {
  return s === 'working' ? 'is-working' : s === 'done' ? 'is-done' : s === 'error' ? 'is-error' : ''
}

async function compressImageForVideo(base64: string, mime: string): Promise<{ base64: string; mime: string }> {
  return new Promise(resolve => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, Math.sqrt(2_000_000 / base64.length))
      canvas.width  = Math.max(1, Math.round(img.width  * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve({ base64: canvas.toDataURL('image/jpeg', 0.82).split(',')[1], mime: 'image/jpeg' })
    }
    img.onerror = () => resolve({ base64, mime })
    img.src = 'data:' + mime + ';base64,' + base64
  })
}

const INITIAL_STATE: FactoryState = {
  rooms: { boss: 'idle', ideas: 'idle', images: 'idle', video: 'idle' },
  activeOverlay: 'none', session: null, sessionLog: [], concepts: [],
  selectedConceptIds: [], imagePrompts: {}, videoPrompts: {},
  generatedImages: [], selectedImageId: null,
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
  const [bossLaunching, setBossLaunching] = useState(false)
  const [pillPath, setPillPath] = useState<string | null>(null)
  const [drChatOpen, setDrChatOpen] = useState(false)
  const [chatContext, setChatContext] = useState<string | undefined>(undefined)
  const [sessionVideos, setSessionVideos] = useState<PersistedVideo[]>([])
  const [isRestored, setIsRestored] = useState(false)
  const [allSessions, setAllSessions] = useState<GitHubSession[]>([])

  useEffect(() => {
    fetch('/api/sessions').then(r => r.json())
      .then(({ stats: s }) => { if (s) setStats({ postsThisWeek: s.postsThisWeek, lastConceptTitle: s.lastConceptTitle }) })
      .catch(() => {})
  }, [])

  // On mount: load GitHub history → restore today's session → fall back to
  // localStorage if GitHub is empty or fails → then load today's images.
  useEffect(() => {
    const init = async () => {
      const today = todayStr()
      let restoredFromGitHub = false

      try {
        const r = await fetch('/api/history')
        const data = await r.json() as { sessions?: GitHubSession[] }
        const list: GitHubSession[] = data.sessions ?? []
        setAllSessions(list)

        const ghSession = list.find(s => s.date === today)
        if (ghSession && ghSession.concepts.length > 0) {
          restoredFromGitHub = true
          setState(s => ({
            ...s,
            concepts: ghSession.concepts,
            imagePrompts: ghSession.imagePrompts,
            videoPrompts: ghSession.videoPrompts,
            selectedConceptIds: ghSession.selectedConceptIds,
            rooms: { ...s.rooms, ideas: 'done' },
          }))
          if (ghSession.videos.length > 0) {
            setSessionVideos(ghSession.videos)
            const last = ghSession.videos[ghSession.videos.length - 1]
            setVideoUri(last.uri)
            setVideoModel(last.model)
          }
        }
      } catch { /* GitHub unavailable — fall through to localStorage */ }

      // Fallback: restore from localStorage when GitHub has no data for today
      if (!restoredFromGitHub) {
        const local = loadLocalSession(today)
        if (local && local.concepts.length > 0) {
          setState(s => ({
            ...s,
            concepts: local.concepts,
            imagePrompts: local.imagePrompts,
            videoPrompts: local.videoPrompts,
            selectedConceptIds: local.selectedConceptIds,
            rooms: { ...s.rooms, ideas: 'done' },
          }))
          if (local.videos.length > 0) {
            setSessionVideos(local.videos)
            const last = local.videos[local.videos.length - 1]
            setVideoUri(last.uri)
            setVideoModel(last.model)
          }
        }
      }

      // Always load today's images from localStorage
      const imgs = loadImages(today)
      if (imgs.length > 0) {
        setGeneratedImages(imgs.map((img: PersistedImage) => ({
          id: img.id, conceptId: img.conceptId, tool: img.model,
          imagePath: img.url ?? '',   // CDN URL for Higgsfield; '' for Gemini (uses base64)
          url: img.url,
          base64: img.base64, mime: img.mime,
          prompt: img.prompt, timestamp: img.timestamp,
        })))
        setState(s => ({ ...s, rooms: { ...s.rooms, images: 'done' } }))
      }

      setIsRestored(true)
    }

    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reactive sync:
  //   images          → localStorage immediately
  //   concepts+videos → localStorage immediately (fallback when GitHub fails)
  //   concepts+videos → GitHub debounced 2s (primary, may fail if token is read-only)
  useEffect(() => {
    if (!isRestored) return
    if (state.concepts.length === 0 && generatedImages.length === 0 && sessionVideos.length === 0) return

    saveImages(todayStr(), generatedImages.map(img => ({
      id: img.id, conceptId: img.conceptId, base64: img.base64, mime: img.mime,
      prompt: img.prompt, model: img.tool, timestamp: img.timestamp,
      url: img.url,   // CDN URL for Higgsfield; undefined for Gemini
    })))

    if (state.concepts.length === 0) return

    // Always save to localStorage immediately so reload works even if GitHub fails
    saveLocalSession({
      date: todayStr(),
      concepts: state.concepts,
      selectedConceptIds: state.selectedConceptIds,
      imagePrompts: state.imagePrompts,
      videoPrompts: state.videoPrompts,
      videos: sessionVideos,
    })

    // Also attempt GitHub save (cross-device sync) — may fail if token is read-only
    const timer = setTimeout(() => {
      const session: GitHubSession = {
        date: todayStr(),
        savedAt: new Date().toISOString(),
        concepts: state.concepts,
        selectedConceptIds: state.selectedConceptIds,
        imagePrompts: state.imagePrompts,
        videoPrompts: state.videoPrompts,
        videos: sessionVideos,
      }
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session }),
      })
        .then(r => r.json())
        .then((data: { ok?: boolean }) => {
          if (data.ok) {
            setAllSessions(prev => {
              const idx = prev.findIndex(s => s.date === session.date)
              if (idx >= 0) { const next = [...prev]; next[idx] = session; return next }
              return [session, ...prev].sort((a, b) => b.date.localeCompare(a.date))
            })
          }
        })
        .catch(() => {})
    }, 2000)

    return () => clearTimeout(timer)
  }, [isRestored, state.concepts, state.imagePrompts, state.videoPrompts, state.selectedConceptIds, generatedImages, sessionVideos]) // eslint-disable-line react-hooks/exhaustive-deps

  const fireSignal = useCallback((from: string, to: string) => {
    setState(s => ({ ...s, signal: { from, to } }))
    setTimeout(() => setState(s => ({ ...s, signal: null })), 1400)
    const fromEl = document.getElementById(`room-${from}`)
    const toEl   = document.getElementById(`room-${to}`)
    if (fromEl && toEl) {
      const fr = fromEl.getBoundingClientRect()
      const tr = toEl.getBoundingClientRect()
      const sx = fr.left + fr.width / 2, sy = fr.top + fr.height / 2
      const ex = tr.left + tr.width / 2, ey = tr.top + tr.height / 2
      const cx = (sx + ex) / 2, cy = Math.min(sy, ey) - 100
      setPillPath(`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`)
      setTimeout(() => setPillPath(null), 900)
    }
    if (from === 'boss') { setBossLaunching(true); setTimeout(() => setBossLaunching(false), 200) }
  }, [])

  const handleGenerate = useCallback(async () => {
    if (generating) return
    setGenerating(true)
    const ctx = chatContext
    setChatContext(undefined)
    setState(s => ({ ...s, rooms: { ...s.rooms, boss: 'working', ideas: 'working' },
      sessionLog: [...s.sessionLog, { time: now(), message: ctx ? 'Generando con contexto del Dr...' : 'Generando conceptos...', type: 'working' }] }))
    fireSignal('boss', 'ideas')
    try {
      await fetch('/api/trends', { method: 'POST' }).catch(() => {})
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: ctx ? { 'Content-Type': 'application/json' } : {},
        body: ctx ? JSON.stringify({ additionalContext: ctx }) : undefined,
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error || `HTTP ${res.status}`) }
      const { concepts }: { concepts: Concept[] } = await res.json()
      setState(s => ({ ...s, concepts, rooms: { ...s.rooms, boss: 'done', ideas: 'done' },
        activeOverlay: 'ideas',
        sessionLog: [...s.sessionLog, { time: now(), message: `${concepts.length} conceptos listos!`, type: 'success' }] }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({ ...s, rooms: { ...s.rooms, boss: 'error', ideas: 'error' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Error: ${msg}`, type: 'error' }] }))
    } finally { setGenerating(false) }
  }, [generating, fireSignal, chatContext])

  const handleSelectConcept = useCallback((id: string) => {
    setState(s => {
      const already = s.selectedConceptIds.includes(id)
      return { ...s, selectedConceptIds: already ? s.selectedConceptIds.filter(x => x !== id) : [...s.selectedConceptIds, id] }
    })
  }, [])

  const handleConfirmSelection = useCallback(async () => {
    const ids = state.selectedConceptIds
    if (ids.length === 0 || processingPrompts) return
    setProcessingPrompts(true)
    setState(s => ({ ...s, rooms: { ...s.rooms, ideas: 'working' },
      sessionLog: [...s.sessionLog, { time: now(), message: `Generando prompts para ${ids.length} concepto(s)...`, type: 'working' }] }))
    try {
      const res = await fetch('/api/sessions', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'select_concepts', concept_ids: ids, concepts: state.concepts }) })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error || `HTTP ${res.status}`) }
      const { imagePrompts, videoPrompts }: { imagePrompts: Record<string, string>; videoPrompts: Record<string, string> } = await res.json()
      const mergedPrompts = { ...state.imagePrompts, ...imagePrompts }
      setState(s => ({ ...s, imagePrompts: mergedPrompts,
        videoPrompts: { ...s.videoPrompts, ...videoPrompts },
        rooms: { ...s.rooms, ideas: 'done' },
        sessionLog: [...s.sessionLog, { time: now(), message: 'Prompts listos! Revisa y edita.', type: 'success' }] }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({ ...s, rooms: { ...s.rooms, ideas: 'error' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Prompt error: ${msg}`, type: 'error' }] }))
    } finally { setProcessingPrompts(false) }
  }, [state.selectedConceptIds, processingPrompts, state.concepts, state.imagePrompts])

  const handleOpenImages = useCallback((editedImagePrompts: Record<string, string>, editedVideoPrompts: Record<string, string>) => {
    setState(s => ({ ...s, imagePrompts: editedImagePrompts, videoPrompts: editedVideoPrompts,
      activeOverlay: 'images', rooms: { ...s.rooms, images: 'idle' },
      sessionLog: [...s.sessionLog, { time: now(), message: 'Abriendo PIXEL DAMAGE...', type: 'info' }] }))
    fireSignal('ideas', 'images')
  }, [fireSignal])

  const handleGenerateImage = useCallback(async (conceptId: string, prompt: string, provider: 'gemini' | 'higgsfield' = 'gemini') => {
    if (generatingImage) return
    setGeneratingImage(true); setGeneratingFor(conceptId)
    setState(s => ({ ...s, rooms: { ...s.rooms, images: 'working' },
      sessionLog: [...s.sessionLog, { time: now(), message: `Generando imagen (${provider})...`, type: 'working' }] }))
    try {
      const res = await fetch('/api/generate-image', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, conceptId, provider }) })
      if (!res.ok) {
        let em = `HTTP ${res.status}`
        try { const e = await res.json(); em = (e as { error?: string }).error ?? em } catch { em = await res.text().catch(() => em) }
        throw new Error(em)
      }
      const data = await res.json() as { native916?: boolean; originalDimensions?: string; model?: string; imagePath?: string; higgsfieldUrl?: string; base64: string; mime: string; timestamp: string }
      const aspectLabel = data.native916 ? '9:16 nativo' : `9:16 crop (orig ${data.originalDimensions ?? '?'})`
      const newImage: GeneratedImage = {
        id: `${conceptId}-${Date.now()}`, conceptId, tool: data.model ?? 'gemini',
        imagePath: data.higgsfieldUrl ?? data.imagePath ?? '',
        url: data.higgsfieldUrl,
        base64: data.base64, mime: data.mime,
        prompt, timestamp: data.timestamp }
      setGeneratedImages(prev => [...prev, newImage])
      setState(s => ({ ...s, rooms: { ...s.rooms, images: 'done' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Imagen lista! ${data.model} · ${aspectLabel}`, type: 'success' }] }))
      const ext = (data.mime ?? 'image/jpeg').includes('png') ? 'png' : 'jpg'
      triggerDownload(data.base64, data.mime, `cantsleept-${conceptId}-${Date.now()}.${ext}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({ ...s, rooms: { ...s.rooms, images: 'error' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Image error: ${msg}`, type: 'error' }] }))
    } finally { setGeneratingImage(false); setGeneratingFor(null) }
  }, [generatingImage])

  const handleSelectImage = useCallback((id: string) => {
    setSelectedImageId(id)
    setState(s => ({ ...s, sessionLog: [...s.sessionLog, { time: now(), message: 'Imagen seleccionada!', type: 'success' }] }))
  }, [])

  const handleContinueToVideo = useCallback(() => {
    setState(s => ({ ...s, activeOverlay: 'video', rooms: { ...s.rooms, video: 'idle' },
      sessionLog: [...s.sessionLog, { time: now(), message: 'Abriendo MOTION SICK...', type: 'info' }] }))
    fireSignal('images', 'video')
  }, [fireSignal])

  const handleGenerateVideo = useCallback(async (prompt: string, provider: 'google' | 'higgsfield' = 'google') => {
    if (generatingVideo) return
    const selectedImg = generatedImages.find(img => img.id === selectedImageId)
    setGeneratingVideo(true); setVideoUri(null); setVideoModel(null)
    setState(s => ({ ...s, rooms: { ...s.rooms, video: 'working' },
      sessionLog: [...s.sessionLog, { time: now(), message: `Generando video (${provider})...`, type: 'working' }] }))
    try {
      let imgBase64 = selectedImg?.base64
      let imgMime   = selectedImg?.mime ?? 'image/jpeg'
      const imgUrl  = selectedImg?.url   // CDN URL for Higgsfield images (no base64 stored)
      if (imgBase64 && imgBase64.length > 2_500_000) {
        const r = await compressImageForVideo(imgBase64, imgMime)
        imgBase64 = r.base64; imgMime = r.mime
      }
      const res = await fetch('/api/generate-video', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageBase64: imgBase64 || undefined, imageMime: imgMime, imageUrl: imgUrl, provider }) })
      if (!res.ok) {
        let em = `HTTP ${res.status}`
        try { const e = await res.json(); em = (e as { error?: string }).error ?? em } catch { em = await res.text().catch(() => em) }
        throw new Error(em)
      }
      const data = await res.json() as { videoUri: string; model: string; timestamp: string }
      setVideoUri(data.videoUri); setVideoModel(data.model)
      setSessionVideos(prev => [...prev, { uri: data.videoUri, model: data.model, prompt, timestamp: data.timestamp }])
      setState(s => ({ ...s, rooms: { ...s.rooms, video: 'done' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Video listo con ${data.model}!`, type: 'success' }] }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState(s => ({ ...s, rooms: { ...s.rooms, video: 'error' },
        sessionLog: [...s.sessionLog, { time: now(), message: `Video error: ${msg}`, type: 'error' }] }))
    } finally { setGeneratingVideo(false) }
  }, [generatingVideo, generatedImages, selectedImageId])

  const handleCloseOverlay = useCallback(() => setState(s => ({ ...s, activeOverlay: 'none' })), [])

  const handleRestoreSession = useCallback((session: GitHubSession) => {
    setState(s => ({
      ...s,
      concepts: session.concepts,
      imagePrompts: session.imagePrompts,
      videoPrompts: session.videoPrompts,
      selectedConceptIds: session.selectedConceptIds,
      rooms: { ...s.rooms, ideas: 'done', images: 'idle' },
    }))
    setSessionVideos(session.videos)
    setGeneratedImages([])
    setSelectedImageId(null)
    if (session.videos.length > 0) {
      const last = session.videos[session.videos.length - 1]
      setVideoUri(last.uri); setVideoModel(last.model)
    } else {
      setVideoUri(null); setVideoModel(null)
    }
  }, [])

  const handleOpenIdeas         = useCallback(() => { if (state.concepts.length > 0) setState(s => ({ ...s, activeOverlay: 'ideas' })) }, [state.concepts.length])
  const handleOpenImagesOverlay = useCallback(() => { if (state.selectedConceptIds.length > 0) setState(s => ({ ...s, activeOverlay: 'images' })) }, [state.selectedConceptIds.length])
  const handleOpenVideoOverlay  = useCallback(() => { if (state.selectedConceptIds.length > 0) setState(s => ({ ...s, activeOverlay: 'video' })) }, [state.selectedConceptIds.length])

  const selectedConcepts = state.concepts.filter(c => state.selectedConceptIds.includes(c.id))
  const selectedImg      = generatedImages.find(img => img.id === selectedImageId)
  const videoPromptForSelected = selectedImg
    ? state.videoPrompts[selectedImg.conceptId] ?? ''
    : state.videoPrompts[state.selectedConceptIds[0]] ?? ''

  return (
    <div className="factory-root">
      <StarBackground />

      {pillPath && <div className="pill-fly" style={{ offsetPath: `path('${pillPath}')` } as React.CSSProperties} />}
      {state.signal && <SignalLine signal={state.signal} />}

      <div className="hud-bar">
        <span className="hud-label">✦ CANTSLEEPT CONTENT FACTORY ✦</span>
        <div className="hud-sep" />
        <span className="hud-label">POSTS/WK</span>
        <span className="hud-value">{stats.postsThisWeek}</span>
        {stats.lastConceptTitle && <>
          <div className="hud-sep" />
          <span className="hud-label">LAST</span>
          <span className="hud-value" style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {stats.lastConceptTitle.toUpperCase()}
          </span>
        </>}
        <div className="hud-spacer" />
        <span className="hud-label">{new Date().toISOString().split('T')[0]}</span>
      </div>

      <div className="factory-body">
        <div className="dungeon-col">
          <div className="dungeon-stage">
            <div className="dungeon-inner">
              <div className="dungeon-bg" />
              <div id="room-boss"   className={`room-overlay room-boss   ${getRoomClass(state.rooms.boss)}`}   />
              <div id="room-ideas"  className={`room-overlay room-ideas  ${getRoomClass(state.rooms.ideas)}`}  />
              <div id="room-images" className={`room-overlay room-images ${getRoomClass(state.rooms.images)}`} />
              <div id="room-video"  className={`room-overlay room-video  ${getRoomClass(state.rooms.video)}`}  />
              <div
                role="button" tabIndex={0} aria-label="Hablar con Dr. Adderall"
                className={`sprite-boss${state.rooms.boss === 'working' ? ' is-working' : ''}`}
                onClick={() => setDrChatOpen(true)}
                onKeyDown={e => e.key === 'Enter' && setDrChatOpen(true)}
              />
              <div role="button" tabIndex={0} className={`sprite-ideas${state.rooms.ideas === 'working' ? ' is-working' : ''}`}
                style={{ cursor: state.concepts.length > 0 ? 'pointer' : 'default' }}
                onClick={handleOpenIdeas} onKeyDown={e => e.key === 'Enter' && handleOpenIdeas()} />
              <div role="button" tabIndex={0} className={`sprite-images${state.rooms.images === 'working' ? ' is-working' : ''}`}
                style={{ cursor: state.selectedConceptIds.length > 0 ? 'pointer' : 'default' }}
                onClick={handleOpenImagesOverlay} onKeyDown={e => e.key === 'Enter' && handleOpenImagesOverlay()} />
              <div role="button" tabIndex={0} className={`sprite-video${state.rooms.video === 'working' ? ' is-working' : ''}`}
                style={{ cursor: state.selectedConceptIds.length > 0 ? 'pointer' : 'default' }}
                onClick={handleOpenVideoOverlay} onKeyDown={e => e.key === 'Enter' && handleOpenVideoOverlay()} />
              <div className="btn-wrap-donotpush">
                <div
                  role="button"
                  tabIndex={generating ? -1 : 0}
                  className={`do-not-push-btn${generating ? ' is-busy' : ''}`}
                  onClick={!generating ? handleGenerate : undefined}
                  onKeyDown={e => { if (e.key === 'Enter' && !generating) handleGenerate() }}
                  aria-label="DO NOT PUSH"
                />
              </div>
            </div>
          </div>
          <QuickNav
            rooms={state.rooms}
            hasConcepts={state.concepts.length > 0}
            hasSelectedConcepts={state.selectedConceptIds.length > 0}
            hasImages={generatedImages.length > 0}
            hasVideo={!!videoUri}
            onOpenIdeas={handleOpenIdeas}
            onOpenImages={handleOpenImagesOverlay}
            onOpenVideo={handleOpenVideoOverlay}
          />
        </div>
        <Sidebar log={state.sessionLog} />
      </div>

      {state.activeOverlay === 'ideas' && state.concepts.length > 0 && (
        <IdeasOverlay concepts={state.concepts} selectedIds={state.selectedConceptIds}
          imagePrompts={state.imagePrompts} videoPrompts={state.videoPrompts}
          allSessions={allSessions}
          onSelectConcept={handleSelectConcept} onConfirmSelection={handleConfirmSelection}
          onOpenImages={handleOpenImages} onClose={handleCloseOverlay} processingPrompts={processingPrompts}
          onRestoreSession={handleRestoreSession} />
      )}
      {state.activeOverlay === 'images' && selectedConcepts.length > 0 && (
        <ImagesOverlay selectedConcepts={selectedConcepts} imagePrompts={state.imagePrompts}
          generatedImages={generatedImages} selectedImageId={selectedImageId}
          allSessions={allSessions}
          onGenerate={handleGenerateImage} onSelectImage={handleSelectImage}
          onContinueToVideo={handleContinueToVideo} onClose={handleCloseOverlay}
          generating={generatingImage} generatingFor={generatingFor}
          onRestoreSession={handleRestoreSession} />
      )}
      {drChatOpen && (
        <ChatOverlay
          onClose={() => setDrChatOpen(false)}
          onGenerateWithContext={ctx => { setChatContext(ctx); setDrChatOpen(false) }}
        />
      )}
      {state.activeOverlay === 'video' && (
        <VideoOverlay selectedConcepts={selectedConcepts}
          selectedImage={generatedImages.find(img => img.id === selectedImageId) ?? null}
          videoUri={videoUri} videoModel={videoModel} defaultVideoPrompt={videoPromptForSelected}
          allSessions={allSessions}
          onGenerateVideo={handleGenerateVideo}
          onBack={() => setState(s => ({ ...s, activeOverlay: 'images' }))}
          onClose={handleCloseOverlay} generating={generatingVideo}
          onRestoreSession={handleRestoreSession} />
      )}
    </div>
  )
}

function SignalLine({ signal }: { signal: { from: string; to: string } }) {
  const positions: Record<string, { x: string; y: string }> = {
    boss:   { x: '38%', y: '26%' },
    ideas:  { x: '12%', y: '74%' },
    images: { x: '38%', y: '76%' },
    video:  { x: '64%', y: '74%' },
  }
  const from = positions[signal.from], to = positions[signal.to]
  if (!from || !to) return null
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:20 }}>
      <svg style={{ width:'100%', height:'100%', position:'absolute' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke="#00c4a0" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.5" />
      </svg>
      <div className="signal-dot" style={{ left:to.x, top:to.y, transform:'translate(-50%,-50%)' }} />
    </div>
  )
}
