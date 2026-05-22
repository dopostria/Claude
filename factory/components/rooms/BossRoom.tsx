'use client'

import Robot from '../Robot'
import type { RoomState } from '@/lib/types'

interface BossRoomProps {
  state: RoomState; postsThisWeek: number; lastConceptTitle: string | null
  onGenerate: () => void; generating: boolean; launching?: boolean
}

export default function BossRoom({ state, postsThisWeek, lastConceptTitle, onGenerate, generating, launching }: BossRoomProps) {
  const sc = state === 'working' ? 'is-working' : state === 'done' ? 'is-done' : state === 'error' ? 'is-error' : ''
  const led = state === 'idle' ? '#5a0015' : state === 'working' ? '#ff1a3d' : state === 'done' ? '#dd1030' : '#ff3030'
  const C = '#ff1a3d'
  const active = state === 'working' || state === 'done'
  const a = active ? 'aa' : '2a'
  const glow = active ? `0 0 6px ${C}` : 'none'

  return (
    <div id="room-boss" className={`iso-room boss ${sc}`}>
      <div className="r-cnr r-cnr-tl" /><div className="r-cnr r-cnr-tr" />
      <div className="r-cnr r-cnr-bl" /><div className="r-cnr r-cnr-br" />
      <div className="room-scan" />

      {/* Nested inner frames */}
      <div className="r-inner" style={{ inset: '10%' }} />
      <div className="r-inner" style={{ inset: '22%', opacity: active ? .25 : .1 }} />

      {/* TL equipment rack */}
      <div className="r-rack" style={{ top: 38, left: 14 }}>
        {[18,12,22,8,16,10].map((w,i) => (
          <div key={i} className="r-bar" style={{ width: w, background: C, boxShadow: glow }} />
        ))}
      </div>

      {/* TR equipment rack */}
      <div className="r-rack" style={{ top: 38, right: 14, alignItems: 'flex-end' }}>
        {[14,20,10,18,8,14].map((w,i) => (
          <div key={i} className="r-bar" style={{ width: w, background: C, boxShadow: glow }} />
        ))}
      </div>

      {/* BR rack */}
      <div className="r-rack" style={{ bottom: 32, right: 14, alignItems: 'flex-end' }}>
        {[16,10,20,12].map((w,i) => (
          <div key={i} className="r-bar" style={{ width: w, background: C, boxShadow: glow }} />
        ))}
      </div>

      {/* BL rack */}
      <div className="r-rack" style={{ bottom: 32, left: 14 }}>
        {[10,16,8,20].map((w,i) => (
          <div key={i} className="r-bar" style={{ width: w, background: C, boxShadow: glow }} />
        ))}
      </div>

      {/* Corner dots */}
      {[{top:30,left:30},{top:30,right:30},{bottom:26,left:30},{bottom:26,right:30}].map((pos,i) => (
        <div key={i} className="r-dot" style={{ ...pos, background: C, boxShadow: active ? `0 0 8px ${C}, 0 0 14px ${C}88` : 'none' }} />
      ))}

      {/* Left edge accent line */}
      <div className="r-edge" style={{ left: 0, top: '20%', bottom: '20%', width: 2, background: `linear-gradient(to bottom, transparent, ${C}, transparent)` }} />
      {/* Right edge accent */}
      <div className="r-edge" style={{ right: 0, top: '20%', bottom: '20%', width: 2, background: `linear-gradient(to bottom, transparent, ${C}, transparent)` }} />

      {/* Header */}
      <div className="r-hdr">
        <span className="r-node">NODE_00</span>
        <span className="r-name">DR. ADDERALL</span>
      </div>

      {/* Body */}
      <div className="r-body" style={{ flexDirection: 'column', gap: 8 }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', zIndex: 3, position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 5, color: '#5a0015', letterSpacing: 2, marginBottom: 3 }}>POSTS/WK</div>
            <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 24, color: C, lineHeight: 1, textShadow: `0 0 18px ${C}` }}>{postsThisWeek}</div>
          </div>
          <div style={{ textAlign: 'left', maxWidth: 130 }}>
            <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 5, color: '#5a0015', letterSpacing: 2, marginBottom: 3 }}>LAST RUN</div>
            <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#dd1030', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
              {lastConceptTitle ? lastConceptTitle.toUpperCase() : '—'}
            </div>
          </div>
        </div>

        {/* Robot */}
        <div style={{ position: 'relative', zIndex: 3 }}>
          <Robot room="boss" state={state} launching={launching} />
          {state === 'done' && <div className="done-check-overlay">✓</div>}
        </div>

        {/* Generate button */}
        <button
          className="btn-pixel"
          onClick={onGenerate}
          disabled={generating}
          style={{
            color: generating ? '#5a0015' : C, borderColor: generating ? '#5a0015' : C,
            fontSize: 7, padding: '9px 16px',
            boxShadow: generating ? 'none' : `0 0 18px ${C}66, inset 0 0 8px ${C}22`,
            whiteSpace: 'nowrap', position: 'relative', zIndex: 3,
          }}
        >
          {generating
            ? <span className="loading-dots">THINKING<span>.</span><span>.</span><span>.</span></span>
            : '▶ GENERATE'}
        </button>
      </div>

      {/* Footer */}
      <div className="r-ftr">
        <div className="r-led" style={{ background: led, boxShadow: state !== 'idle' ? `0 0 8px ${led}` : 'none', animation: state === 'working' ? 'neonPulse .8s ease-in-out infinite' : 'none' }} />
        <span className="r-status" style={{ color: led }}>{state.toUpperCase()}</span>
        <span className="r-info">{new Date().toISOString().split('T')[0]}</span>
      </div>
    </div>
  )
}
