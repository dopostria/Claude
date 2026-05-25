'use client'

import { useState, useEffect } from 'react'
import type { Concept } from '@/lib/types'
import { loadAllDays, type PersistedDay } from '@/lib/persistence'

interface GeneratedImage {
  id: string
  conceptId: string
  base64: string
  mime: string
  imagePath: string
  timestamp: string
}

interface ImagesOverlayProps {
  selectedConcepts: Concept[]
  imagePrompts: Record<string, string>
  generatedImages: GeneratedImage[]
  selectedImageId: string | null
  onGenerate: (conceptId: string, prompt: string, provider: 'gemini' | 'higgsfield') => void
  onSelectImage: (id: string) => void
  onContinueToVideo: () => void
  onClose: () => void
  generating: boolean
  generatingFor: string | null
  onRestoreDay: (day: PersistedDay) => void
}

const STYLES = [
  { id: 'FOTO',    label: 'FOTO',    color: '#48cae4', prefix: 'Ultra-realistic photograph, cinematic lighting, Sony A7R IV, 8K resolution. ' },
  { id: 'ANIME',   label: 'ANIME',   color: '#a855f7', prefix: 'Vibrant anime illustration, Studio Ghibli inspired, clean linework, vivid cel-shaded colors. ' },
  { id: 'PELUCHE', label: 'PELUCHE', color: '#ff6b35', prefix: 'Plush toy aesthetic, soft fuzzy fabric texture, cute chibi style, pastel palette. ' },
  { id: 'CYBER',   label: 'CYBER',   color: '#00c4a0', prefix: 'Cyberpunk neon aesthetic, Blade Runner vibes, dark moody atmosphere, glowing neon accents. ' },
  { id: 'ARTE',    label: 'ARTE',    color: '#ffdd00', prefix: 'Bold digital painting, concept art quality, dynamic brushwork, rich saturated colors. ' },
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
  onRestoreDay,
}: ImagesOverlayProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id)
  const [provider, setProvider] = useState<'gemini' | 'higgsfield'>('higgsfield')
  const [editedBase, setEditedBase] = useState<Record<string, string>>({})
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyDays, setHistoryDays] = useState<PersistedDay[]>([])

  useEffect(() => {
    if (historyOpen) setHistoryDays(loadAllDays())
  }, [historyOpen])

  const activeConcept = selectedConcepts[activeIdx] ?? selectedConcepts[0]
  const rawBase = activeConcept ? imagePrompts[activeConcept.id] ?? '' : ''
  const basePrompt = activeConcept ? (editedBase[activeConcept.id] ?? rawBase) : ''
  const style = STYLES.find(s => s.id === selectedStyle) ?? STYLES[0]
  const finalPrompt = basePrompt ? style.prefix + basePrompt + ASPECT_SUFFIX : ''
  const conceptImages = generatedImages.filter(img => img.conceptId === activeConcept?.id)
  const isGeneratingThis = generating && generatingFor === activeConcept?.id

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-panel" style={{ borderColor: '#ff6b35', maxWidth: 1000 }}>

        {/* Header */}
        <div style={{
          padding: '11px 18px', borderBottom: '2px solid #0a0a18',
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
                  border: `1px solid ${historyOpen ? '#ff6b35' : '#0d3330'}`,
                  color: historyOpen ? '#ff6b35' : '#4a2010',
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
                  {historyDays.length === 0 && (
                    <div style={{ padding: '10px 14px', fontFamily: '"Orbitron", sans-serif', fontSize: 7, color: '#004d3d' }}>
                      _ sin historial
                    </div>
                  )}
                  {historyDays.map(day => (
                    <div
                      key={day.date}
                      onClick={() => { onRestoreDay(day); setHistoryOpen(false) }}
                      style={{
                        padding: '8px 14px', cursor: 'pointer',
                        borderBottom: '1px solid #0a1a18',
                        fontFamily: '"Share Tech Mono", monospace', fontSize: 12,
                        color: '#00c4a0', display: 'flex', gap: 10, alignItems: 'center',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#071412')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 6, color: '#00ffcc', minWidth: 90 }}>{day.date}</span>
                      <span style={{ color: '#004d3d' }}>
                        {day.concepts.length} ideas · {day.images.length} imgs · {day.videos.length} vids
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#ff6b35', letterSpacing: 3 }}>
              NODE_02 — PIXEL DAMAGE · {provider === 'gemini' ? 'GEMINI' : 'HIGGSFIELD'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            {selectedImageId && (
              <button className="btn-pixel" onClick={onContinueToVideo}
                style={{ color: '#00ffcc', borderColor: '#00c4a0', fontSize: 6, boxShadow: '0 0 12px rgba(0,196,160,0.35)' }}>
                ▶ ANIMAR CON VEO 3
              </button>
            )}
            <button className="btn-pixel" onClick={onClose} style={{ color: '#004d3d', borderColor: '#0d3330', fontSize: 7 }}>✕</button>
          </div>
        </div>

        {/* Concept tabs */}
        {selectedConcepts.length > 1 && (
          <div style={{
            display: 'flex', overflowX: 'auto', background: '#050e0d',
            borderBottom: '2px solid #0a0a14', gap: 0,
          }}>
            {selectedConcepts.map((concept, idx) => {
              const imgs = generatedImages.filter(img => img.conceptId === concept.id)
              const isActive = idx === activeIdx
              return (
                <button
                  key={concept.id}
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    fontFamily: '"Orbitron", sans-serif', fontSize: 6,
                    padding: '9px 14px',
                    background: isActive ? '#071412' : 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${isActive ? '#ff6b35' : 'transparent'}`,
                    borderRight: '1px solid #0d3330',
                    color: isActive ? '#ff6b35' : '#0d3330',
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  {idx + 1}. {concept.title.length > 22 ? concept.title.slice(0, 22) + '…' : concept.title}
                  {imgs.length > 0 && (
                    <span style={{ color: isActive ? '#00c4a0' : '#0d3330', marginLeft: 5 }}>[{imgs.length}]</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Active concept title */}
        <div style={{ padding: '7px 18px', background: '#050e0d', borderBottom: '1px solid #0d3330' }}>
          <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 9, color: '#fff' }}>
            {activeConcept?.title}
          </div>
        </div>

        <div style={{ display: 'flex', minHeight: 480 }}>

          {/* Left — style selector + editable prompt + generate */}
          <div style={{ width: 250, minWidth: 250, borderRight: '2px solid #0d3330', background: '#050e0d', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '11px 13px', borderBottom: '1px solid #0d3330' }}>
              <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#004d3d', letterSpacing: 2, marginBottom: 9 }}>ESTILO VISUAL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStyle(s.id)}
                    style={{
                      fontFamily: '"Orbitron", sans-serif', fontSize: 6,
                      padding: '6px 9px',
                      background: selectedStyle === s.id ? `${s.color}15` : 'transparent',
                      border: `2px solid ${selectedStyle === s.id ? s.color : '#0d3330'}`,
                      color: selectedStyle === s.id ? s.color : '#0d3330',
                      cursor: 'pointer', textAlign: 'left',
                      boxShadow: selectedStyle === s.id ? `0 0 8px ${s.color}33` : 'none',
                    }}
                  >
                    {selectedStyle === s.id ? '▶ ' : '  '}{s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable base prompt */}
            <div style={{ padding: '9px 13px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#004d3d', letterSpacing: 2, marginBottom: 6 }}>
                BASE PROMPT
              </div>
              <textarea
                value={basePrompt}
                onChange={e => activeConcept && setEditedBase(prev => ({ ...prev, [activeConcept.id]: e.target.value }))}
                rows={5}
                style={{
                  flex: 1,
                  background: '#060f0e',
                  border: '1px solid #0d3330',
                  color: '#00d4a8',
                  fontFamily: '"Share Tech Mono", monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                  padding: '6px 8px',
                  resize: 'none',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                placeholder="Prompt base aquí..."
              />
            </div>

            <div style={{ padding: 12, borderTop: '1px solid #0d3330' }}>
              {/* Provider toggle */}
              <div style={{ display: 'flex', marginBottom: 9, gap: 4 }}>
                {(['gemini', 'higgsfield'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    style={{
                      flex: 1,
                      fontFamily: '"Orbitron", sans-serif', fontSize: 5,
                      padding: '5px 0',
                      background: provider === p ? '#07201e' : 'transparent',
                      border: `1px solid ${provider === p ? '#00c4a0' : '#0d3330'}`,
                      color: provider === p ? '#00ffcc' : '#0d3330',
                      cursor: 'pointer',
                    }}
                  >
                    {p === 'gemini' ? 'GEMINI' : 'HIGGS'}
                  </button>
                ))}
              </div>
              <button
                className="btn-pixel"
                disabled={isGeneratingThis || !finalPrompt}
                onClick={() => activeConcept && onGenerate(activeConcept.id, finalPrompt, provider)}
                style={{
                  width: '100%',
                  color: isGeneratingThis ? '#004d3d' : style.color,
                  borderColor: isGeneratingThis ? '#0d3330' : style.color,
                  fontSize: 6, padding: '10px 0',
                  boxShadow: isGeneratingThis ? 'none' : `0 0 10px ${style.color}44`,
                }}
              >
                {isGeneratingThis
                  ? <span className="loading-dots">GENERANDO<span>.</span><span>.</span><span>.</span></span>
                  : `▶ GENERAR ${style.label}`}
              </button>
              <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#0d3330', textAlign: 'center', marginTop: 6 }}>
                {provider === 'gemini' ? '9:16 · gemini-2.0-flash (free)' : '9:16 · soul_v2 (higgs)'}
              </div>
            </div>
          </div>

          {/* Right — image grid */}
          <div style={{ flex: 1, padding: 12, background: '#060f0e', overflowY: 'auto' }}>
            {conceptImages.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 7, color: '#0d3330' }}>[ SIN IMÁGENES ]</div>
                <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 6, color: '#0a1412' }}>Elige un estilo y presiona GENERAR</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
                {conceptImages.map((img, imgIdx) => {
                  const isSelected = img.id === selectedImageId
                  const ext = img.mime.includes('png') ? 'png' : 'jpg'
                  return (
                    <div key={img.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div
                        onClick={() => onSelectImage(img.id)}
                        style={{
                          border: `2px solid ${isSelected ? '#00c4a0' : '#0d3330'}`,
                          boxShadow: isSelected ? '0 0 14px rgba(0,196,160,0.4)' : 'none',
                          cursor: 'pointer', background: '#000', position: 'relative',
                          aspectRatio: '9/16', overflow: 'hidden',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.imagePath || `data:${img.mime};base64,${img.base64}`} alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        {isSelected && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '3px solid #00c4a0', pointerEvents: 'none' }}>
                            <div style={{ position: 'absolute', top: 5, right: 5, fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#00ffcc', background: 'rgba(0,0,0,0.85)', padding: '3px 5px' }}>✓ VEO</div>
                          </div>
                        )}
                      </div>
                      <a
                        href={img.imagePath || `data:${img.mime};base64,${img.base64}`}
                        download={`cantsleept-${imgIdx + 1}.${ext}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: 'block', textAlign: 'center',
                          fontFamily: '"Orbitron", sans-serif', fontSize: 5,
                          color: '#0d3330', border: '1px solid #0d3330',
                          padding: '3px 0', textDecoration: 'none', background: 'transparent',
                        }}
                        onMouseEnter={e => {
                          const a = e.currentTarget as HTMLAnchorElement
                          a.style.color = '#00ffcc'; a.style.borderColor = '#00c4a0'
                        }}
                        onMouseLeave={e => {
                          const a = e.currentTarget as HTMLAnchorElement
                          a.style.color = '#0d3330'; a.style.borderColor = '#0d3330'
                        }}
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
        <div style={{ padding: '6px 18px', borderTop: '1px solid #0d3330', background: '#050e0d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#0d3330' }}>
            {conceptImages.length === 0
              ? 'Genera imágenes para este concepto'
              : selectedImageId
                ? '▶ Imagen seleccionada — haz clic en ANIMAR CON VEO 3'
                : 'Haz clic en una imagen para seleccionarla'}
          </div>
          <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#0a1412' }}>
            {generatedImages.length} imagen{generatedImages.length !== 1 ? 'es' : ''} total
          </div>
        </div>
      </div>
    </div>
  )
}
