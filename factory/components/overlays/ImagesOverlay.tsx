'use client'

import { useState } from 'react'
import type { Concept } from '@/lib/types'

interface GeneratedImage {
  id: string
  conceptId: string
  base64: string
  mime: string
  timestamp: string
}

interface ImagesOverlayProps {
  selectedConcepts: Concept[]
  imagePrompts: Record<string, string>
  generatedImages: GeneratedImage[]
  selectedImageId: string | null
  onGenerate: (conceptId: string, prompt: string) => void
  onSelectImage: (id: string) => void
  onContinueToVideo: () => void
  onClose: () => void
  generating: boolean
  generatingFor: string | null
}

const STYLES = [
  { id: 'FOTO',    label: 'FOTO',    color: '#00aaff', prefix: 'Ultra-realistic photograph, cinematic lighting, Sony A7R IV, 8K resolution. ' },
  { id: 'ANIME',   label: 'ANIME',   color: '#ff44cc', prefix: 'Vibrant anime illustration, Studio Ghibli inspired, clean linework, vivid cel-shaded colors. ' },
  { id: 'PELUCHE', label: 'PELUCHE', color: '#ffaa00', prefix: 'Plush toy aesthetic, soft fuzzy fabric texture, cute chibi style, pastel palette. ' },
  { id: 'CYBER',   label: 'CYBER',   color: '#00ff88', prefix: 'Cyberpunk neon aesthetic, Blade Runner vibes, dark moody atmosphere, glowing neon accents. ' },
  { id: 'ARTE',    label: 'ARTE',    color: '#ff6600', prefix: 'Bold digital painting, concept art quality, dynamic brushwork, rich saturated colors. ' },
]

const ASPECT_SUFFIX = ' Vertical 9:16 portrait format optimized for social media.'

