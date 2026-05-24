'use client'

import { useState } from 'react'
import type { Concept } from '@/lib/types'

interface GeneratedImageLocal {
  id: string
  conceptId: string
  prompt: string
  timestamp: string
}

interface HistoryPanelProps {
  concepts: Concept[]
  selectedConceptIds: string[]
  generatedImages: GeneratedImageLocal[]
  videoUri: string | null
  onOpenIdeas: () => void
  onOpenImages: () => void
  onOpenVideo: () => void
}

export default function HistoryPanel({
  concepts, selectedConceptIds, generatedImages, videoUri,
  onOpenIdeas, onOpenImages, onOpenVideo,
}: HistoryPanelProps) {
  const [hoyOpen, setHoyOpen] = useState(true)
  const [ayerOpen, setAyerOpen] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const hasConcepts = concepts.length > 0
  const hasImages = generatedImages.length > 0
  const hasVideo = !!videoUri
  const hoyCount = concepts.length + generatedImages.length + (videoUri ? 1 : 0)

  return (
    <div className="history-top">
      <div className="history-section">
        <button className="history-hdr" onClick={() => setHoyOpen(o => !o)}>
          <span className="history-arrow">{hoyOpen ? '▼' : '▶'}</span>
          <span className="history-label">HOY</span>
          <span className="history-date">{today}</span>
          <span className="history-count">{hoyCount > 0 ? `${hoyCount} items` : 'vacío'}</span>
        </button>
        {hoyOpen && (
          <div className="history-items">
            {hasConcepts && (
              <div className="history-item">
                <span className="history-item-icon" style={{ color: 'var(--sc-blue-bright)' }}>★</span>
                <span className="history-item-text">
                  {concepts.length} concepto{concepts.length !== 1 ? 's' : ''}
                  {selectedConceptIds.length > 0 && ` · ${selectedConceptIds.length} sel.`}
                </span>
                <button className="history-open-btn" onClick={onOpenIdeas}>→ ABRIR</button>
              </div>
            )}
            {hasImages && (
              <div className="history-item">
                <span className="history-item-icon" style={{ color: 'var(--images-c)' }}>■</span>
                <span className="history-item-text">
                  {generatedImages.length} imagen{generatedImages.length !== 1 ? 'es' : ''}
                </span>
                <button className="history-open-btn" onClick={onOpenImages}>→ ABRIR</button>
              </div>
            )}
            {hasVideo && (
              <div className="history-item">
                <span className="history-item-icon" style={{ color: 'var(--sc-orange)' }}>▶</span>
                <span className="history-item-text">Video generado</span>
                <button className="history-open-btn" onClick={onOpenVideo}>→ ABRIR</button>
              </div>
            )}
            {!hasConcepts && !hasImages && !hasVideo && (
              <div className="history-empty">_ sin actividad hoy</div>
            )}
          </div>
        )}
      </div>

      <div className="history-section">
        <button className="history-hdr" onClick={() => setAyerOpen(o => !o)}>
          <span className="history-arrow">{ayerOpen ? '▼' : '▶'}</span>
          <span className="history-label">AYER</span>
          <span className="history-count">sin datos persistidos</span>
        </button>
        {ayerOpen && (
          <div className="history-items">
            <div className="history-empty">_ datos no disponibles (Vercel ephemeral)</div>
          </div>
        )}
      </div>
    </div>
  )
}
