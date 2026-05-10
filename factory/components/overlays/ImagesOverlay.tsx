'use client'

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
  const activeConcept = selectedConcepts[0]
  const prompt = activeConcept ? imagePrompts[activeConcept.id]?.gemini ?? '' : ''
  const conceptImages = generatedImages.filter(img => img.conceptId === activeConcept?.id)
  const selectedImage = generatedImages.find(img => img.id === selectedImageId)

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-panel" style={{ borderColor: '#0088ff', maxWidth: 900 }}>

        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '2px solid #0a0a18',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#05050f', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#0088ff', letterSpacing: 2, marginBottom: 6 }}>
              NODO 3 — IMAGE ENGINE · GEMINI 2.0 FLASH
            </div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: '#fff' }}>
              {activeConcept?.title}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {selectedImageId && (
              <button className="btn-pixel" onClick={onContinueToVideo}
                style={{ color: '#00ff88', borderColor: '#00ff88', fontSize: 8, boxShadow: '0 0 12px #00ff8844' }}>
                ▶ ANIMAR CON VEO 3
              </button>
            )}
            <button className="btn-pixel" onClick={onClose} style={{ color: '#555', borderColor: '#333', fontSize: 8 }}>✕</button>
          </div>
        </div>

        <div style={{ display: 'flex', minHeight: 460 }}>
          {/* Left — prompt + generate */}
          <div style={{ width: 280, minWidth: 280, borderRight: '2px solid #0a0a18', background: '#05050f', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', flex: 1 }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333', letterSpacing: 2, marginBottom: 8 }}>PROMPT</div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#555', lineHeight: 1.6, maxHeight: 200, overflow: 'hidden', maskImage: 'linear-gradient(to bottom, black 60%, transparent)' }}>
                {prompt || 'Selecciona un concepto primero'}
              </div>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #111' }}>
              <button
                className="btn-pixel"
                disabled={generating || !prompt}
                onClick={() => activeConcept && onGenerate(activeConcept.id, prompt)}
                style={{
                  width: '100%', color: generating ? '#555' : '#0088ff',
                  borderColor: generating ? '#333' : '#0088ff', fontSize: 8, padding: '12px 0',
                  boxShadow: generating ? 'none' : '0 0 12px #0088ff44',
                }}
              >
                {generating ? (
                  <span className="loading-dots">GENERANDO<span>.</span><span>.</span><span>.</span></span>
                ) : '▶ GENERAR'}
              </button>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#222', textAlign: 'center', marginTop: 8 }}>
                gemini-2.0-flash
              </div>
            </div>
          </div>

          {/* Right — image grid */}
          <div style={{ flex: 1, padding: 20, background: '#030308' }}>
            {conceptImages.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#111' }}>[ NO IMAGES YET ]</div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#0a0a18' }}>Presiona GENERAR</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {conceptImages.map(img => {
                  const isSelected = img.id === selectedImageId
                  return (
                    <div key={img.id} onClick={() => onSelectImage(img.id)} style={{
                      border: `2px solid ${isSelected ? '#00ff88' : '#111'}`,
                      boxShadow: isSelected ? '0 0 14px #00ff8844' : 'none',
                      cursor: 'pointer', background: '#000', position: 'relative',
                      transition: 'border-color 0.15s',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`data:${img.mime};base64,${img.base64}`} alt="" style={{ width: '100%', display: 'block', imageRendering: 'auto' }} />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        padding: '5px 8px', background: 'rgba(0,0,0,0.85)',
                        display: 'flex', justifyContent: 'space-between',
                      }}>
                        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333' }}>GEMINI FLASH</div>
                        {isSelected && <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#00ff88' }}>✓ OK</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
