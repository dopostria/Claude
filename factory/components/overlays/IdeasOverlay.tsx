'use client'

import { useState, useEffect, useRef } from 'react'
import type { Concept } from '@/lib/types'

interface IdeasOverlayProps {
  concepts: Concept[]
  selectedIds: string[]
  imagePrompts: Record<string, string>
  videoPrompts: Record<string, string>
  onSelectConcept: (id: string) => void
  onConfirmSelection: () => void
  onOpenImages: (imagePrompts: Record<string, string>, videoPrompts: Record<string, string>) => void
  onClose: () => void
  processingPrompts: boolean
}

const TAG_COLORS: Record<string, string> = {
  Bolivia:    '#ffdd00',
  POP_CULTURE:'#48cae4',
  COTIDIANO:  '#00c4a0',
}

const TAG_LABELS: Record<string, string> = {
  Bolivia:    '🇧🇴 BOLIVIA',
  POP_CULTURE:'🎬 POP',
  COTIDIANO:  '🌐 COTIDIANO',
}

export default function IdeasOverlay({
  concepts,
  selectedIds,
  imagePrompts,
  videoPrompts,
  onSelectConcept,
  onConfirmSelection,
  onOpenImages,
  onClose,
  processingPrompts,
}: IdeasOverlayProps) {
  // Local editable copies of the prompts
  const [localImage, setLocalImage] = useState<Record<string, string>>(imagePrompts)
  const [localVideo, setLocalVideo] = useState<Record<string, string>>(videoPrompts)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const prevImageRef = useRef(imagePrompts)
  const prevVideoRef = useRef(videoPrompts)

  useEffect(() => {
    if (imagePrompts !== prevImageRef.current) {
      setLocalImage(imagePrompts)
      prevImageRef.current = imagePrompts
      // Auto-expand first selected concept when prompts arrive
      if (selectedIds.length > 0) setExpandedId(selectedIds[0])
    }
  }, [imagePrompts, selectedIds])

  useEffect(() => {
    if (videoPrompts !== prevVideoRef.current) {
      setLocalVideo(videoPrompts)
      prevVideoRef.current = videoPrompts
    }
  }, [videoPrompts])

  const promptsReady = selectedIds.length > 0 && selectedIds.every(id => localImage[id] && localVideo[id])

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-panel">

        {/* Header */}
        <div style={{
          padding: '14px 22px',
          borderBottom: '2px solid #0d3330',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#050e0d',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#004d3d', letterSpacing: 3, marginBottom: 5 }}>
              NODE_01 — 3AM THOUGHTS
            </div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 11, color: '#00c4a0' }}>
              {concepts.length} CONCEPTOS
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selectedIds.length > 0 && !promptsReady && (
              <button
                className="btn-pixel"
                onClick={onConfirmSelection}
                disabled={selectedIds.length === 0 || processingPrompts}
                style={{
                  color: selectedIds.length > 0 ? '#00ffcc' : '#0d3330',
                  borderColor: selectedIds.length > 0 ? '#00c4a0' : '#0d3330',
                  boxShadow: selectedIds.length > 0 ? '0 0 12px rgba(0,196,160,0.3)' : 'none',
                  fontSize: 7,
                }}
              >
                {processingPrompts ? (
                  <span className="loading-dots">GENERANDO PROMPTS<span>.</span><span>.</span><span>.</span></span>
                ) : (
                  `▶ GENERAR PROMPTS (${selectedIds.length})`
                )}
              </button>
            )}

            {promptsReady && (
              <button
                className="btn-pixel"
                onClick={() => onOpenImages(localImage, localVideo)}
                style={{
                  color: '#ff6b35',
                  borderColor: '#ff6b35',
                  fontSize: 7,
                  boxShadow: '0 0 14px rgba(255,107,53,0.4)',
                }}
              >
                ▶ ABRIR PIXEL DAMAGE
              </button>
            )}

            <button
              className="btn-pixel"
              onClick={onClose}
              style={{ color: '#004d3d', borderColor: '#0d3330', fontSize: 7 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Concepts grid */}
        <div style={{
          padding: '18px 22px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 14,
        }}>
          {concepts.map((concept, idx) => {
            const isSelected  = selectedIds.includes(concept.id)
            const hasPrompts  = !!(localImage[concept.id] && localVideo[concept.id])
            const isExpanded  = expandedId === concept.id

            return (
              <div
                key={concept.id}
                className={`concept-card ${isSelected ? 'selected' : ''}`}
                style={{ position: 'relative' }}
              >
                {/* Card header */}
                <div style={{
                  padding: '11px 13px 9px',
                  borderBottom: '1px solid #0d3330',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 5,
                      color: '#0d3330',
                      marginBottom: 5,
                    }}>
                      #{String(idx + 1).padStart(2, '0')}
                      <span style={{ color: '#004d3d', marginLeft: 8 }}>{concept.archetype}</span>
                    </div>
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 9,
                      color: isSelected ? '#00ffcc' : '#fff',
                      lineHeight: 1.5,
                      marginBottom: 7,
                    }}>
                      {concept.title}
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {concept.tags.map(tag => (
                        <span key={tag} style={{
                          fontFamily: '"Press Start 2P", monospace',
                          fontSize: 5,
                          color: TAG_COLORS[tag] || '#fff',
                          border: `1px solid ${TAG_COLORS[tag] || '#fff'}44`,
                          padding: '2px 5px',
                        }}>
                          {TAG_LABELS[tag] || tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ScoreBadge qualityScore={concept.quality_score} />
                </div>

                {/* Concept content */}
                <div style={{ padding: '11px 13px' }}>
                  <div style={{ marginBottom: 9 }}>
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 5,
                      color: '#004d3d',
                      marginBottom: 5,
                      letterSpacing: 2,
                    }}>SETUP VISUAL</div>
                    <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#00a882', lineHeight: 1.8 }}>
                      {concept.setup}
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 5,
                      color: '#ff6b3566',
                      marginBottom: 5,
                      letterSpacing: 2,
                    }}>PUNCHLINE</div>
                    <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#ff6b35', lineHeight: 1.8 }}>
                      {concept.punchline}
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <ScoreMini qualityScore={concept.quality_score} />
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                    <button
                      className="btn-pixel"
                      onClick={() => onSelectConcept(concept.id)}
                      style={{
                        flex: 1,
                        color: isSelected ? '#00ffcc' : '#004d3d',
                        borderColor: isSelected ? '#00c4a0' : '#0d3330',
                        fontSize: 6,
                        padding: '7px 10px',
                        boxShadow: isSelected ? '0 0 10px rgba(0,196,160,0.3)' : 'none',
                      }}
                    >
                      {isSelected ? '✓ SELECTED' : '+ SELECT'}
                    </button>

                    {hasPrompts && (
                      <button
                        className="btn-pixel"
                        onClick={() => setExpandedId(isExpanded ? null : concept.id)}
                        style={{
                          color: '#48cae4',
                          borderColor: '#48cae444',
                          fontSize: 6,
                          padding: '7px 10px',
                        }}
                      >
                        {isExpanded ? '▲ PROMPTS' : '▼ PROMPTS'}
                      </button>
                    )}
                  </div>

                  {/* Expanded editable prompts */}
                  {isExpanded && hasPrompts && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <EditablePrompt
                        label="IMAGE PROMPT"
                        color="#00c4a0"
                        value={localImage[concept.id] ?? ''}
                        onChange={v => setLocalImage(prev => ({ ...prev, [concept.id]: v }))}
                      />
                      <EditablePrompt
                        label="VIDEO PROMPT"
                        color="#ff6b35"
                        value={localVideo[concept.id] ?? ''}
                        onChange={v => setLocalVideo(prev => ({ ...prev, [concept.id]: v }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {promptsReady && (
          <div style={{
            padding: '12px 22px',
            borderTop: '2px solid #0d3330',
            background: '#050e0d',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            bottom: 0,
          }}>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#00c4a0' }}>
              {selectedIds.length} CONCEPTO{selectedIds.length > 1 ? 'S' : ''} — PROMPTS LISTOS
            </div>
            <button
              className="btn-pixel"
              onClick={() => onOpenImages(localImage, localVideo)}
              style={{
                color: '#ff6b35',
                borderColor: '#ff6b35',
                fontSize: 8,
                padding: '10px 20px',
                boxShadow: '0 0 16px rgba(255,107,53,0.4)',
              }}
            >
              ▶ ABRIR PIXEL DAMAGE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreBadge({ qualityScore }: { qualityScore: Concept['quality_score'] }) {
  const passed = [
    qualityScore.F1_scroll_stop,
    qualityScore.F2_punchline_clear,
    qualityScore.F3_contrast_not_cruel,
    qualityScore.F4_works_silent,
  ].filter(Boolean).length
  const color = passed === 4 ? '#00c4a0' : passed === 3 ? '#ff6b35' : '#ff3030'
  return (
    <div style={{
      flexShrink: 0, width: 34, height: 34,
      border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 8px ${color}44`,
    }}>
      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color, lineHeight: 1 }}>{passed}/4</div>
    </div>
  )
}

function ScoreMini({ qualityScore }: { qualityScore: Concept['quality_score'] }) {
  const filters = [
    { key: 'F1_scroll_stop'        as const, label: '📱' },
    { key: 'F2_punchline_clear'    as const, label: '💡' },
    { key: 'F3_contrast_not_cruel' as const, label: '⚖'  },
    { key: 'F4_works_silent'       as const, label: '🔇' },
  ]
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {filters.map(({ key, label }) => {
        const pass = qualityScore[key]
        return (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ fontSize: 9 }}>{label}</div>
            <div style={{
              width: 8, height: 8,
              background: pass ? '#00c4a0' : '#ff3030',
              boxShadow: pass ? '0 0 4px #00c4a044' : 'none',
            }} />
          </div>
        )
      })}
    </div>
  )
}

function EditablePrompt({
  label, color, value, onChange,
}: {
  label: string
  color: string
  value: string
  onChange: (v: string) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ border: `1px solid ${color}33`, background: '#050e0d', padding: '9px 11px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color, letterSpacing: 1 }}>{label}</div>
        <button
          onClick={handleCopy}
          style={{
            fontFamily: '"Press Start 2P", monospace', fontSize: 5,
            color: copied ? '#00ffcc' : '#004d3d',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          {copied ? '✓ COPIED' : 'COPY'}
        </button>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        style={{
          width: '100%',
          background: '#060f0e',
          border: `1px solid ${color}22`,
          color: '#00a882',
          fontFamily: 'monospace',
          fontSize: 8,
          lineHeight: 1.6,
          padding: '6px 8px',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
