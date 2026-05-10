'use client'

import Robot from '../Robot'
import type { RoomState } from '@/lib/types'

interface BossRoomProps {
  state: RoomState
  postsThisWeek: number
  lastConceptTitle: string | null
  onGenerate: () => void
  generating: boolean
}

export default function BossRoom({
  state,
  postsThisWeek,
  lastConceptTitle,
  onGenerate,
  generating,
}: BossRoomProps) {
  const stateColors: Record<RoomState, string> = {
    idle:    '#0d3330',
    working: '#ff6b35',
    done:    '#00c4a0',
    error:   '#ff3030',
  }
  const ledColor = stateColors[state]

  return (
    <div
      className={`room-card ${state !== 'idle' ? state : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '10px 20px',
        flexShrink: 0,
      }}
    >
      {/* Pixel corners */}
      <div className="px-corner px-tl" />
      <div className="px-corner px-tr" />
      <div className="px-corner px-bl" />
      <div className="px-corner px-br" />

      {/* Node + room name */}
      <div style={{ minWidth: 160, flexShrink: 0 }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 5,
          color: '#004d3d',
          letterSpacing: 3,
          marginBottom: 5,
        }}>
          NODE_00
        </div>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 10,
          color: '#a855f7',
          letterSpacing: 1,
        }}>
          DR. ADDERALL
        </div>
      </div>

      {/* Robot */}
      <div style={{ flexShrink: 0 }}>
        <Robot room="boss" state={state} />
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 60, background: '#0d3330', flexShrink: 0 }} />

      {/* Stats */}
      <div style={{ flex: 1, display: 'flex', gap: 32, alignItems: 'center' }}>
        <div>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 5,
            color: '#004d3d',
            letterSpacing: 2,
            marginBottom: 4,
          }}>POSTS / WEEK</div>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 18,
            color: '#48cae4',
            lineHeight: 1,
          }}>{postsThisWeek}</div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 5,
            color: '#004d3d',
            letterSpacing: 2,
            marginBottom: 4,
          }}>LAST CONCEPT</div>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            color: '#00a882',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{lastConceptTitle ? lastConceptTitle.toUpperCase() : '—'}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 60, background: '#0d3330', flexShrink: 0 }} />

      {/* Generate button */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <button
          className="btn-pixel"
          onClick={onGenerate}
          disabled={generating}
          style={{
            color: generating ? '#004d3d' : '#00ffcc',
            borderColor: generating ? '#0d3330' : '#00c4a0',
            fontSize: 8,
            padding: '11px 18px',
            boxShadow: generating ? 'none' : '0 0 14px rgba(0,196,160,0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          {generating ? (
            <span className="loading-dots">
              THINKING<span>.</span><span>.</span><span>.</span>
            </span>
          ) : (
            '▶ GENERATE IDEAS'
          )}
        </button>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 5,
          color: '#004d3d',
        }}>{new Date().toISOString().split('T')[0]}</div>
      </div>

      {/* Status LED */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <div style={{
          width: 8,
          height: 8,
          background: ledColor,
          boxShadow: state !== 'idle' ? `0 0 8px ${ledColor}` : 'none',
          animation: state === 'working' ? 'neonPulse 0.8s ease-in-out infinite' : 'none',
        }} />
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 5,
          color: ledColor,
        }}>{state.toUpperCase()}</div>
      </div>
    </div>
  )
}
