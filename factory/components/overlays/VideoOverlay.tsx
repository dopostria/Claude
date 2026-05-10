'use client'

import { useState } from 'react'
import type { Concept } from '@/lib/types'

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
  videoUri: string | null
  videoModel: string | null
  onGenerateVideo: (prompt: string) => void
  onClose: () => void
  generating: boolean
}

function buildVideoPrompt(concept: Concept, imagePrompt: string): string {
  return `Cinematic short video based on: "${concept.title}". ${concept.setup} ${concept.punchline}. Visual style: ${imagePrompt.slice(0, 120)}. Dynamic motion, dramatic lighting, 8 seconds.`
}

export default function VideoOverlay({
  selectedConcepts,
  selectedImage,
  videoUri,
  videoModel,
  onGenerateVideo,
  onClose,
  generating,
}: VideoOverlayProps) {
  const activeConcept = selectedConcepts[0]
  const defaultPrompt = activeConcept
    ? buildVideoPrompt(activeConcept, selectedImage?.prompt ?? '')
    : ''
  const [prompt, setPrompt] = useState(defaultPrompt)

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-panel" style={{ borderColor: '#ff0040', maxWidth: 860 }}>

        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '2px solid #0a0a18',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#05050f', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#ff0040', letterSpacing: 2, marginBottom: 6 }}>
              NODO 5 — VIDEO ENGINE · VEO 3
            </div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: '#fff' }}>
              {activeConcept?.title ?? 'Sin concepto'}
            </div>
          </div>
          <button className="btn-pixel" onClick={onClose} style={{ color: '#555', borderColor: '#333', fontSize: 8 }}>✕</button>
        </div>

        <div style={{ display: 'flex', minHeight: 480 }}>

          {/* Left — reference image + prompt */}
          <div style={{ width: 300, minWidth: 300, borderRight: '2px solid #0a0a18', background: '#05050f', display: 'flex', flexDirection: 'column' }}>

            {/* Reference image */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #111' }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333', letterSpacing: 2, marginBottom: 8 }}>IMAGEN DE REFERENCIA</div>
              {selectedImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`data:${selectedImage.mime};base64,${selectedImage.base64}`}
                  alt=""
                  style={{ width: '100%', display: 'block', border: '2px solid #ff004044' }}
                />
              ) : (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #111' }}>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#222' }}>SIN IMAGEN</div>
                </div>
              )}
            </div>

            {/* Prompt editor */}
            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333', letterSpacing: 2, marginBottom: 8 }}>PROMPT DE VIDEO</div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={6}
                style={{
                  flex: 1,
                  background: '#030308',
                  border: '1px solid #1a1a2e',
                  color: '#888',
                  fontFamily: 'monospace',
                  fontSize: 9,
                  lineHeight: 1.6,
                  padding: 10,
                  resize: 'none',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Generate button */}
            <div style={{ padding: 16, borderTop: '1px solid #111' }}>
              <button
                className="btn-pixel"
                disabled={generating || !prompt.trim()}
                onClick={() => onGenerateVideo(prompt)}
                style={{
                  width: '100%',
                  color: generating ? '#555' : '#ff0040',
                  borderColor: generating ? '#333' : '#ff0040',
                  fontSize: 8, padding: '12px 0',
                  boxShadow: generating ? 'none' : '0 0 12px #ff004044',
                }}
              >
                {generating ? (
                  <span className="loading-dots">VEO GENERANDO<span>.</span><span>.</span><span>.</span></span>
                ) : '▶ GENERAR VIDEO'}
              </button>
              {generating && (
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#333', textAlign: 'center', marginTop: 8, lineHeight: 1.8 }}>
                  Veo 3 tarda ~3 min
                  <br />no cierres esta ventana
                </div>
              )}
              {!generating && (
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#222', textAlign: 'center', marginTop: 8 }}>
                  veo-3.0 · veo-2.0 fallback
                </div>
              )}
            </div>
          </div>

          {/* Right — video result */}
          <div style={{ flex: 1, padding: 24, background: '#030308', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {generating && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 24 }}>
                  {/* Pixel spinner */}
                  <div style={{
                    width: 48, height: 48, border: '4px solid #ff0040',
                    borderTop: '4px solid transparent',
                    borderRadius: '50%',
                    margin: '0 auto',
                    animation: 'spin 1s linear infinite',
                  }} />
                </div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#ff0040' }}>
                  <span className="loading-dots">PROCESANDO<span>.</span><span>.</span><span>.</span></span>
                </div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333', marginTop: 12, lineHeight: 2 }}>
                  Veo 3 está generando<br />tu video de 8 segundos
                </div>
              </div>
            )}

            {!generating && !videoUri && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#111', marginBottom: 12 }}>[ SIN VIDEO AÚN ]</div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#0a0a18' }}>Presiona GENERAR VIDEO</div>
              </div>
            )}

            {!generating && videoUri && (
              <div style={{ width: '100%' }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#00ff88', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>✓ VIDEO LISTO</span>
                  {videoModel && <span style={{ color: '#333' }}>{videoModel}</span>}
                </div>
                <video
                  src={videoUri}
                  controls
                  autoPlay
                  loop
                  style={{ width: '100%', border: '2px solid #ff004044', background: '#000' }}
                />
                <a
                  href={videoUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pixel"
                  style={{
                    display: 'block', marginTop: 12, textAlign: 'center',
                    color: '#00ff88', borderColor: '#00ff88', fontSize: 7,
                    padding: '10px 0', textDecoration: 'none',
                    boxShadow: '0 0 12px #00ff8844',
                  }}
                >
                  ↓ DESCARGAR VIDEO
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
