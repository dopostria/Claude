'use client'

import type { RoomState } from '@/lib/types'

type RoomType = 'boss' | 'ideas' | 'images' | 'video'

const COLORS: Record<RoomType, string> = {
  boss:   '#a855f7',
  ideas:  '#00c4a0',
  images: '#ff6b35',
  video:  '#48cae4',
}

interface RobotProps {
  room: RoomType
  state: RoomState
}

export default function Robot({ room, state }: RobotProps) {
  const c   = COLORS[room]
  const c70 = `${c}b3`
  const c35 = `${c}59`
  const c20 = `${c}33`

  return (
    <div
      className={`robot-${state}`}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Antenna tip — 4×4 */}
      <div
        className="robot-antenna-tip"
        style={{ width: 4, height: 4, background: c, boxShadow: `0 0 6px ${c}` }}
      />
      {/* Antenna shaft — 2×8 */}
      <div style={{ width: 2, height: 8, background: c35 }} />

      {/* Head — 24×20 */}
      <div style={{
        width: 24,
        height: 20,
        background: '#050e0d',
        border: `2px solid ${c}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 4px',
      }}>
        <div className="robot-eye" style={{ width: 4, height: 4, background: c, boxShadow: `0 0 3px ${c}` }} />
        <div className="robot-eye" style={{ width: 4, height: 4, background: c, boxShadow: `0 0 3px ${c}` }} />
      </div>

      {/* Neck — 4×4 */}
      <div style={{ width: 4, height: 4, background: c35 }} />

      {/* Body row: left-arm + body + right-arm */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>

        {/* Left arm — 6×14 + hand 6×6 */}
        <div
          className="robot-arm-left"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transformOrigin: 'top center' }}
        >
          <div style={{ width: 6, height: 14, background: c70, border: `1px solid ${c35}` }} />
          <div style={{ width: 6, height: 6, background: c35 }} />
        </div>

        {/* Body — 20×24 with core */}
        <div style={{
          width: 20,
          height: 24,
          background: '#050e0d',
          border: `2px solid ${c}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div
            className="robot-core"
            style={{ width: 6, height: 6, background: c, boxShadow: `0 0 5px ${c}` }}
          />
        </div>

        {/* Right arm — 6×14 + hand 6×6 */}
        <div
          className="robot-arm-right"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transformOrigin: 'top center' }}
        >
          <div style={{ width: 6, height: 14, background: c70, border: `1px solid ${c35}` }} />
          <div style={{ width: 6, height: 6, background: c35 }} />
        </div>
      </div>

      {/* Legs — 6×12 each */}
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ width: 6, height: 12, background: c20, border: `1px solid ${c35}` }} />
        <div style={{ width: 6, height: 12, background: c20, border: `1px solid ${c35}` }} />
      </div>

      {/* Feet — 8×4 each */}
      <div style={{ display: 'flex', gap: 2 }}>
        <div style={{ width: 8, height: 4, background: c35 }} />
        <div style={{ width: 8, height: 4, background: c35 }} />
      </div>
    </div>
  )
}
