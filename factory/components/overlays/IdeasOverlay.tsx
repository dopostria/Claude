'use client'

import { useState } from 'react'
import PixelBorder from '../PixelBorder'
import type { Concept, ImagePrompts } from '@/lib/types'

interface IdeasOverlayProps {
  concepts: Concept[]
  selectedIds: string[]
  imagePrompts: Record<string, ImagePrompts>
  onSelectConcept: (id: string) => void
  onConfirmSelection: () => void
  onClose: () => void
  processingPrompts: boolean
}

const TAG_COLORS: Record<string, string> = {
  Bolivia: '#ffdd00',
  POP_CULTURE: '#0088ff',
  COTIDIANO: '#00ff88',
}

const TAG_LABELS: Record<string, string> = {
  Bolivia: '🇧🇴 BOLIVIA',
  POP_CULTURE: '🎬 POP',
  COTIDIANO: '🌐 COTIDIANO',
}

export default function IdeasOverlay({
  concepts,
  selectedIds,
  imagePrompts,
  onSelectConcept,
  onConfirmSelection,
  onClose,
  processingPrompts,
}: IdeasOverlayProps) {
  const [expandedPrompts, setExpandedPrompts] = useState<string | null>(null)

  return (
    <div className="overlay-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-panel">
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '2px solid #1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#080810',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div>
            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 6,
              color: '#ffdd00',
              letterSpacing: 2,
              marginBottom: 6,
            }}>NODO 1 — IDEA ENGINE</div>
            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 11,
              color: '#00ff88',
            }}>
              {concepts.length} CONCEPTOS GENERADOS
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {selectedIds.length > 0 && (
              <div style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 8,
                color: '#00ff88',
              }}>
                {selectedIds.length} SELECTED
              </div>
            )}

            <button
              className="btn-pixel"
              onClick={onConfirmSelection}
              disabled={selectedIds.length === 0 || processingPrompts}
              style={{
                color: selectedIds.length > 0 ? '#00ff88' : '#333',
                borderColor: selectedIds.length > 0 ? '#00ff88' : '#333',
                boxShadow: selectedIds.length > 0 ? '0 0 12px #00ff8844' : 'none',
              }}
            >
              {processingPrompts ? (
                <span className="loading-dots">
                  GENERATING PROMPTS<span>.</span><span>.</span><span>.</span>
                </span>
              ) : (
                `CONFIRM SELECTION (${selectedIds.length})`
              )}
            </button>

            <button
              className="btn-pixel"
              onClick={onClose}
              style={{ color: '#555', borderColor: '#333', fontSize: 8 }}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* Concepts grid */}
        <div style={{
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}>
          {concepts.map((concept, idx) => {
            const isSelected = selectedIds.includes(concept.id)
            const hasPrompts = imagePrompts[concept.id] !== undefined
            const isExpanded = expandedPrompts === concept.id

            return (
              <div
                key={concept.id}
                className={`concept-card ${isSelected ? 'selected' : ''}`}
                style={{ position: 'relative' }}
              >
                {/* Card header */}
                <div style={{
                  padding: '12px 14px 10px',
                  borderBottom: '1px solid #111',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                }}>
                  <div style={{ flex: 1 }}>
                    {/* Index */}
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 6,
                      color: '#333',
                      marginBottom: 6,
                    }}>
                      #{String(idx + 1).padStart(2, '0')}
                      {concept.improved && (
                        <span style={{ color: '#ffdd00', marginLeft: 8 }}>↑ IMPROVED</span>
                      )}
                    </div>

                    {/* Title */}
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 9,
                      color: isSelected ? '#00ff88' : '#fff',
                      lineHeight: 1.5,
                      marginBottom: 8,
                    }}>
                      {concept.title}
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {concept.tags.map(tag => (
                        <span key={tag} style={{
                          fontFamily: '"Press Start 2P", monospace',
                          fontSize: 6,
                          color: TAG_COLORS[tag] || '#fff',
                          border: `1px solid ${TAG_COLORS[tag] || '#fff'}44`,
                          padding: '2px 6px',
                        }}>
                          {TAG_LABELS[tag] || tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Score badge */}
                  <ScoreBadge score={concept.scores.overall} />
                </div>

                {/* Concept content */}
                <div style={{ padding: '12px 14px' }}>
                  {/* Setup */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 6,
                      color: '#444',
                      marginBottom: 6,
                      letterSpacing: 2,
                    }}>SETUP VISUAL</div>
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 7,
                      color: '#aaa',
                      lineHeight: 1.8,
                    }}>
                      {concept.setup}
                    </div>
                  </div>

                  {/* Punchline */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 6,
                      color: '#ffdd0066',
                      marginBottom: 6,
                      letterSpacing: 2,
                    }}>PUNCHLINE</div>
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 7,
                      color: '#ffdd00',
                      lineHeight: 1.8,
                    }}>
                      {concept.punchline}
                    </div>
                  </div>

                  {/* Quality scores mini-bars */}
                  <div style={{ marginBottom: 12 }}>
                    <ScoreMini scores={concept.scores} />
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      className="btn-pixel"
                      onClick={() => onSelectConcept(concept.id)}
                      style={{
                        flex: 1,
                        color: isSelected ? '#00ff88' : '#666',
                        borderColor: isSelected ? '#00ff88' : '#333',
                        fontSize: 7,
                        padding: '8px 12px',
                        boxShadow: isSelected ? '0 0 10px #00ff8844' : 'none',
                      }}
                    >
                      {isSelected ? '✓ SELECTED' : '+ SELECT'}
                    </button>

                    {hasPrompts && (
                      <button
                        className="btn-pixel"
                        onClick={() => setExpandedPrompts(isExpanded ? null : concept.id)}
                        style={{
                          color: '#0088ff',
                          borderColor: '#0088ff44',
                          fontSize: 7,
                          padding: '8px 12px',
                        }}
                      >
                        {isExpanded ? '▲ PROMPTS' : '▼ PROMPTS'}
                      </button>
                    )}
                  </div>

                  {/* Prompts expanded */}
                  {isExpanded && hasPrompts && (
                    <PromptExpanded prompts={imagePrompts[concept.id]} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {selectedIds.length > 0 && (
          <div style={{
            padding: '14px 24px',
            borderTop: '2px solid #1a1a2e',
            background: '#080810',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            bottom: 0,
          }}>
            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 7,
              color: '#00ff88',
            }}>
              {selectedIds.length} CONCEPT{selectedIds.length > 1 ? 'S' : ''} SELECTED → READY FOR IMAGE ENGINE
            </div>
            <button
              className="btn-pixel"
              onClick={onConfirmSelection}
              disabled={processingPrompts}
              style={{
                color: '#00ff88',
                borderColor: '#00ff88',
                fontSize: 8,
                padding: '10px 20px',
                boxShadow: '0 0 14px #00ff8855',
              }}
            >
              {processingPrompts ? (
                <span className="loading-dots">WORKING<span>.</span><span>.</span><span>.</span></span>
              ) : '▶ CONFIRM + GENERATE PROMPTS'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 9 ? '#00ff88' : score >= 7 ? '#ffdd00' : '#ff0040'
  return (
    <div style={{
      flexShrink: 0,
      width: 36,
      height: 36,
      border: `2px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 0 8px ${color}44`,
    }}>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 11,
        color,
        lineHeight: 1,
      }}>{score}</div>
    </div>
  )
}

