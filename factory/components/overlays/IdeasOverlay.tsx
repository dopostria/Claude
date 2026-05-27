'use client'

import { useState, useEffect, useRef } from 'react'
import type { Concept } from '@/lib/types'
import type { GitHubSession } from '@/lib/session-types'
import { todayStr } from '@/lib/persistence'

interface IdeasOverlayProps {
  concepts: Concept[]
  selectedIds: string[]
  imagePrompts: Record<string, string>
  videoPrompts: Record<string, string>
  allSessions: GitHubSession[]
  onSelectConcept: (id: string) => void
  onConfirmSelection: () => void
  onOpenImages: (imagePrompts: Record<string, string>, videoPrompts: Record<string, string>) => void
  onClose: () => void
  processingPrompts: boolean
  onRestoreSession: (session: GitHubSession) => void
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
  allSessions,
  onSelectConcept,
  onConfirmSelection,
  onOpenImages,
  onClose,
  processingPrompts,
  onRestoreSession,
}: IdeasOverlayProps) {
  const [localImage, setLocalImage] = useState<Record<string, string>>(imagePrompts)
  const [localVideo, setLocalVideo] = useState<Record<string, string>>(videoPrompts)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'IDEAS' | 'PROMPTS'>('IDEAS')

  const prevImageRef = useRef(imagePrompts)
  const prevVideoRef = useRef(videoPrompts)

  useEffect(() => {
    if (imagePrompts !== prevImageRef.current) {
      setLocalImage(imagePrompts)
      prevImageRef.current = imagePrompts
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
  const today = todayStr()
  const pastSessions = allSessions.filter(s => s.date !== today)

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* History toggle */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setHistoryOpen(o => !o)}
                style={{
                  fontFamily: '"Orbitron", sans-serif', fontSize: 7,
                  background: historyOpen ? '#07201e' : 'transparent',
                  border: `1px solid ${historyOpen ? '#00c4a0' : '#0d3330'}`,
                  color: historyOpen ? '#00ffcc' : '#004d3d',
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
                  {allSessions.length === 0 && (
                    <div style={{ padding: '10px 14px', fontFamily: '"Orbitron", sans-serif', fontSize: 7, color: '#004d3d' }}>
                      _ sin historial
                    </div>
                  )}
                  {allSessions.map(session => (
                    <div
                      key={session.date}
                      onClick={() => { onRestoreSession(session); setHistoryOpen(false) }}
                      style={{
                        padding: '8px 14px', cursor: 'pointer',
                        borderBottom: '1px solid #0a1a18',
                        fontFamily: '"Share Tech Mono", monospace', fontSize: 12,
                        color: '#00c4a0', display: 'flex', gap: 10, alignItems: 'center',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#071412')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 6, color: '#00ffcc', minWidth: 90 }}>{session.date}</span>
                      <span style={{ color: '#004d3d' }}>
                        {session.concepts.length} ideas · {session.videos.length} vids
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['IDEAS', 'PROMPTS'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    fontFamily: '"Orbitron", sans-serif', fontSize: 7,
                    padding: '5px 12px', cursor: 'pointer',
                    background: activeTab === tab ? '#071412' : 'transparent',
                    border: `1px solid ${activeTab === tab ? '#00c4a0' : '#0d3330'}`,
                    color: activeTab === tab ? '#00ffcc' : '#004d3d',
                  }}
                >
                  [{tab}]
                </button>
              ))}
            </div>

            {activeTab === 'IDEAS' && (
              <div>
                <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color: '#004d3d', letterSpacing: 3, marginBottom: 5 }}>
                  NODE_01 — 3AM THOUGHTS
                </div>
                <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 11, color: '#00c4a0' }}>
                  {concepts.length} CONCEPTOS
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeTab === 'IDEAS' && selectedIds.length > 0 && !promptsReady && (
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

            {activeTab === 'IDEAS' && promptsReady && (
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

        {/* IDEAS TAB */}
        {activeTab === 'IDEAS' && (
          <>
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
                          fontFamily: '"Orbitron", sans-serif',
                          fontSize: 5,
                          color: '#0d3330',
                          marginBottom: 5,
                        }}>
                          #{String(idx + 1).padStart(2, '0')}
                          <span style={{ color: '#004d3d', marginLeft: 8 }}>{concept.archetype}</span>
                        </div>
                        <div style={{
                          fontFamily: '"Orbitron", sans-serif',
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
                              fontFamily: '"Orbitron", sans-serif',
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

                    <div style={{ padding: '11px 13px' }}>
                      <div style={{ marginBottom: 9 }}>
                        <div style={{
                          fontFamily: '"Orbitron", sans-serif',
                          fontSize: 5,
                          color: '#004d3d',
                          marginBottom: 5,
                          letterSpacing: 2,
                        }}>SETUP VISUAL</div>
                        <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 13, color: '#00d4a8', lineHeight: 1.6 }}>
                          {concept.setup}
                        </div>
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <div style={{
                          fontFamily: '"Orbitron", sans-serif',
                          fontSize: 5,
                          color: '#ff6b3566',
                          marginBottom: 5,
                          letterSpacing: 2,
                        }}>PUNCHLINE</div>
                        <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 13, color: '#ff6b35', lineHeight: 1.6 }}>
                          {concept.punchline}
                        </div>
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <ScoreMini qualityScore={concept.quality_score} />
                      </div>

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
                <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 6, color: '#00c4a0' }}>
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
          </>
        )}

        {/* PROMPTS TAB */}
        {activeTab === 'PROMPTS' && (
          <div style={{ padding: '18px 22px', overflowY: 'auto' }}>
            {/* Current session */}
            {concepts.some(c => localImage[c.id] || localVideo[c.id]) && (
              <PromptSection
                label="HOY"
                labelColor="#00ffcc"
                concepts={concepts}
                imagePrompts={localImage}
                videoPrompts={localVideo}
              />
            )}

            {/* Past sessions */}
            {pastSessions.length === 0 && !concepts.some(c => localImage[c.id] || localVideo[c.id]) && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 8, color: '#0d3330', marginBottom: 10 }}>
                  [ SIN PROMPTS ]
                </div>
                <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 6, color: '#0a1412' }}>
                  Genera conceptos y prompts primero
                </div>
              </div>
            )}

            {pastSessions.map(session => (
              session.concepts.some(c => session.imagePrompts[c.id] || session.videoPrompts[c.id]) && (
                <PromptSection
                  key={session.date}
                  label={session.date}
                  labelColor="#004d3d"
                  concepts={session.concepts}
                  imagePrompts={session.imagePrompts}
                  videoPrompts={session.videoPrompts}
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PromptSection({
  label, labelColor, concepts, imagePrompts, videoPrompts,
}: {
  label: string
  labelColor: string
  concepts: Concept[]
  imagePrompts: Record<string, string>
  videoPrompts: Record<string, string>
}) {
  const withPrompts = concepts.filter(c => imagePrompts[c.id] || videoPrompts[c.id])
  if (withPrompts.length === 0) return null
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontFamily: '"Orbitron", sans-serif', fontSize: 6, color: labelColor,
        letterSpacing: 3, marginBottom: 14, paddingBottom: 6,
        borderBottom: `1px solid ${labelColor}33`,
      }}>
        ── {label} ──
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {withPrompts.map(concept => (
          <div key={concept.id} style={{ border: '1px solid #0d3330', background: '#060f0e', padding: '11px 13px' }}>
            <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 8, color: '#fff', marginBottom: 10 }}>
              {concept.title}
            </div>
            {imagePrompts[concept.id] && (
              <CopyRow label="IMG" color="#00c4a0" value={imagePrompts[concept.id]} />
            )}
            {videoPrompts[concept.id] && (
              <CopyRow label="VID" color="#ff6b35" value={videoPrompts[concept.id]} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CopyRow({ label, color, value }: { label: string; color: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color, letterSpacing: 1 }}>{label} PROMPT</span>
        <button
          onClick={handleCopy}
          style={{
            fontFamily: '"Orbitron", sans-serif', fontSize: 5,
            color: copied ? '#00ffcc' : '#004d3d',
            background: 'none', border: `1px solid ${copied ? '#00c4a0' : '#0d3330'}`,
            cursor: 'pointer', padding: '2px 8px',
          }}
        >
          {copied ? '✓ COPIADO' : 'COPY'}
        </button>
      </div>
      <div style={{
        fontFamily: '"Share Tech Mono", monospace', fontSize: 11,
        color: '#00d4a8', lineHeight: 1.5,
        background: '#050e0d', border: `1px solid ${color}22`,
        padding: '6px 8px',
        wordBreak: 'break-word',
      }}>
        {value}
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
      <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 7, color, lineHeight: 1 }}>{passed}/4</div>
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
        <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 5, color, letterSpacing: 1 }}>{label}</div>
        <button
          onClick={handleCopy}
          style={{
            fontFamily: '"Orbitron", sans-serif', fontSize: 5,
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
          color: '#00d4a8',
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: 13,
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
