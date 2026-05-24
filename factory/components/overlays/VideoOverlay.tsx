'use client'

import { useState, useEffect } from 'react'
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
  animationConcepts: AnimationConcept[] | null
  loadingAnimations: boolean
  videoUri: string | null
  videoModel: string | null
  defaultVideoPrompt: string
  onGenerateVideo: (prompt: string, provider: 'google' | 'higgsfield') => void
  onBack: () => void
  onClose: () => void
  generating: boolean
}

const ENERGY_COLORS = {
  subtle:  { color: '#48cae4', label: 'SUTIL' },
  dynamic: { color: '#ff6b35', label: 'DINÁMICO' },
  surreal: { color: '#a855f7', label: 'SURREAL' },
}

export default function VideoOverlay({
  selectedConcepts,
  selectedImage,
  animationConcepts,
  loadingAnimations,
  videoUri,
  videoModel,
  defaultVideoPrompt,
  onGenerateVideo,
  onBack,
  onClose,
  generating,
}: VideoOverlayProps) {
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationConcept | null>(null)
  const [prompt, setPrompt] = useState(defaultVideoPrompt)
  const [provider, setProvider] = useState<'google' | 'higgsfield'>('higgsfield')

  // Sync default prompt when it arrives
  useEffect(() => {
    if (defaultVideoPrompt && !prompt) {
      setPrompt(defaultVideoPrompt)
    }
  }, [defaultVideoPrompt, prompt])

  const activeConcept = selectedConcepts[0]

  function pickAnimation(anim: AnimationConcept) {
    setSelectedAnimation(anim)
    setPrompt(anim.video_prompt)
  }

  const proxyUrl = videoUri ? `/api/video-proxy?uri=${encodeURIComponent(videoUri)}` : null

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-panel" style={{ borderColor: '#48cae4', maxWidth: 960 }}>

        {/* Header */}
        <div style={{
          padding: '11px 18px', borderBottom: '2px solid #0d3330',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#050e0d', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#48cae4', letterSpacing: 3, marginBottom: 5 }}>
              NODE_03 — MOTION SICK · {provider === 'google' ? 'GOOGLE VEO' : 'HIGGSFIELD'}
            </div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#fff' }}>
              {activeConcept?.title ?? 'Sin concepto'}
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

          {/* Left panel */}
          <div style={{ width: 220, minWidth: 220, borderRight: '2px solid #0d3330', background: '#050e0d', display: 'flex', flexDirection: 'column' }}>

            {/* Reference image */}
            <div style={{ padding: '11px 13px', borderBottom: '1px solid #0d3330' }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#004d3d', letterSpacing: 2, marginBottom: 7 }}>REFERENCIA</div>
              {selectedImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`data:${selectedImage.mime};base64,${selectedImage.base64}`}
                  alt=""
                  style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block', border: '2px solid #48cae433' }}
                />
              ) : (
                <div style={{ aspectRatio: '9/16', background: '#060f0e', border: '2px solid #0d3330', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#0d3330' }}>SIN IMG</div>
                </div>
              )}
            </div>

            {/* Prompt textarea */}
            <div style={{ padding: '9px 13px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#004d3d', letterSpacing: 2, marginBottom: 6 }}>PROMPT VEO</div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Selecciona un concepto de animación →"
                style={{
                  flex: 1, minHeight: 80,
                  background: '#060f0e', border: '1px solid #0d3330',
                  color: prompt ? '#00a882' : '#0d3330',
                  fontFamily: 'monospace', fontSize: 8, lineHeight: 1.6,
                  padding: 8, resize: 'none', outline: 'none',
                  width: '100%', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Generate button */}
            <div style={{ padding: 11, borderTop: '1px solid #0d3330' }}>
              {/* Provider toggle */}
              <div style={{ display: 'flex', marginBottom: 9, gap: 4 }}>
                {(['google', 'higgsfield'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    style={{
                      flex: 1,
                      fontFamily: '"Press Start 2P", monospace', fontSize: 5,
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
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#0d3330', textAlign: 'center', marginTop: 5 }}>
                {generating
                  ? 'no cierres esta ventana...'
                  : provider === 'google'
                    ? 'veo-3.1-generate-preview (~7 min)'
                    : 'grok_video · 9:16 · 3s'}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ flex: 1, background: '#060f0e', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Animation concept selector */}
            {!videoUri && (
              <div style={{ padding: 14, borderBottom: '2px solid #0d3330', flex: videoUri ? 'none' : 1, overflowY: 'auto' }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#48cae4', letterSpacing: 3, marginBottom: 11 }}>
                  ELIGE UN CONCEPTO DE ANIMACIÓN
                </div>

                {loadingAnimations && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '18px 0' }}>
                    <div style={{ width: 7, height: 7, background: '#48cae4', animation: 'neonPulse 0.8s infinite' }} />
                    <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#48cae4' }}>
                      <span className="loading-dots">ANALIZANDO IMAGEN<span>.</span><span>.</span><span>.</span></span>
                    </div>
                  </div>
                )}

                {!loadingAnimations && animationConcepts === null && (
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#0d3330', padding: '18px 0' }}>
                    Cargando conceptos...
                  </div>
                )}

                {!loadingAnimations && animationConcepts?.length === 0 && (
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#ff3030', padding: '18px 0' }}>
                    Error generando conceptos. Escribe tu prompt manualmente.
                  </div>
                )}

                {animationConcepts && animationConcepts.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
                    {animationConcepts.map(anim => {
                      const ec = ENERGY_COLORS[anim.energy] ?? ENERGY_COLORS.dynamic
                      const isSelected = selectedAnimation?.id === anim.id
                      return (
                        <div
                          key={anim.id}
                          onClick={() => pickAnimation(anim)}
                          style={{
                            border: `2px solid ${isSelected ? ec.color : '#0d3330'}`,
                            background: isSelected ? `${ec.color}0d` : '#050e0d',
                            padding: 11, cursor: 'pointer',
                            boxShadow: isSelected ? `0 0 12px ${ec.color}33` : 'none',
                            transition: 'all 0.1s',
                          }}
                        >
                          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: ec.color, marginBottom: 5, letterSpacing: 1 }}>
                            {ec.label}
                          </div>
                          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: isSelected ? '#fff' : '#00a882', marginBottom: 7, lineHeight: 1.5 }}>
                            {anim.name}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#004d3d', lineHeight: 1.5, marginBottom: 5 }}>
                            {anim.movement}
                          </div>
                          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#0d3330' }}>
                            {anim.camera_direction}
                          </div>
                          {isSelected && (
                            <div style={{ marginTop: 7, fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: ec.color }}>
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
            <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {generating && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 44, height: 44, border: '4px solid #48cae4',
                    borderTop: '4px solid transparent', borderRadius: '50%',
                    margin: '0 auto 18px',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#48cae4', marginBottom: 9 }}>
                    <span className="loading-dots">GENERANDO<span>.</span><span>.</span><span>.</span></span>
                  </div>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#0d3330', lineHeight: 2 }}>
                    Veo 3 genera tu video<br />esto tarda 3-7 minutos
                  </div>
                </div>
              )}

              {!generating && !videoUri && !loadingAnimations && animationConcepts && animationConcepts.length > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#0d3330' }}>
                    {selectedAnimation ? '▶ Listo para generar' : '← Elige un concepto de animación'}
                  </div>
                </div>
              )}

              {!generating && videoUri && proxyUrl && (
                <div style={{ width: '100%', maxWidth: 400 }}>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#00ffcc', marginBottom: 9, display: 'flex', justifyContent: 'space-between' }}>
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