function ScoreMini({ scores }: { scores: Concept['scores'] }) {
  const bars = [
    { key: 'scroll_stop', label: '📱' },
    { key: 'no_explanation', label: '💡' },
    { key: 'contrast_not_cruelty', label: '⚖' },
    { key: 'no_audio', label: '🔇' },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {bars.map(({ key, label }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8,
            width: 16,
            flexShrink: 0,
          }}>{label}</div>
          <div className="score-bar" style={{ flex: 1 }}>
            <div
              className="score-fill"
              style={{
                width: `${scores[key] * 10}%`,
                background: scores[key] >= 8 ? '#00ff88'
                  : scores[key] >= 6 ? '#ffdd00'
                  : '#ff0040',
              }}
            />
          </div>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            color: '#555',
            width: 12,
            textAlign: 'right',
            flexShrink: 0,
          }}>{scores[key]}</div>
        </div>
      ))}
    </div>
  )
}

function PromptExpanded({ prompts }: { prompts: ImagePrompts }) {
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <PromptBox label="GEMINI IMAGEN 3" color="#00ff88" text={prompts.gemini} />
      <PromptBox label="HIGGSFIELD NANO BANANA 2" color="#0088ff" text={prompts.higgsfield} />
    </div>
  )
}

function PromptBox({ label, color, text }: { label: string; color: string; text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{
      border: `1px solid ${color}33`,
      background: '#050508',
      padding: '10px 12px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 6,
          color,
          letterSpacing: 1,
        }}>{label}</div>
        <button
          onClick={handleCopy}
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
            color: copied ? '#00ff88' : '#555',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {copied ? '✓ COPIED' : 'COPY'}
        </button>
      </div>
      <div style={{
        fontFamily: 'monospace',
        fontSize: 9,
        color: '#888',
        lineHeight: 1.5,
        wordBreak: 'break-word',
      }}>{text}</div>
    </div>
  )
}
