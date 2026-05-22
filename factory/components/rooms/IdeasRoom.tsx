'use client'

import Robot from '../Robot'
import type { RoomState } from '@/lib/types'

const ROOM_C: Record<string, string> = {
  ideas: '#00ddff', images: '#cc33ff', video: '#ff9900',
}

// ── DECORATIONS (shared, per-room flavor) ────────────────────────────────────

function RoomDeco({ room, state }: { room: string; state: RoomState }) {
  const C = ROOM_C[room] ?? '#00ffcc'
  const active = state === 'working' || state === 'done'
  const glow = active ? `0 0 6px ${C}` : 'none'
  const a = active ? 'aa' : '2a'

  // Room-specific panel sizes for variety
  const tlBars: number[] = room === 'ideas'  ? [16,10,20,8,14] :
                            room === 'images' ? [20,12,16,10,18] :
                                               [14,20,8,18,12]

  const trBars: number[] = room === 'ideas'  ? [12,18,8,16,10] :
                            room === 'images' ? [10,16,22,8,14] :
                                               [18,10,14,20,8]

  return (
    <>
      {/* Nested inner frames */}
      <div className="r-inner" style={{ inset: '10%' }} />
      <div className="r-inner" style={{ inset: '24%', opacity: active ? .22 : .08 }} />

      {/* TL rack */}
      <div className="r-rack" style={{ top: 38, left: 14 }}>
        {tlBars.map((w,i) => <div key={i} className="r-bar" style={{ width: w, background: C, boxShadow: glow }} />)}
      </div>

      {/* TR rack */}
      <div className="r-rack" style={{ top: 38, right: 14, alignItems: 'flex-end' }}>
        {trBars.map((w,i) => <div key={i} className="r-bar" style={{ width: w, background: C, boxShadow: glow }} />)}
      </div>

      {/* BL rack */}
      <div className="r-rack" style={{ bottom: 30, left: 14 }}>
        {[10,16,8,20].map((w,i) => <div key={i} className="r-bar" style={{ width: w, background: C, boxShadow: glow }} />)}
      </div>

      {/* BR rack */}
      <div className="r-rack" style={{ bottom: 30, right: 14, alignItems: 'flex-end' }}>
        {[18,10,14,8].map((w,i) => <div key={i} className="r-bar" style={{ width: w, background: C, boxShadow: glow }} />)}
      </div>

      {/* Corner dots */}
      {[{top:30,left:30},{top:30,right:30},{bottom:24,left:30},{bottom:24,right:30}].map((pos,i) => (
        <div key={i} className="r-dot" style={{ ...pos, background: C, boxShadow: active ? `0 0 8px ${C}, 0 0 14px ${C}88` : 'none' }} />
      ))}

      {/* Top edge accent */}
      <div className="r-edge" style={{ top: 0, left: '20%', right: '20%', height: 2, background: `linear-gradient(to right, transparent, ${C}, transparent)` }} />
      {/* Bottom edge accent */}
      <div className="r-edge" style={{ bottom: 0, left: '20%', right: '20%', height: 2, background: `linear-gradient(to right, transparent, ${C}, transparent)` }} />

      {/* Room-specific center detail */}
      {room === 'ideas' && (
        /* Small node cluster */
        <div style={{ position: 'absolute', bottom: '28%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 2, pointerEvents: 'none' }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width: 4, height: 4, background: `${C}${active ? 'cc' : '33'}`, boxShadow: active ? `0 0 6px ${C}` : 'none' }} />
          ))}
        </div>
      )}
      {room === 'images' && (
        /* Vertical film-strip columns */
        <>
          <div style={{ position: 'absolute', left: '20%', top: '25%', bottom: '25%', width: 6, borderLeft: `1px solid ${C}${a}`, borderRight: `1px solid ${C}${a}`, pointerEvents: 'none', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 1px' }}>
            {[1,1,1,1,1].map((_,i) => <div key={i} style={{ flex: 1, background: `${C}${active?'44':'11'}` }} />)}
          </div>
          <div style={{ position: 'absolute', right: '20%', top: '25%', bottom: '25%', width: 6, borderLeft: `1px solid ${C}${a}`, borderRight: `1px solid ${C}${a}`, pointerEvents: 'none', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 1px' }}>
            {[1,1,1,1,1].map((_,i) => <div key={i} style={{ flex: 1, background: `${C}${active?'44':'11'}` }} />)}
          </div>
        </>
      )}
      {room === 'video' && (
        /* Broadcast tower shape */
        <div style={{ position: 'absolute', bottom: '22%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 2 }}>
          {[20,14,10,6,4].map((w,i) => (
            <div key={i} style={{ width: w, height: 4, marginBottom: 2, background: `${C}${active?'88':'22'}`, marginLeft: 'auto', marginRight: 'auto', boxShadow: active ? `0 0 4px ${C}66` : 'none' }} />
          ))}
        </div>
      )}
    </>
  )
}

// ── 3AM THOUGHTS ─────────────────────────────────────────────────────────────

interface IdeasRoomProps { state: RoomState; conceptCount: number; selectedCount: number; onClick: () => void }

export default function IdeasRoom({ state, conceptCount, selectedCount, onClick }: IdeasRoomProps) {
  return (
    <RoomCell id="room-ideas" room="ideas" node="NODE_01" name="3AM THOUGHTS" state={state}
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
    <RoomCell id="room-images" room="images" node="NODE_02" name="PIXEL DAMAGE" state={state}
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
    <RoomCell id="room-video" room="video" node="NODE_03" name="MOTION SICK" state={state}
      robot={<Robot room="video" state={state} />}
      info={videoReady ? 'VIDEO READY' : undefined}
      onClick={videoReady || state !== 'idle' ? onClick : undefined}
    />
  )
}

// ── Shared RoomCell ───────────────────────────────────────────────────────────

interface RoomCellProps {
  id: string; room: 'ideas'|'images'|'video'; node: string; name: string
  state: RoomState; robot: React.ReactNode; info?: string; subinfo?: string; onClick?: () => void
}

function RoomCell({ id, room, node, name, state, robot, info, subinfo, onClick }: RoomCellProps) {
  const sc = state === 'working' ? 'is-working' : state === 'done' ? 'is-done' : state === 'error' ? 'is-error' : ''
  const cls = `iso-room ${room} ${sc}${onClick ? ' clickable' : ''}`
  const C = ROOM_C[room]
  const ledColor = state === 'idle' ? undefined : state === 'error' ? '#ff3030' : state === 'working' ? C : C + 'aa'

  return (
    <div id={id} className={cls} onClick={onClick}>
      <div className="r-cnr r-cnr-tl" /><div className="r-cnr r-cnr-tr" />
      <div className="r-cnr r-cnr-bl" /><div className="r-cnr r-cnr-br" />
      <div className="room-scan" />

      {/* Decorations (behind content) */}
      <RoomDeco room={room} state={state} />

      <div className="r-hdr">
        <span className="r-node">{node}</span>
        <span className="r-name">{name}</span>
      </div>

      <div className="r-body" style={{ zIndex: 3 }}>
        {robot}
        {state === 'done' && <div className="done-check-overlay">✓</div>}
      </div>

      <div className="r-ftr">
        <div className="r-led" style={{
          background: ledColor ?? 'var(--r-dim)',
          boxShadow: ledColor ? `0 0 6px ${ledColor}` : 'none',
          animation: state === 'working' ? 'neonPulse .8s ease-in-out infinite' : 'none',
        }} />
        <span className="r-status" style={{ color: ledColor ?? 'var(--r-dim)' }}>{state.toUpperCase()}</span>
        {info    && <span className="r-info">{info}</span>}
        {subinfo && <span className="r-info" style={{ color: 'var(--r-dim)' }}>{subinfo}</span>}
        {onClick && !info && <span className="r-hint">CLICK</span>}
      </div>
    </div>
  )
}