export default function ImagesOverlay({
  selectedConcepts,
  imagePrompts,
  generatedImages,
  selectedImageId,
  onGenerate,
  onSelectImage,
  onContinueToVideo,
  onClose,
  generating,
  generatingFor,
}: ImagesOverlayProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id)

  const activeConcept = selectedConcepts[activeIdx] ?? selectedConcepts[0]
  const basePrompt = activeConcept ? imagePrompts[activeConcept.id] ?? '' : ''
  const style = STYLES.find(s => s.id === selectedStyle) ?? STYLES[0]
  const finalPrompt = basePrompt ? style.prefix + basePrompt + ASPECT_SUFFIX : ''
  const conceptImages = generatedImages.filter(img => img.conceptId === activeConcept?.id)
  const isGeneratingThis = generating && generatingFor === activeConcept?.id

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-panel" style={{ borderColor: '#0088ff', maxWidth: 1000 }}>

        {/* Header */}
        <div style={{
          padding: '12px 20px', borderBottom: '2px solid #0a0a18',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#05050f', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#0088ff', letterSpacing: 2 }}>
            NODO 3 — IMAGE ENGINE · GEMINI 2.5 FLASH
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {selectedImageId && (
              <button className="btn-pixel" onClick={onContinueToVideo}
                style={{ color: '#00ff88', borderColor: '#00ff88', fontSize: 7, boxShadow: '0 0 12px #00ff8844' }}>
                ▶ ANIMAR CON VEO 3
              </button>
            )}
            <button className="btn-pixel" onClick={onClose} style={{ color: '#555', borderColor: '#333', fontSize: 8 }}>✕</button>
          </div>
        </div>

        {/* Concept tabs — shown only when multiple concepts selected */}
        {selectedConcepts.length > 1 && (
          <div style={{
            display: 'flex', overflowX: 'auto', background: '#030308',
            borderBottom: '2px solid #0a0a18', gap: 0,
          }}>
            {selectedConcepts.map((concept, idx) => {
              const imgs = generatedImages.filter(img => img.conceptId === concept.id)
              const isActive = idx === activeIdx
              return (
                <button
                  key={concept.id}
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 6,
                    padding: '10px 16px',
                    background: isActive ? '#05050f' : 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${isActive ? '#0088ff' : 'transparent'}`,
                    borderRight: '1px solid #0a0a18',
                    color: isActive ? '#0088ff' : '#333',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}. {concept.title.length > 22 ? concept.title.slice(0, 22) + '…' : concept.title}
                  {imgs.length > 0 && (
                    <span style={{ color: isActive ? '#00ff88' : '#222', marginLeft: 6 }}>
                      [{imgs.length}]
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Active concept title */}
        <div style={{ padding: '8px 20px', background: '#05050f', borderBottom: '1px solid #0a0a18' }}>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#fff' }}>
            {activeConcept?.title}
          </div>
        </div>

        <div style={{ display: 'flex', minHeight: 480 }}>

          {/* Left — style selector + generate */}
          <div style={{ width: 240, minWidth: 240, borderRight: '2px solid #0a0a18', background: '#05050f', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '12px 14px', borderBottom: '1px solid #111' }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333', letterSpacing: 2, marginBottom: 10 }}>ESTILO VISUAL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStyle(s.id)}
                    style={{
                      fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                      padding: '7px 10px',
                      background: selectedStyle === s.id ? `${s.color}18` : 'transparent',
                      border: `2px solid ${selectedStyle === s.id ? s.color : '#1a1a2e'}`,
                      color: selectedStyle === s.id ? s.color : '#333',
                      cursor: 'pointer', textAlign: 'left',
                      boxShadow: selectedStyle === s.id ? `0 0 8px ${s.color}33` : 'none',
                    }}
                  >
                    {selectedStyle === s.id ? '▶ ' : '  '}{s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '10px 14px', flex: 1 }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#222', marginBottom: 6 }}>PROMPT</div>
              <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#2a2a3a', lineHeight: 1.6, maxHeight: 100, overflow: 'hidden', maskImage: 'linear-gradient(to bottom, black 40%, transparent)' }}>
                {finalPrompt || '—'}
              </div>
            </div>

            <div style={{ padding: 14, borderTop: '1px solid #111' }}>
              <button
                className="btn-pixel"
                disabled={isGeneratingThis || !finalPrompt}
                onClick={() => activeConcept && onGenerate(activeConcept.id, finalPrompt)}
                style={{
                  width: '100%',
                  color: isGeneratingThis ? '#555' : style.color,
                  borderColor: isGeneratingThis ? '#333' : style.color,
                  fontSize: 7, padding: '11px 0',
                  boxShadow: isGeneratingThis ? 'none' : `0 0 10px ${style.color}44`,
                }}
              >
                {isGeneratingThis
                  ? <span className="loading-dots">GENERANDO<span>.</span><span>.</span><span>.</span></span>
                  : `▶ GENERAR ${style.label}`}
              </button>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#111', textAlign: 'center', marginTop: 7 }}>
                9:16 · gemini-2.5-flash
              </div>
            </div>
          </div>

          {/* Right — image grid for active concept */}
          <div style={{ flex: 1, padding: 14, background: '#030308', overflowY: 'auto' }}>
            {conceptImages.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#111' }}>[ SIN IMÁGENES ]</div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#0a0a18' }}>Elige un estilo y presiona GENERAR</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {conceptImages.map((img, imgIdx) => {
                  const isSelected = img.id === selectedImageId
                  const ext = img.mime.includes('png') ? 'png' : 'jpg'
                  return (
                    <div key={img.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div
                        onClick={() => onSelectImage(img.id)}
                        style={{
                          border: `2px solid ${isSelected ? '#00ff88' : '#1a1a2e'}`,
                          boxShadow: isSelected ? '0 0 14px #00ff8844' : 'none',
                          cursor: 'pointer', background: '#000', position: 'relative',
                          aspectRatio: '9/16', overflow: 'hidden',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:${img.mime};base64,${img.base64}`} alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        {isSelected && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '3px solid #00ff88', pointerEvents: 'none' }}>
                            <div style={{ position: 'absolute', top: 6, right: 6, fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#00ff88', background: 'rgba(0,0,0,0.85)', padding: '3px 6px' }}>✓ VEO</div>
                          </div>
                        )}
                      </div>
                      {/* Fix 5: download button */}
                      <a
                        href={`data:${img.mime};base64,${img.base64}`}
                        download={`cantsleept-${imgIdx + 1}.${ext}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: 'block', textAlign: 'center',
                          fontFamily: '"Press Start 2P", monospace', fontSize: 5,
                          color: '#333', border: '1px solid #1a1a2e',
                          padding: '4px 0', textDecoration: 'none',
                          background: 'transparent',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#00ff88'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#00ff88' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#333'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1a1a2e' }}
                      >
                        ↓ DESCARGAR
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '7px 20px', borderTop: '1px solid #0a0a18', background: '#030308', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#1a1a2e' }}>
            {conceptImages.length === 0
              ? 'Genera imágenes para este concepto'
              : selectedImageId
                ? '▶ Imagen seleccionada — haz clic en ANIMAR CON VEO 3'
                : 'Haz clic en una imagen para seleccionarla y animarla'}
          </div>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#111' }}>
            {generatedImages.length} imagen{generatedImages.length !== 1 ? 'es' : ''} total
          </div>
        </div>
      </div>
    </div>
  )
}
