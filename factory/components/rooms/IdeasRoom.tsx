'use client'

import Robot from '../Robot'
import type { RoomState } from '@/lib/types'

// ── 3AM THOUGHTS ─────────────────────────────────────────────────────────────

interface IdeasRoomProps {
  state: RoomState; conceptCount: number; selectedCount: number; onClick: () => void
}

export default function IdeasRoom({ state, conceptCount, selectedCount, onClick }: IdeasRoomProps) {
  return (
    <RoomCell
      id="room-ideas" room="ideas" node="NODE_01" name="3AM THOUGHTS" state={state}
      robot={<Robot room="ideas" state={state} />}
      info={conceptCount > 0 ? `${conceptCount} CONCEPTS` : undefined}
      subinfo={selectedCount > 0 ? `${selectedCount} SEL` : undefined}
      onClick={conceptCount > 0 || state !== 'idle' ? onClick : undefined}
    />
  )
}

// ── PIXEL DAMAGE ──────────────────────────────────────────────────────────────

interface ImagesRoomProps { state: RoomState; imageCount: number; onClick: () => void }

export function ImagesRoom({ state, imageCount, onClick }: ImagesRoomProps) {
  return (
    <RoomCell
      id="room-images" room="images" node="NODE_02" name="PIXEL DAMAGE" state={state}
      robot={<Robot room="images" state={state} />}
      info={imageCount > 0 ? `${imageCount} IMAGES` : undefined}
      onClick={imageCount > 0 || state !== 'idle' ? onClick : undefined}
    />
  )
}

// ── MOTION SICK ───────────────────────────────────────────────────────────────

interface VideoRoomProps { state: RoomState; videoReady: boolean; onClick: () => void }

export function VideoRoom({ state, videoReady, onClick }: VideoRoomProps) {
  return (
    <RoomCell
      id="room-video" room="video" node="NODE_03" name="MOTION SICK" state={state}
      robot={<Robot room="video" state={state} />}
      info={videoReady ? 'VIDEO READY' : undefined}
      onClick={videoReady || state !== 'idle' ? onClick : undefined}
    />
  )
}

// ── Shared RoomCell ───────────────────────────────────────────────────────────

const ROOM_C: Record<string, string> = {
  ideas: '#00ccff', images: '#cc33ff', video: '#ff9900',
}

interface RoomCellProps {
  id: string; room: 'ideas' | 'images' | 'video'; node: string; name: string
  state: RoomState; robot: React.ReactNode; info?: string; subinfo?: string; onClick?: () => void
}

function RoomCell({ id, room, node, name, state, robot, info, subinfo, onClick }: RoomCellProps) {
  const stateClass = state === 'working' ? 'is-working' : state === 'done' ? 'is-done' : state === 'error' ? 'is-error' : ''
  const cls = `iso-room ${room} ${stateClass}${onClick ? ' clickable' : ''}`
  const color = ROOM_C[room]
  const ledColor = state === 'idle' ? undefined : state === 'error' ? '#ff3030' : state === 'working' ? color : color + 'aa'

  return (
    <div id={id} className={cls} onClick={onClick}>
      <div className="r-cnr r-cnr-tl" /><div className="r-cnr r-cnr-tr" />
      <div className="r-cnr r-cnr-bl" /><div className="r-cnr r-cnr-br" />
      <div className="room-scan" />

      <div className="r-hdr">
        <span className="r-node">{node}</span>
        <span className="r-name">{name}</span>
      </div>

      <div className="r-body">
        {robot}
        {state === 'done' && <div className="done-check-overlay">✓</div>}
      </div>

      <div className="r-ftr">
        <div className="r-led" style={{
          background: ledColor ?? 'var(--r-dim)',
          boxShadow: ledColor ? `0 0 5px ${ledColor}` : 'none',
          animation: state === 'working' ? 'neonPulse .8s ease-in-out infinite' : 'none',
        }} />
        <span className="r-status" style={{ color: ledColor ?? 'var(--r-dim)' }}>{state.toUpperCase()}</span>
        {info    && <span className="r-info">{info}</span>}
        {subinfo && <span className="r-info" style={{ color: 'var(--r-dim)' }}>{subinfo}</span>}
        {onClick && !info && <span className="r-hint">CLICK</span>}
      </div>

      <div className="r-pips">{[0,1,2,3].map(i => <div key={i} className="r-pip" />)}</div>
    </div>
  )
}
