'use client'

import Robot from '../Robot'
import PixelBorder from '../PixelBorder'
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
  const color = '#ffffff'

  return (
    <PixelBorder
      color="#888888"
      active={state === 'working'}
      className={state === 'working' ? 'room-active' : ''}
      style={{ background: '#0a0a12', padding: 0 }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '16px 24px',
        minHeight: 130,
      }}>
        {/* Robot Jefe */}
        <div style={{ flexShrink: 0, position: 'relative' }}>
          <Robot color={color} state={state} scale={1.4} />
        </div>

        {/* Title + Room Label */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            color: '#555',
            letterSpacing: 2,
            marginBottom: 8,
          }}>
            SALA DEL JEFE
          </div>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 14,
            color: '#ffffff',
            letterSpacing: 1,
            lineHeight: 1.4,
          }}>
            CANTSLEEPT<br />
            <span style={{ color: '#00ff88' }}>FACTORY</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: 2,
          height: 80,
          background: '#1a1a2e',
          flexShrink: 0,
        }} />

        {/* Stats */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          flex: 1,
        }}>
          <Stat label="POSTS THIS WEEK" value={postsThisWeek} color="#0088ff" />
          <Stat
            label="LAST CONCEPT"
            value={lastConceptTitle ? lastConceptTitle.toUpperCase().slice(0, 22) : '---'}
            color="#ffdd00"
            small
          />
        </div>

        {/* Divider */}
        <div style={{
          width: 2,
          height: 80,
          background: '#1a1a2e',
          flexShrink: 0,
        }} />

        {/* CTA */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <button
            className="btn-pixel"
            onClick={onGenerate}
            disabled={generating}
            style={{
              color: generating ? '#555' : '#00ff88',
              borderColor: generating ? '#333' : '#00ff88',
              fontSize: 8,
              padding: '12px 20px',
              boxShadow: generating ? 'none' : '0 0 12px #00ff8844',
              whiteSpace: 'nowrap',
            }}
          >
            {generating ? (
              <span className="loading-dots">
                GENERATING<span>.</span><span>.</span><span>.</span>
              </span>
            ) : (
              '▶ GENERATE TODAY\'S CONCEPTS'
            )}
          </button>

          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
            color: '#333',
            textAlign: 'center',
          }}>
            {new Date().toISOString().split('T')[0]}
          </div>
        </div>

        {/* Status indicator */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <StatusLed state={state} />
        </div>
      </div>
    </PixelBorder>
  )
}

function Stat({ label, value, color, small = false }: {
  label: string
  value: string | number
  color: string
  small?: boolean
}) {
  return (
    <div>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 6,
        color: '#333',
        marginBottom: 4,
        letterSpacing: 1,
      }}>{label}</div>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: small ? 8 : 18,
        color,
        letterSpacing: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: 220,
      }}>{value}</div>
    </div>
  )
}

function StatusLed({ state }: { state: RoomState }) {
  const colors: Record<RoomState, string> = {
    idle: '#333',
    working: '#ffdd00',
    done: '#00ff88',
    error: '#ff0040',
  }
  const labels: Record<RoomState, string> = {
    idle: 'IDLE',
    working: 'WORKING',
    done: 'DONE',
    error: 'ERROR',
  }
  const c = colors[state]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 10,
        height: 10,
        background: c,
        boxShadow: state !== 'idle' ? `0 0 8px ${c}, 0 0 16px ${c}44` : 'none',
        animation: state === 'working' ? 'neonPulse 1s ease-in-out infinite' : 'none',
      }} />
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 6,
        color: c,
      }}>{labels[state]}</div>
    </div>
  )
}
