'use client'

import { useState } from 'react'
import PixelBorder from '../PixelBorder'
import type { Concept, ImagePrompts } from '@/lib/types'

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

interface ImagesOverlayProps {
  selectedConcepts: Concept[]
  imagePrompts: Record<string, ImagePrompts>
  generatedImages: GeneratedImage[]
  selectedImageId: string | null
  onGenerate: (conceptId: string, prompt: string, tool: 'gemini' | 'higgsfield-nano-banana' | 'higgsfield') => void
  onSelectImage: (id: string) => void
  onContinueToVideo: () => void
  onClose: () => void
  generating: boolean
  generatingFor: string | null
}

const TOOLS = [
  { id: 'higgsfield-nano-banana' as const, label: 'NANO BANANA PRO', color: '#ff0040', desc: 'Higgsfield · recomendado' },
  { id: 'gemini' as const, label: 'GEMINI FLASH', color: '#00ff88', desc: 'Google · rápido' },
]

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
  const [selectedTool, setSelectedTool] = useState<'gemini' | 'higgsfield-nano-banana' | 'higgsfield'>('higgsfield-nano-banana')
  const [activeConcept, setActiveConcept] = useState<string>(selectedConcepts[0]?.id ?? '')

  const concept = selectedConcepts.find(c => c.id === activeConcept)
  const prompts = concept ? imagePrompts[concept.id] : null
  const conceptImages = generatedImages.filter(img => img.conceptId === activeConcept)
  const selectedImage = generatedImages.find(img => img.id === selectedImageId)

  const prompt = prompts
    ? (selectedTool === 'gemini' ? prompts.gemini : prompts.higgsfield)
    : ''

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-panel" style={{ borderColor: '#0088ff' }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '2px solid #0a0a18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#05050f',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#0088ff', letterSpacing: 2, marginBottom: 6 }}>
              NODO 3 — IMAGE ENGINE
            </div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 11, color: '#fff' }}>
              GENERAR IMAGEN
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {selectedImageId && (
              <button className="btn-pixel" onClick={onContinueToVideo}
                style={{ color: '#00ff88', borderColor: '#00ff88', fontSize: 8, boxShadow: '0 0 12px #00ff8844' }}>
                ▶ CONTINUAR A VIDEO
              </button>
            )}
            <button className="btn-pixel" onClick={onClose}
              style={{ color: '#555', borderColor: '#333', fontSize: 8 }}>
              ✕
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0, minHeight: 500 }}>
          {/* Left panel — concept selector + tool + generate */}
          <div style={{
            width: 320,
            minWidth: 320,
            borderRight: '2px solid #0a0a18',
            display: 'flex',
            flexDirection: 'column',
            background: '#05050f',
          }}>
            {/* Concept tabs */}
            {selectedConcepts.length > 1 && (
              <div style={{ borderBottom: '1px solid #111', padding: '10px 16px' }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333', marginBottom: 8 }}>
                  CONCEPTO
                </div>
                {selectedConcepts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConcept(c.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 7,
                      color: activeConcept === c.id ? '#0088ff' : '#444',
                      background: 'none',
                      border: 'none',
                      borderLeft: `2px solid ${activeConcept === c.id ? '#0088ff' : 'transparent'}`,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      marginBottom: 4,
                    }}
                  >
                    {c.title.slice(0, 24)}
                  </button>
                ))}
              </div>
            )}

            {/* Active concept info */}
            {concept && (
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #111' }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#fff', lineHeight: 1.5, marginBottom: 8 }}>
                  {concept.title}
                </div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#ffdd00', lineHeight: 1.7 }}>
                  {concept.punchline}
                </div>
              </div>
            )}

            {/* Tool selector */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #111' }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333', letterSpacing: 2, marginBottom: 10 }}>
                HERRAMIENTA
              </div>
              {TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    background: selectedTool === tool.id ? `${tool.color}11` : 'none',
                    border: `2px solid ${selectedTool === tool.id ? tool.color : '#222'}`,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    marginBottom: 8,
                  }}
                >
                  <div style={{
                    width: 8, height: 8,
                    background: selectedTool === tool.id ? tool.color : '#333',
                    boxShadow: selectedTool === tool.id ? `0 0 8px ${tool.color}` : 'none',
                  }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: selectedTool === tool.id ? tool.color : '#555' }}>
                      {tool.label}
                    </div>
                    <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333', marginTop: 4 }}>
                      {tool.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Prompt preview */}
            {prompt && (
              <div style={{ padding: '14px 16px', flex: 1, overflow: 'hidden' }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#333', letterSpacing: 2, marginBottom: 8 }}>
                  PROMPT
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: 9,
                  color: '#555',
                  lineHeight: 1.5,
                  maxHeight: 120,
                  overflow: 'hidden',
                  maskImage: 'linear-gradient(to bottom, black 70%, transparent)',
                }}>
                  {prompt}
                </div>
              </div>
            )}

            {/* Generate button */}
            <div style={{ padding: 16, borderTop: '1px solid #111' }}>
              <button
                className="btn-pixel"
                disabled={generating || !prompt}
                onClick={() => concept && prompts && onGenerate(concept.id, prompt, selectedTool)}
                style={{
                  width: '100%',
                  color: generating ? '#555' : '#0088ff',
                  borderColor: generating ? '#333' : '#0088ff',
                  fontSize: 8,
                  padding: '12px 0',
                  boxShadow: generating ? 'none' : '0 0 12px #0088ff44',
                }}
              >
                {generating && generatingFor === activeConcept ? (
                  <span className="loading-dots">GENERANDO<span>.</span><span>.</span><span>.</span></span>
                ) : '▶ GENERAR IMAGEN'}
              </button>
            </div>
          </div>

          {/* Right panel — image grid */}
          <div style={{ flex: 1, padding: 20, background: '#030308' }}>
            {conceptImages.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: 16,
              }}>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: '#1a1a2e' }}>
                  [ NO IMAGES YET ]
                </div>
                <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#111' }}>
                  Selecciona herramienta y presiona GENERAR
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {conceptImages.map(img => {
                  const isSelected = img.id === selectedImageId
                  return (
                    <div
                      key={img.id}
                      onClick={() => onSelectImage(img.id)}
                      style={{
                        border: `2px solid ${isSelected ? '#00ff88' : '#111'}`,
                        boxShadow: isSelected ? '0 0 14px #00ff8844' : 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        background: '#000',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:${img.mime};base64,${img.base64}`}
                        alt={img.tool}
                        style={{ width: '100%', display: 'block', imageRendering: 'auto' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '6px 8px',
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#555' }}>
                          {img.tool.toUpperCase()}
                        </div>
                        {isSelected && (
                          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#00ff88' }}>
                            ✓ SELECTED
                          </div>
                        )}
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
