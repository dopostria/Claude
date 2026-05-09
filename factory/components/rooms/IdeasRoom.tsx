'use client'

import Robot from '../Robot'
import PixelBorder from '../PixelBorder'
import type { RoomState, Concept } from '@/lib/types'

interface IdeasRoomProps {
  state: RoomState
  conceptCount: number
  selectedCount: number
  onClick: () => void
}

export default function IdeasRoom({ state, conceptCount, selectedCount, onClick }: IdeasRoomProps) {
  const color = '#ffdd00'

  return (
    <PixelBorder
      color={color}
      active={state === 'working' || state === 'done'}
      onClick={state !== 'idle' || conceptCount > 0 ? onClick : undefined}
      className={state === 'working' ? 'room-active' : ''}
      style={{
        background: '#0d0d00',
        padding: 0,
        height: '100%',
        cursor: state !== 'idle' || conceptCount > 0 ? 'pointer' : 'default',
      }}
    >
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 16px',
        gap: 12,
      }}>
        {/* Room header */}
        <RoomHeader color={color} title="SALA IDEAS" subtitle="NODO 1 + 2" />

        {/* Robots */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          flex: 1,
          paddingBottom: 8,
        }}>
          <Robot color={color} state={state} scale={0.9} delay={0} />
          <Robot color={color} state={state} scale={0.9} delay={0.13} />
          <Robot color={color} state={state} scale={0.9} delay={0.26} />
        </div>

        {/* Status bar */}
        <RoomStatus
          state={state}
          color={color}
          lines={[
            conceptCount > 0 ? `${conceptCount} CONCEPTS READY` : 'AWAITING TRIGGER',
            selectedCount > 0 ? `${selectedCount} SELECTED` : '',
          ].filter(Boolean)}
        />

        {/* Click hint */}
        {(conceptCount > 0 || state === 'done') && (
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
            color: `${color}88`,
            textAlign: 'center',
            animation: 'neonPulse 2s ease-in-out infinite',
          }}>
            CLICK TO EXPAND
          </div>
        )}
      </div>
    </PixelBorder>
  )
}

interface ImagesRoomProps {
  state: RoomState
  imageCount: number
  onClick: () => void
}

export function ImagesRoom({ state, imageCount, onClick }: ImagesRoomProps) {
  const color = '#0088ff'

  return (
    <PixelBorder
      color={color}
      active={state === 'working' || state === 'done'}
      onClick={imageCount > 0 || state !== 'idle' ? onClick : undefined}
      className={state === 'working' ? 'room-active' : ''}
      style={{
        background: '#00050d',
        padding: 0,
        height: '100%',
        cursor: imageCount > 0 || state !== 'idle' ? 'pointer' : 'default',
      }}
    >
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 16px',
        gap: 12,
      }}>
        <RoomHeader color={color} title="SALA IMÁGENES" subtitle="NODO 3" />

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          flex: 1,
          paddingBottom: 8,
        }}>
          <Robot color={color} state={state} scale={0.9} delay={0} />
          <Robot color={color} state={state} scale={0.9} delay={0.13} />
          <Robot color={color} state={state} scale={0.9} delay={0.26} />
        </div>

        <RoomStatus
          state={state}
          color={color}
          lines={[
            imageCount > 0 ? `${imageCount} IMAGES READY` : 'AWAITING PROMPT',
          ]}
        />

        {imageCount > 0 && (
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
            color: `${color}88`,
            textAlign: 'center',
            animation: 'neonPulse 2s ease-in-out infinite',
          }}>
            CLICK TO EXPAND
          </div>
        )}
      </div>
    </PixelBorder>
  )
}

interface VideoRoomProps {
  state: RoomState
  videoReady: boolean
  onClick: () => void
}

export function VideoRoom({ state, videoReady, onClick }: VideoRoomProps) {
  const color = '#ff0040'

  return (
    <PixelBorder
      color={color}
      active={state === 'working' || state === 'done'}
      onClick={videoReady || state !== 'idle' ? onClick : undefined}
      className={state === 'working' ? 'room-active' : ''}
      style={{
        background: '#0d0001',
        padding: 0,
        height: '100%',
        cursor: videoReady || state !== 'idle' ? 'pointer' : 'default',
      }}
    >
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 16px',
        gap: 12,
      }}>
        <RoomHeader color={color} title="SALA VIDEO" subtitle="NODO 4 + 5" />

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          flex: 1,
          paddingBottom: 8,
        }}>
          <Robot color={color} state={state} scale={0.9} delay={0} />
          <Robot color={color} state={state} scale={0.9} delay={0.13} />
          <Robot color={color} state={state} scale={0.9} delay={0.26} />
        </div>

        <RoomStatus
          state={state}
          color={color}
          lines={[
            videoReady ? 'VIDEO READY' : 'AWAITING IMAGE',
          ]}
        />

        {videoReady && (
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
            color: `${color}88`,
            textAlign: 'center',
            animation: 'neonPulse 2s ease-in-out infinite',
          }}>
            CLICK TO EXPAND
          </div>
        )}
      </div>
    </PixelBorder>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────

function RoomHeader({ color, title, subtitle }: { color: string; title: string; subtitle: string }) {
  return (
    <div style={{ borderBottom: `1px solid ${color}33`, paddingBottom: 10 }}>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 6,
        color: `${color}66`,
        letterSpacing: 2,
        marginBottom: 4,
      }}>{subtitle}</div>
      <div style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 9,
        color,
        letterSpacing: 1,
      }}>{title}</div>
    </div>
  )
}

function RoomStatus({ state, color, lines }: { state: RoomState; color: string; lines: string[] }) {
  const stateColors: Record<RoomState, string> = {
    idle: '#333',
    working: '#ffdd00',
    done: '#00ff88',
    error: '#ff0040',
  }

  return (
    <div style={{
      borderTop: `1px solid ${color}22`,
      paddingTop: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 6,
          height: 6,
          background: stateColors[state],
          flexShrink: 0,
          animation: state === 'working' ? 'neonPulse 0.8s ease-in-out infinite' : 'none',
          boxShadow: state !== 'idle' ? `0 0 6px ${stateColors[state]}` : 'none',
        }} />
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          color: stateColors[state],
        }}>
          {state.toUpperCase()}
        </div>
      </div>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 6,
          color: `${color}88`,
          paddingLeft: 12,
        }}>{line}</div>
      ))}
    </div>
  )
}
