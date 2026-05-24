'use client'

import { triggerDownload, todayStr, yesterdayStr, type PersistedDay } from '@/lib/persistence'

interface HistoryPanelProps {
  todayData: PersistedDay | null
  yesterdayData: PersistedDay | null
  onOpenIdeas: () => void
  onOpenImages: () => void
  onOpenVideo: () => void
  onRestoreDay: (day: PersistedDay) => void
}

function DaySection({
  label,
  date,
  data,
  defaultOpen,
  onOpenIdeas,
  onOpenImages,
  onOpenVideo,
  onRestore,
  isToday,
}: {
  label: string
  date: string
  data: PersistedDay | null
  defaultOpen: boolean
  onOpenIdeas: () => void
  onOpenImages: () => void
  onOpenVideo: () => void
  onRestore?: () => void
  isToday: boolean
}) {
  const count = (data?.concepts.length ?? 0) + (data?.images.length ?? 0) + (data?.videos.length ?? 0)

  return (
    <details open={defaultOpen} className="history-section">
      <summary className="history-hdr" style={{ listStyle: 'none', cursor: 'pointer' }}>
        <span className="history-arrow" style={{ marginRight: 5 }}>▸</span>
        <span className="history-label">{label}</span>
        <span className="history-date">{date}</span>
        <span className="history-count">{count > 0 ? `${count} items` : 'vacío'}</span>
      </summary>

      <div className="history-items">

        {/* Restore yesterday button */}
        {!isToday && data && data.concepts.length > 0 && onRestore && (
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

        {/* Concepts */}
        {data && data.concepts.length > 0 && (
          <div className="history-item">
            <span className="history-item-icon" style={{ color: 'var(--sc-blue-bright)' }}>💡</span>
            <span className="history-item-text">
              {data.concepts.length} concepto{data.concepts.length !== 1 ? 's' : ''}
              {data.selectedConceptIds.length > 0 && ` · ${data.selectedConceptIds.length} sel.`}
            </span>
            {isToday && (
              <button className="history-open-btn" onClick={onOpenIdeas}>→ ABRIR</button>
            )}
          </div>
        )}

        {/* Images with thumbnails */}
        {data && data.images.length > 0 && (
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
                      style={{
                        width: 52, aspectRatio: '9/16',
                        objectFit: 'cover', display: 'block',
                        border: '1px solid #0d3330', cursor: 'pointer',
                      }}
                      onClick={() => triggerDownload(img.base64, img.mime, filename)}
                    />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.7)',
                      fontFamily: '"Press Start 2P", monospace', fontSize: 4,
                      color: '#00ffcc', textAlign: 'center', padding: '1px 0',
                      cursor: 'pointer',
                    }}
                      onClick={() => triggerDownload(img.base64, img.mime, filename)}
                    >↓</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Videos */}
        {data && data.videos.length > 0 && (
          <div className="history-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%' }}>
              <span style={{ fontSize: 9 }}>🎬</span>
              <span className="history-item-text">{data.videos.length} video{data.videos.length !== 1 ? 's' : ''}</span>
              {isToday && (
                <button className="history-open-btn" onClick={onOpenVideo} style={{ marginLeft: 'auto' }}>→ ABRIR</button>
              )}
            </div>
            {data.videos.map((v, i) => (
              <a
                key={i}
                href={v.uri}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: '"Press Start 2P", monospace', fontSize: 5,
                  color: '#48cae4', textDecoration: 'none', paddingLeft: 14,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '100%', display: 'block',
                }}
              >
                ▶ video {i + 1} · {v.model.split('/').pop()}
              </a>
            ))}
          </div>
        )}

        {(!data || count === 0) && (
          <div className="history-empty">_ sin actividad</div>
        )}
      </div>
    </details>
  )
}

export default function HistoryPanel({
  todayData,
  yesterdayData,
  onOpenIdeas,
  onOpenImages,
  onOpenVideo,
  onRestoreDay,
}: HistoryPanelProps) {
  return (
    <div className="history-top">
      <DaySection
        label="HOY"
        date={todayStr()}
        data={todayData}
        defaultOpen
        isToday
        onOpenIdeas={onOpenIdeas}
        onOpenImages={onOpenImages}
        onOpenVideo={onOpenVideo}
      />
      <DaySection
        label="AYER"
        date={yesterdayStr()}
        data={yesterdayData}
        defaultOpen={false}
        isToday={false}
        onOpenIdeas={onOpenIdeas}
        onOpenImages={onOpenImages}
        onOpenVideo={onOpenVideo}
        onRestore={() => yesterdayData && onRestoreDay(yesterdayData)}
      />
    </div>
  )
}
