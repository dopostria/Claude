'use client'

import Robot from '../Robot'
import type { RoomState } from '@/lib/types'

// ─── 3AM THOUGHTS ─────────────────────────────────────────────────────────────

interface IdeasRoomProps {
  state: RoomState
  conceptCount: number
  selectedCount: number
  onClick: () => void
}

export default function IdeasRoom({ state, conceptCount, selectedCount, onClick }: IdeasRoomProps) {
  const color = '#00c4a0'
  const canClick = conceptCount > 0 || state !== 'idle'

  return (
    <RoomCard
      id="room-ideas"
      state={state}
      onClick={canClick ? onClick : undefined}
      label="NODE_01"
      title="3AM THOUGHTS"
      color={color}
      robot={<Robot room="ideas" state={state} />}
      statusLines={[
        conceptCount > 0 ? `${conceptCount} CONCEPTS` : 'WAITING...',
        selectedCount > 0 ? `${selectedCount} SELECTED` : '',
      ]}
      hint={canClick ? 'CLICK TO EXPAND' : undefined}
    />
  )
}

// ─── PIXEL DAMAGE ─────────────────────────────────────────────────────────────

interface ImagesRoomProps {
  state: RoomState
  imageCount: number
  onClick: () => void
}

export function ImagesRoom({ state, imageCount, onClick }: ImagesRoomProps) {
  const color = '#ff6b35'
  const canClick = imageCount > 0 || state !== 'idle'

  return (
    <RoomCard
      id="room-images"
      state={state}
      onClick={canClick ? onClick : undefined}
      label="NODE_02"
      title="PIXEL DAMAGE"
      color={color}
      robot={<Robot room="images" state={state} />}
      statusLines={[
        imageCount > 0 ? `${imageCount} IMAGES` : 'WAITING...',
      ]}
      hint={canClick ? 'CLICK TO EXPAND' : undefined}
    />
  )
}

// ─── MOTION SICK ──────────────────────────────────────────────────────────────

interface VideoRoomProps {
  state: RoomState
  videoReady: boolean
  onClick: () => void
}

export function VideoRoom({ state, videoReady, onClick }: VideoRoomProps) {
  const color = '#48cae4'
  const canClick = videoReady || state !== 'idle'

  return (
    <RoomCard
      id="room-video"
      state={state}
      onClick={canClick ? onClick : undefined}
      label="NODE_03"
      title="MOTION SICK"
      color={color}
      robot={<Robot room="video" state={state} />}
      statusLines={[
        videoReady ? 'VIDEO READY' : 'WAITING...',
      ]}
      hint={canClick ? 'CLICK TO EXPAND' : undefined}
    />
  )
}

// ─── Shared RoomCard ──────────────────────────────────────────────────────────

interface RoomCardProps {
  id?: string
  state: RoomState
  onClick?: () => void
  label: string
  title: string
  color: string
  robot: React.ReactNode
  statusLines: string[]
  hint?: string
}

function RoomCard({ id, state, onClick, label, title, color, robot, statusLines, hint }: RoomCardProps) {
  const stateColors: Record<RoomState, string> = {
    idle:    '#0d3330',
    working: '#ff6b35',
    done:    '#00c4a0',
    error:   '#ff3030',
  }
  const ledColor = stateColors[state]

  return (
    <div
      id={id}
      className={`room-card ${state !== 'idle' ? state : ''}`}
      onClick={onClick}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
      onMouseEnter={e => {
        if (onClick) {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = '#ff6b35'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 14px rgba(255, 107, 53, 0.2)'
        }
      }}
      onMouseLeave={e => {
        const base = state !== 'idle' ? state : ''
        if (base === 'working') {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = '#ff6b35'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 16px rgba(255, 107, 53, 0.2)'
        } else if (base === 'done') {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = '#00c4a0'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 12px rgba(0, 196, 160, 0.2)'
        } else if (base === 'error') {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = '#ff3030'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 12px rgba(255, 48, 48, 0.2)'
        } else {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = '#0d3330'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        }
      }}
    >
      {/* Pixel corners */}
      <div className="px-corner px-tl" style={{ background: color }} />
      <div className="px-corner px-tr" style={{ background: color }} />
      <div className="px-corner px-bl" style={{ background: color }} />
      <div className="px-corner px-br" style={{ background: color }} />

      {/* ── Zone 1: label + title ── */}
      <div style={{
        padding: '12px 14px 10px',
        borderBottom: `1px solid ${color}22`,
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 5,
          color: '#004d3d',
          letterSpacing: 3,
          marginBottom: 5,
        }}>{label}</div>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 9,
          color,
          letterSpacing: 1,
        }}>{title}</div>
      </div>

      {/* ── Zone 2: robot (centered, fills space) ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 0',
      }}>
        {robot}
        {state === 'done' && <div className="done-check-overlay">✓</div>}
      </div>

      {/* ── Zone 3: status ── */}
      <div style={{
        padding: '10px 14px',
        borderTop: `1px solid ${color}22`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{
            width: 5,
            height: 5,
            background: ledColor,
            flexShrink: 0,
            boxShadow: state !== 'idle' ? `0 0 5px ${ledColor}` : 'none',
            animation: state === 'working' ? 'neonPulse 0.8s ease-in-out infinite' : 'none',
          }} />
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
            color: ledColor,
          }}>{state.toUpperCase()}</div>
        </div>

        {statusLines.filter(Boolean).map((line, i) => (
          <div key={i} style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
            color: `${color}99`,
            paddingLeft: 11,
            marginTop: 2,
          }}>{line}</div>
        ))}

        {hint && (
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 5,
            color: `${color}55`,
            textAlign: 'center',
            marginTop: 6,
            animation: 'neonPulse 2s ease-in-out infinite',
          }}>
            {hint}
          </div>
        )}
      </div>
    </div>
  )
}
