'use client'

import Robot from '../Robot'
import type { RoomState } from '@/lib/types'

interface BossRoomProps {
  state: RoomState
  postsThisWeek: number
  lastConceptTitle: string | null
  onGenerate: () => void
  generating: boolean
  launching?: boolean
}

export default function BossRoom({
  state, postsThisWeek, lastConceptTitle, onGenerate, generating, launching,
}: BossRoomProps) {
  const stateClass = state === 'working' ? 'is-working' : state === 'done' ? 'is-done' : state === 'error' ? 'is-error' : ''
  const led = state === 'idle' ? '#3a0815' : state === 'working' ? '#ff1a3d' : state === 'done' ? '#cc1433' : '#ff3030'

  return (
    <div id="room-boss" className={`iso-room boss ${stateClass}`}>
      <div className="r-cnr r-cnr-tl" /><div className="r-cnr r-cnr-tr" />
      <div className="r-cnr r-cnr-bl" /><div className="r-cnr r-cnr-br" />
      <div className="room-scan" />

      <div className="r-hdr">
        <span className="r-node">NODE_00</span>
        <span className="r-name">DR. ADDERALL</span>
      </div>

      <div className="r-body" style={{ flexDirection: 'column', gap: 10 }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 5, color: '#3a0815', letterSpacing: 2, marginBottom: 3 }}>POSTS/WK</div>
            <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 22, color: '#ff1a3d', lineHeight: 1, textShadow: '0 0 14px rgba(255,26,61,.6)' }}>
              {postsThisWeek}
            </div>
          </div>
          <div style={{ textAlign: 'left', maxWidth: 130 }}>
            <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 5, color: '#3a0815', letterSpacing: 2, marginBottom: 3 }}>LAST RUN</div>
            <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#cc1433', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
              {lastConceptTitle ? lastConceptTitle.toUpperCase() : '—'}
            </div>
          </div>
        </div>

        {/* Robot */}
        <div style={{ position: 'relative' }}>
          <Robot room="boss" state={state} launching={launching} />
          {state === 'done' && <div className="done-check-overlay">✓</div>}
        </div>

        {/* Generate */}
        <button
          className="btn-pixel"
          onClick={onGenerate}
          disabled={generating}
          style={{
            color: generating ? '#3a0815' : '#ff1a3d',
            borderColor: generating ? '#3a0815' : '#ff1a3d',
            fontSize: 7, padding: '9px 14px',
            boxShadow: generating ? 'none' : '0 0 14px rgba(255,26,61,.35)',
            whiteSpace: 'nowrap',
          }}
        >
          {generating
            ? <span className="loading-dots">THINKING<span>.</span><span>.</span><span>.</span></span>
            : '▶ GENERATE'}
        </button>
      </div>

      <div className="r-ftr">
        <div className="r-led" style={{
          background: led,
          boxShadow: state !== 'idle' ? `0 0 6px ${led}` : 'none',
          animation: state === 'working' ? 'neonPulse .8s ease-in-out infinite' : 'none',
        }} />
        <span className="r-status" style={{ color: led }}>{state.toUpperCase()}</span>
        <span className="r-info">{new Date().toISOString().split('T')[0]}</span>
      </div>

      <div className="r-pips">{[0,1,2,3,4].map(i => <div key={i} className="r-pip" />)}</div>
    </div>
  )
}
