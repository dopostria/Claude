'use client'

import { useState } from 'react'
import type { Concept, AnimationConcept } from '@/lib/types'

interface GeneratedImage {
  id: string
  conceptId: string
  base64: string
  mime: string
  prompt: string
}

interface VideoOverlayProps {
  selectedConcepts: Concept[]
  selectedImage: GeneratedImage | null
  animationConcepts: AnimationConcept[] | null  // null = loading, [] = error
  loadingAnimations: boolean
  videoUri: string | null
  videoModel: string | null
  onGenerateVideo: (prompt: string) => void
  onBack: () => void
  onClose: () => void
  generating: boolean
}

const ENERGY_COLORS = {
  subtle:  { color: '#00aaff', label: 'SUTIL' },
  dynamic: { color: '#ff0040', label: 'DINÁMICO' },
  surreal: { color: '#ffdd00', label: 'SURREAL' },
}

export default function VideoOverlay({
  selectedConcepts,
  selectedImage,
  animationConcepts,
  loadingAnimations,
  videoUri,
  videoModel,
  onGenerateVideo,
  onBack,
  onClose,
  generating,
}: VideoOverlayProps) {
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationConcept | null>(null)
  const [prompt, setPrompt] = useState('')

  const activeConcept = selectedConcepts[0]

  function pickAnimation(anim: AnimationConcept) {
    setSelectedAnimation(anim)
    setPrompt(anim.video_prompt)
  }

  const proxyUrl = videoUri ? `/api/video-proxy?uri=${encodeURIComponent(videoUri)}` : null

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-panel" style={{ borderColor: '#ff0040', maxWidth: 960 }}>

        {/* Header */}
        <div style={{
          padding: '12px 20px', borderBottom: '2px solid #0a0a18',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#05050f', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#ff0040', letterSpacing: 2, marginBottom: 5 }}>
              NODO 5 — VIDEO ENGINE · VEO 3.1
            </div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#fff' }}>
              {activeConcept?.title ?? 'Sin concepto'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!generating && (
              <button className="btn-pixel" onClick={onBack}
                style={{ color: '#0088ff', borderColor: '#0088ff', fontSize: 7 }}>
                ← IMÁGENES
              </button>
            )}
            <button className="btn-pixel" onClick={onClose} style={{ color: '#555', borderColor: '#333', fontSize: 8 }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'flex', minHeight: 520 }}>

          {/* Left panel */}
          <div style={{ width: 220, minWidth: 220, borderRight: '2px solid #0a0a18', background: '#05050f', display: 'flex', flexDirection: 'column' }}>

            {/* Reference image thumbnail */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #111' }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#333', letterSpacing: 2, marginBottom: 7 }}>REFERENCIA</div>
              {selectedImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`data:${selectedImage.mime};base64,${selectedImage.base64}`}
                  alt=""
                  style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block', border: '2px solid #ff004033' }}
                />
              ) : (
                <div style={{ aspectRatio: '9/16', background: '#030308', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#222' }}>SIN IMG</div>
                </div>
              )}
            </div>

            {/* Prompt editor */}
            <div style={{ padding: '10px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#333', letterSpacing: 2, marginBottom: 6 }}>PROMPT VEO</div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Selecciona un concepto de animación →"
                style={{
                  flex: 1, minHeight: 80,
                  background: '#030308', border: '1px solid #1a1a2e',
                  color: prompt ? '#888' : '#2a2a3a',
                  fontFamily: 'monospace', fontSize: 8, lineHeight: 1.6,
                  padding: 8, resize: 'none', outline: 'none',
                  width: '100%', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Generate button */}
            <div style={{ padding: 12, borderTop: '1px solid #111' }}>
              <button
                className="btn-pixel"
                disabled={generating || !prompt.trim()}
                onClick={() => onGenerateVideo(prompt)}
                style={{
                  width: '100%',
                  color: generating ? '#555' : (prompt ? '#ff0040' : '#333'),
                  borderColor: generating ? '#333' : (prompt ? '#ff0040' : '#333'),
                  fontSize: 7, padding: '10px 0',
                  boxShadow: (generating || !prompt) ? 'none' : '0 0 10px #ff004044',
                }}
              >
                {generating
                  ? <span className="loading-dots">VEO PROCESANDO<span>.</span><span>.</span><span>.</span></span>
                  : '▶ GENERAR VIDEO'}
              </button>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#111', textAlign: 'center', marginTop: 6 }}>
                {generating ? 'tarda ~3-7 min · no cierres' : 'veo-3.1 · veo-3.0 fallback'}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ flex: 1, background: '#030308', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Animation concept selector */}
            {!videoUri && (
              <div style={{ padding: 16, borderBottom: '2px solid #0a0a18', flex: videoUri ? 'none' : 1, overflowY: 'auto' }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#ff0040', letterSpacing: 2, marginBottom: 12 }}>
                  ELIGE UN CONCEPTO DE ANIMACIÓN
                </div>

                {loadingAnimations && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0' }}>
                    <div style={{ width: 8, height: 8, background: '#ff0040', animation: 'pulse 1s infinite' }} />
                    <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#ff0040' }}>
                      <span className="loading-dots">ANALIZANDO IMAGEN<span>.</span><span>.</span><span>.</span></span>
                    </div>
                  </div>
                )}

                {!loadingAnimations && animationConcepts === null && (
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#222', padding: '20px 0' }}>
                    Cargando conceptos...
                  </div>
                )}

                {!loadingAnimations && animationConcepts?.length === 0 && (
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#ff0040', padding: '20px 0' }}>
                    Error generando conceptos. Escribe tu prompt manualmente.
                  </div>
                )}

                {animationConcepts && animationConcepts.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {animationConcepts.map(anim => {
                      const ec = ENERGY_COLORS[anim.energy] ?? ENERGY_COLORS.dynamic
                      const isSelected = selectedAnimation?.id === anim.id
                      return (
                        <div
                          key={anim.id}
                          onClick={() => pickAnimation(anim)}
                          style={{
                            border: `2px solid ${isSelected ? ec.color : '#1a1a2e'}`,
                            background: isSelected ? `${ec.color}0d` : '#05050f',
                            padding: 12, cursor: 'pointer',
                            boxShadow: isSelected ? `0 0 12px ${ec.color}33` : 'none',
                            transition: 'all 0.1s',
                          }}
                        >
                          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: ec.color, marginBottom: 6, letterSpacing: 1 }}>
                            {ec.label}
                          </div>
                          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: isSelected ? '#fff' : '#aaa', marginBottom: 8, lineHeight: 1.5 }}>
                            {anim.name}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>
                            {anim.movement}
                          </div>
                          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#333' }}>
                            {anim.camera_direction}
                          </div>
                          {isSelected && (
                            <div style={{ marginTop: 8, fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: ec.color }}>
                              ✓ SELECCIONADO
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Video result */}
            <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {generating && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 48, height: 48, border: '4px solid #ff0040',
                    borderTop: '4px solid transparent', borderRadius: '50%',
                    margin: '0 auto 20px',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#ff0040', marginBottom: 10 }}>
                    <span className="loading-dots">GENERANDO<span>.</span><span>.</span><span>.</span></span>
                  </div>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333', lineHeight: 2 }}>
                    Veo 3 genera tu video<br />esto tarda 3-7 minutos
                  </div>
                </div>
              )}

              {!generating && !videoUri && !loadingAnimations && animationConcepts && animationConcepts.length > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#1a1a2e' }}>
                    {selectedAnimation ? '▶ Listo para generar' : '← Elige un concepto de animación'}
                  </div>
                </div>
              )}

              {!generating && videoUri && proxyUrl && (
                <div style={{ width: '100%', maxWidth: 480 }}>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#00ff88', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span>✓ VIDEO LISTO</span>
                    {videoModel && <span style={{ color: '#333' }}>{videoModel}</span>}
                  </div>
                  <video
                    src={proxyUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    preload="auto"
                    style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', border: '2px solid #ff004044', background: '#000', display: 'block' }}
                  />
                  <a
                    href={`${proxyUrl}&download=1`}
                    download="cantsleept-video.mp4"
                    className="btn-pixel"
                    style={{
                      display: 'block', marginTop: 10, textAlign: 'center',
                      color: '#00ff88', borderColor: '#00ff88', fontSize: 7,
                      padding: '9px 0', textDecoration: 'none',
                      boxShadow: '0 0 10px #00ff8833',
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
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
      `}</style>
    </div>
  )
}
