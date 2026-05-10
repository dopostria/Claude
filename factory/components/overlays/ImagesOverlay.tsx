'use client'

import { useState } from 'react'
import type { Concept, ImagePrompts } from '@/lib/types'

interface GeneratedImage {
  id: string
  conceptId: string
  base64: string
  mime: string
  timestamp: string
}

interface ImagesOverlayProps {
  selectedConcepts: Concept[]
  imagePrompts: Record<string, ImagePrompts>
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
  {
    id: 'FOTO',
    label: 'FOTO',
    color: '#00aaff',
    prefix: 'Ultra-realistic photograph, cinematic lighting, Sony A7R IV, 8K resolution. ',
  },
  {
    id: 'ANIME',
    label: 'ANIME',
    color: '#ff44cc',
    prefix: 'Vibrant anime illustration, Studio Ghibli inspired, clean linework, vivid cel-shaded colors. ',
  },
  {
    id: 'PELUCHE',
    label: 'PELUCHE',
    color: '#ffaa00',
    prefix: 'Plush toy aesthetic, soft fuzzy fabric texture, cute chibi style, pastel palette. ',
  },
  {
    id: 'CYBER',
    label: 'CYBER',
    color: '#00ff88',
    prefix: 'Cyberpunk neon aesthetic, Blade Runner vibes, dark moody atmosphere, glowing neon accents. ',
  },
  {
    id: 'ARTE',
    label: 'ARTE',
    color: '#ff6600',
    prefix: 'Bold digital painting, concept art quality, dynamic brushwork, rich saturated colors. ',
  },
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
}: ImagesOverlayProps) {
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id)
  const activeConcept = selectedConcepts[0]
  const basePrompt = activeConcept ? imagePrompts[activeConcept.id]?.gemini ?? '' : ''
  const style = STYLES.find(s => s.id === selectedStyle) ?? STYLES[0]
  const finalPrompt = basePrompt ? style.prefix + basePrompt + ASPECT_SUFFIX : ''

  const conceptImages = generatedImages.filter(img => img.conceptId === activeConcept?.id)

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-panel" style={{ borderColor: '#0088ff', maxWidth: 960 }}>

        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '2px solid #0a0a18',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#05050f', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#0088ff', letterSpacing: 2, marginBottom: 6 }}>
              NODO 3 — IMAGE ENGINE · GEMINI 2.5 FLASH
            </div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: '#fff' }}>
              {activeConcept?.title}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {selectedImageId && (
              <button className="btn-pixel" onClick={onContinueToVideo}
                style={{ color: '#00ff88', borderColor: '#00ff88', fontSize: 8, boxShadow: '0 0 12px #00ff8844' }}>
                ▶ ANIMAR CON VEO 3
              </button>
            )}
            <button className="btn-pixel" onClick={onClose} style={{ color: '#555', borderColor: '#333', fontSize: 8 }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'flex', minHeight: 520 }}>
          {/* Left — style + generate */}
          <div style={{ width: 260, minWidth: 260, borderRight: '2px solid #0a0a18', background: '#05050f', display: 'flex', flexDirection: 'column' }}>

            {/* Style selector */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #111' }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333', letterSpacing: 2, marginBottom: 10 }}>ESTILO VISUAL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStyle(s.id)}
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 7,
                      padding: '8px 10px',
                      background: selectedStyle === s.id ? `${s.color}18` : 'transparent',
                      border: `2px solid ${selectedStyle === s.id ? s.color : '#1a1a2e'}`,
                      color: selectedStyle === s.id ? s.color : '#333',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.1s',
                      boxShadow: selectedStyle === s.id ? `0 0 8px ${s.color}33` : 'none',
                    }}
                  >
                    {selectedStyle === s.id ? '▶ ' : '  '}{s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt preview */}
            <div style={{ padding: '12px 16px', flex: 1 }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#222', letterSpacing: 2, marginBottom: 6 }}>PROMPT</div>
              <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#333', lineHeight: 1.6, maxHeight: 120, overflow: 'hidden', maskImage: 'linear-gradient(to bottom, black 50%, transparent)' }}>
                {finalPrompt || 'Selecciona un concepto primero'}
              </div>
            </div>

            {/* Generate button */}
            <div style={{ padding: 16, borderTop: '1px solid #111' }}>
              <button
                className="btn-pixel"
                disabled={generating || !finalPrompt}
                onClick={() => activeConcept && onGenerate(activeConcept.id, finalPrompt)}
                style={{
                  width: '100%',
                  color: generating ? '#555' : style.color,
                  borderColor: generating ? '#333' : style.color,
                  fontSize: 8, padding: '12px 0',
                  boxShadow: generating ? 'none' : `0 0 12px ${style.color}44`,
                }}
              >
                {generating ? (
                  <span className="loading-dots">GENERANDO<span>.</span><span>.</span><span>.</span></span>
                ) : `▶ GENERAR ${style.label}`}
              </button>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#1a1a2e', textAlign: 'center', marginTop: 8 }}>
                9:16 · gemini-2.5-flash-image
              </div>
            </div>
          </div>

          {/* Right — image grid */}
          <div style={{ flex: 1, padding: 16, background: '#030308', overflowY: 'auto' }}>
            {conceptImages.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#111' }}>[ NO IMAGES YET ]</div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#0a0a18' }}>Elige un estilo y presiona GENERAR</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {conceptImages.map(img => {
                  const isSelected = img.id === selectedImageId
                  return (
                    <div key={img.id} onClick={() => onSelectImage(img.id)} style={{
                      border: `2px solid ${isSelected ? '#00ff88' : '#111'}`,
                      boxShadow: isSelected ? '0 0 14px #00ff8844' : 'none',
                      cursor: 'pointer', background: '#000', position: 'relative',
                      transition: 'border-color 0.15s', aspectRatio: '9/16',
                      overflow: 'hidden',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`data:${img.mime};base64,${img.base64}`} alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {isSelected && (
                        <div style={{
                          position: 'absolute', top: 6, right: 6,
                          fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                          color: '#00ff88', background: 'rgba(0,0,0,0.8)', padding: '3px 6px',
                        }}>✓</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer hint */}
        {conceptImages.length > 0 && !selectedImageId && (
          <div style={{ padding: '8px 20px', borderTop: '1px solid #0a0a18', background: '#05050f', textAlign: 'center' }}>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#1a1a2e' }}>
              ← Selecciona una imagen para animarla con Veo 3
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
