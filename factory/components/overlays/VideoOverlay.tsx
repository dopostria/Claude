'use client'

import { useState, useEffect } from 'react'
import type { Concept } from '@/lib/types'
import type { GitHubSession } from '@/lib/session-types'

interface GeneratedImage {
  id: string
  conceptId: string
  base64: string
  mime: string
  prompt: string
  url?: string   // CDN URL for Higgsfield-hosted images (base64 may be empty after reload)
}

interface VideoOverlayProps {
  selectedConcepts: Concept[]
  selectedImage: GeneratedImage | null
  videoUri: string | null
  videoModel: string | null
  defaultVideoPrompt: string
  allSessions: GitHubSession[]
  onGenerateVideo: (prompt: string, provider: 'google' | 'higgsfield') => void
  onBack: () => void
  onClose: () => void
  generating: boolean
  onRestoreSession: (session: GitHubSession) => void
}

export default function VideoOverlay({
  selectedConcepts,
  selectedImage,
  videoUri,
  videoModel,
  defaultVideoPrompt,
  allSessions,
  onGenerateVideo,
  onBack,
  onClose,
  generating,
  onRestoreSession,
}: VideoOverlayProps) {
  const [prompt, setPrompt] = useState(defaultVideoPrompt)
  const [provider, setProvider] = useState<'google' | 'higgsfield'>('higgsfield')
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    if (defaultVideoPrompt) setPrompt(defaultVideoPrompt)
  }, [defaultVideoPrompt])

  const activeConcept = selectedConcepts[0]

  const proxyUrl = videoUri
    ? videoUri.includes('googleapis.com')
      ? `/api/video-proxy?uri=${encodeURIComponent(videoUri)}`
      : videoUri
    : null

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-panel" style={{ borderColor: '#48cae4', maxWidth: 960 }}>

        {/* Header */}
        <div style={{
          padding: '11px 18px', borderBottom: '2px solid #0d3330',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#050e0d', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* History toggle */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setHistoryOpen(o => !o)}
                style={{
                  fontFamily: '"Orbitron", sans-serif', fontSize: 7,
                  background: historyOpen ? '#07201e' : 'transparent',
                  border: `1px solid ${historyOpen ? '#48cae4' : '#0d3330'}`,
                  color: historyOpen ? '#48cae4' : '#0d3330',
                  padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {historyOpen ? '▾ HISTORY' : '▸ HISTORY'}
              </button>
              {historyOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, zIndex: 200,
                  background: '#050e0d', border: '1px solid #0d3330',
                  minWidth: 320, maxHeight: 300, overflowY: 'auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                }}>
                  {allSessions.length === 0 && (
                    <div style={{ padding: '10px 14px', fontFamily: '"Orbitron", sans-serif', fontSize: 7, color: '#004d3d' }}>
                      _ sin historial
                    </div>
                  )}
                  {allSessions.map(session => (
                    <div
                      key={session.date}
                      onClick={() => { onRestoreSession(session); setHistoryOpen(false) }}
                      style={{
                        padding: '8px 14px', cursor: 'pointer',
                        borderBottom: '1px solid #0a1a18',
                        fontFamily: '"Share Tech Mono", monospace', fontSize: 12,
                        color: '#00c4a0', display: 'flex', gap: 10, alignItems: 'center',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#071412')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 6, color: '#00ffcc', minWidth: 90 }}>{session.date}</span>
                      <span style={{ color: '#004d3d' }}>
                        {session.concepts.length} ideas · {session.videos.length} vids
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#48cae4', letterSpacing: 3, marginBottom: 5 }}>
                NODE_03 — MOTION SICK · {provider === 'google' ? 'GOOGLE VEO' : 'HIGGSFIELD'}
              </div>
              <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 9, color: '#fff' }}>
                {activeConcept?.title ?? 'Sin concepto'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 7 }}>
            {!generating && (
              <button className="btn-pixel" onClick={onBack}
                style={{ color: '#ff6b35', borderColor: '#ff6b35', fontSize: 6 }}>
                ← PIXEL DAMAGE
              </button>
            )}
            <button className="btn-pixel" onClick={onClose} style={{ color: '#004d3d', borderColor: '#0d3330', fontSize: 7 }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'flex', minHeight: 520 }}>

          {/* Left panel — reference image + prompt + generate */}
          <div style={{ width: 220, minWidth: 220, borderRight: '2px solid #0d3330', background: '#050e0d', display: 'flex', flexDirection: 'column' }}>

            {/* Reference image */}
            <div style={{ padding: '11px 13px', borderBottom: '1px solid #0d3330' }}>
              <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#004d3d', letterSpacing: 2, marginBottom: 7 }}>REFERENCIA</div>
              {selectedImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedImage.base64
                    ? `data:${selectedImage.mime};base64,${selectedImage.base64}`
                    : (selectedImage.url ?? '')}
                  alt=""
                  style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block', border: '2px solid #48cae433' }}
                />
              ) : (
                <div style={{ aspectRatio: '9/16', background: '#060f0e', border: '2px solid #0d3330', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#0d3330' }}>SIN IMG</div>
                </div>
              )}
            </div>

            {/* Prompt textarea */}
            <div style={{ padding: '9px 13px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#004d3d', letterSpacing: 2, marginBottom: 6 }}>PROMPT VEO</div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Edita el prompt de video aquí..."
                style={{
                  flex: 1, minHeight: 120,
                  background: '#060f0e', border: '1px solid #0d3330',
                  color: prompt ? '#00d4a8' : '#0d3330',
                  fontFamily: '"Share Tech Mono", monospace', fontSize: 13, lineHeight: 1.6,
                  padding: 8, resize: 'none', outline: 'none',
                  width: '100%', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Generate button */}
            <div style={{ padding: 11, borderTop: '1px solid #0d3330' }}>
              <div style={{ display: 'flex', marginBottom: 9, gap: 4 }}>
                {(['google', 'higgsfield'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    style={{
                      flex: 1,
                      fontFamily: '"Orbitron", sans-serif', fontSize: 5,
                      padding: '5px 0',
                      background: provider === p ? '#07201e' : 'transparent',
                      border: `1px solid ${provider === p ? '#48cae4' : '#0d3330'}`,
                      color: provider === p ? '#48cae4' : '#0d3330',
                      cursor: 'pointer',
                    }}
                  >
                    {p === 'google' ? 'GOOGLE' : 'HIGGS'}
                  </button>
                ))}
              </div>
              <button
                className="btn-pixel"
                disabled={generating || !prompt.trim()}
                onClick={() => onGenerateVideo(prompt, provider)}
                style={{
                  width: '100%',
                  color: generating ? '#004d3d' : (prompt ? '#48cae4' : '#0d3330'),
                  borderColor: generating ? '#0d3330' : (prompt ? '#48cae4' : '#0d3330'),
                  fontSize: 7, padding: '10px 0',
                  boxShadow: (generating || !prompt) ? 'none' : '0 0 10px #48cae444',
                }}
              >
                {generating
                  ? <span className="loading-dots">PROCESANDO<span>.</span><span>.</span><span>.</span></span>
                  : '▶ GENERAR VIDEO'}
              </button>
              <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#0d3330', textAlign: 'center', marginTop: 5 }}>
                {generating
                  ? 'no cierres esta ventana...'
                  : provider === 'google'
                    ? 'veo-3.1-generate-preview (~7 min)'
                    : 'grok_video · 9:16 · 3s'}
              </div>
            </div>
          </div>

          {/* Right panel — video result */}
          <div style={{ flex: 1, background: '#060f0e', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {generating && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 44, height: 44, border: '4px solid #48cae4',
                    borderTop: '4px solid transparent', borderRadius: '50%',
                    margin: '0 auto 18px',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 8, color: '#48cae4', marginBottom: 9 }}>
                    <span className="loading-dots">GENERANDO<span>.</span><span>.</span><span>.</span></span>
                  </div>
                  <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 6, color: '#0d3330', lineHeight: 2 }}>
                    {provider === 'google' ? 'Veo 3 genera tu video\nesto tarda 3-7 minutos' : 'Higgsfield generando clip 3s...'}
                  </div>
                </div>
              )}

              {!generating && !videoUri && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 7, color: '#0d3330', marginBottom: 9 }}>
                    [ LISTO PARA GENERAR ]
                  </div>
                  <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 6, color: '#0a1412' }}>
                    Edita el prompt y presiona GENERAR VIDEO
                  </div>
                </div>
              )}

              {!generating && videoUri && proxyUrl && (
                <div style={{ width: '100%', maxWidth: 400 }}>
                  <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 6, color: '#00ffcc', marginBottom: 9, display: 'flex', justifyContent: 'space-between' }}>
                    <span>✓ VIDEO LISTO</span>
                    {videoModel && <span style={{ color: '#0d3330' }}>{videoModel}</span>}
                  </div>
                  <video
                    src={proxyUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    preload="auto"
                    style={{
                      width: '100%',
                      aspectRatio: '9/16',
                      maxHeight: '70vh',
                      objectFit: 'cover',
                      border: '2px solid #48cae444',
                      background: '#000',
                      display: 'block',
                    }}
                  />
                  <a
                    href={`${proxyUrl}&download=1`}
                    download="cantsleept-video.mp4"
                    className="btn-pixel"
                    style={{
                      display: 'block', marginTop: 9, textAlign: 'center',
                      color: '#00ffcc', borderColor: '#00c4a0', fontSize: 7,
                      padding: '8px 0', textDecoration: 'none',
                      boxShadow: '0 0 10px rgba(0,196,160,0.3)',
                    }}
                  >
                    ↓ DESCARGAR VIDEO
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
