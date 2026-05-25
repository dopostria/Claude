'use client'

import { useState, useEffect } from 'react'
import { triggerDownload, todayStr, loadAllDays, type PersistedDay } from '@/lib/persistence'

interface HistoryPanelProps {
  onOpenIdeas: () => void
  onOpenImages: () => void
  onOpenVideo: () => void
  onRestoreDay: (day: PersistedDay) => void
}

function DaySection({
  data,
  isToday,
  onOpenIdeas,
  onOpenImages,
  onOpenVideo,
  onRestore,
}: {
  data: PersistedDay
  isToday: boolean
  onOpenIdeas: () => void
  onOpenImages: () => void
  onOpenVideo: () => void
  onRestore: () => void
}) {
  const [open, setOpen] = useState(isToday)
  const count = data.concepts.length + data.images.length + data.videos.length

  return (
    <div className="history-section" style={{ borderBottom: '1px solid #0a1a18' }}>
      <div
        className="history-hdr"
        onClick={() => setOpen(o => !o)}
        style={{ listStyle: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px' }}
      >
        <span className="history-arrow" style={{ marginRight: 5, transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none' }}>▸</span>
        <span className="history-label" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: isToday ? 'var(--sc-blue-bright)' : 'var(--sc-text)' }}>
          {isToday ? 'HOY' : data.date}
        </span>
        <span className="history-count">{count > 0 ? `${count} items` : 'vacío'}</span>
      </div>

      {open && (
        <div className="history-items">

          {/* Restore button for past days */}
          {!isToday && data.concepts.length > 0 && (
            <div className="history-item" style={{ borderBottom: '1px solid #0d1a18', paddingBottom: 6, marginBottom: 4 }}>
              <button
                className="history-open-btn"
                onClick={onRestore}
                style={{ color: '#ffaa00', borderColor: '#ffaa00', width: '100%', textAlign: 'center' }}
              >
                ↩ RESTAURAR SESIÓN
              </button>
            </div>
          )}

          {/* Concepts + prompts */}
          {data.concepts.length > 0 && (
            <div className="history-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%' }}>
                <span className="history-item-icon" style={{ color: 'var(--sc-blue-bright)' }}>💡</span>
                <span className="history-item-text">
                  {data.concepts.length} concepto{data.concepts.length !== 1 ? 's' : ''}
                  {data.selectedConceptIds.length > 0 && ` · ${data.selectedConceptIds.length} sel.`}
                </span>
                {isToday && (
                  <button className="history-open-btn" onClick={onOpenIdeas} style={{ marginLeft: 'auto' }}>→ ABRIR</button>
                )}
              </div>
              {data.concepts.map(c => (
                <div key={c.id} style={{ paddingLeft: 18, width: '100%' }}>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#00c4a0', marginBottom: 2 }}>
                    {c.title}
                  </div>
                  {data.imagePrompts[c.id] && (
                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: 11, color: '#006655', lineHeight: 1.5, marginBottom: 2 }}>
                      ▸ {data.imagePrompts[c.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Images */}
          {data.images.length > 0 && (
            <div style={{ paddingLeft: 6, paddingRight: 6, paddingBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <span style={{ fontSize: 9 }}>📸</span>
                <span className="history-item-text">{data.images.length} imagen{data.images.length !== 1 ? 'es' : ''}</span>
                {isToday && (
                  <button className="history-open-btn" onClick={onOpenImages} style={{ marginLeft: 'auto' }}>→ ABRIR</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {data.images.map((img, i) => {
                  const ext = img.mime.includes('png') ? 'png' : 'jpg'
                  const filename = `cantsleept-${data.date}-${i + 1}.${ext}`
                  return (
                    <div key={img.id} style={{ position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:${img.mime};base64,${img.base64}`}
                        alt=""
                        title={img.prompt.slice(0, 80)}
                        style={{ width: 52, aspectRatio: '9/16', objectFit: 'cover', display: 'block', border: '1px solid #0d3330', cursor: 'pointer' }}
                        onClick={() => triggerDownload(img.base64, img.mime, filename)}
                      />
                      <div
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', fontFamily: '"Press Start 2P", monospace', fontSize: 4, color: '#00ffcc', textAlign: 'center', padding: '1px 0', cursor: 'pointer' }}
                        onClick={() => triggerDownload(img.base64, img.mime, filename)}
                      >↓</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Videos */}
          {data.videos.length > 0 && (
            <div className="history-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%' }}>
                <span style={{ fontSize: 9 }}>🎬</span>
                <span className="history-item-text">{data.videos.length} video{data.videos.length !== 1 ? 's' : ''}</span>
                {isToday && (
                  <button className="history-open-btn" onClick={onOpenVideo} style={{ marginLeft: 'auto' }}>→ ABRIR</button>
                )}
              </div>
              {data.videos.map((v, i) => (
                <a key={i} href={v.uri} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#48cae4', textDecoration: 'none', paddingLeft: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', display: 'block' }}
                >
                  ▶ video {i + 1} · {v.model.split('/').pop()}
                </a>
              ))}
            </div>
          )}

          {count === 0 && (
            <div className="history-empty">_ sin actividad</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HistoryPanel({
  onOpenIdeas,
  onOpenImages,
  onOpenVideo,
  onRestoreDay,
}: HistoryPanelProps) {
  const [days, setDays] = useState<PersistedDay[]>([])
  const today = todayStr()

  useEffect(() => {
    setDays(loadAllDays())
  }, [])

  return (
    <div className="history-top">
      <div style={{ padding: '6px 10px 4px', borderBottom: '2px solid #0a1a18' }}>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 8, color: 'var(--sc-blue-bright)', letterSpacing: 2 }}>HISTORY</span>
      </div>
      {days.length === 0 && (
        <div className="history-empty" style={{ padding: '10px 12px' }}>_ sin datos</div>
      )}
      {days.map(day => (
        <DaySection
          key={day.date}
          data={day}
          isToday={day.date === today}
          onOpenIdeas={onOpenIdeas}
          onOpenImages={onOpenImages}
          onOpenVideo={onOpenVideo}
          onRestore={() => onRestoreDay(day)}
        />
      ))}
    </div>
  )
}
