'use client'

import type { RoomState } from '@/lib/types'

interface QuickNavProps {
  rooms: { boss: RoomState; ideas: RoomState; images: RoomState; video: RoomState }
  hasConcepts: boolean
  hasSelectedConcepts: boolean
  hasImages: boolean
  hasVideo: boolean
  onOpenIdeas: () => void
  onOpenImages: () => void
  onOpenVideo: () => void
}

export default function QuickNav({
  rooms, hasConcepts, hasSelectedConcepts, hasImages, hasVideo,
  onOpenIdeas, onOpenImages, onOpenVideo,
}: QuickNavProps) {
  return (
    <div className="quicknav-bar">
      <button
        className={`qnav-btn ideas${hasConcepts ? ' active' : ''}`}
        onClick={onOpenIdeas}
        disabled={!hasConcepts}
      >
        <span className="qnav-icon">★</span>
        <span className="qnav-label">IDEAS</span>
        {rooms.ideas === 'done' && <span className="qnav-badge">✓</span>}
      </button>
      <button
        className={`qnav-btn fotos${hasSelectedConcepts ? ' active' : ''}`}
        onClick={onOpenImages}
        disabled={!hasSelectedConcepts}
      >
        <span className="qnav-icon">■</span>
        <span className="qnav-label">FOTOS</span>
        {hasImages && <span className="qnav-badge">✓</span>}
      </button>
      <button
        className={`qnav-btn videos${hasSelectedConcepts ? ' active' : ''}`}
        onClick={onOpenVideo}
        disabled={!hasSelectedConcepts}
      >
        <span className="qnav-icon">▶</span>
        <span className="qnav-label">VIDEOS</span>
        {hasVideo && <span className="qnav-badge">✓</span>}
      </button>
    </div>
  )
}
