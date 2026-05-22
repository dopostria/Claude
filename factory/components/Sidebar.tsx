'use client'

import type { LogEntry } from '@/lib/types'

export default function Sidebar({ log }: { log: LogEntry[] }) {
  return (
    <div className="comms-panel">
      <div className="comms-hdr">
        <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 6, color: '#00f5cc', letterSpacing: 1 }}>
          COMMS
        </div>
        <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 5, color: '#0a2a22', marginTop: 4 }}>
          {new Date().toISOString().split('T')[0]}
        </div>
      </div>

      <div className="comms-body">
        {log.length === 0 ? (
          <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 5, color: '#0a2a22', marginTop: 6 }}>
            _ awaiting...
          </div>
        ) : (
          [...log].reverse().map((e, i) => (
            <div key={i} className={`comms-entry ${e.type}`}>
              <div style={{ fontSize: 4, color: '#0a2a22', marginBottom: 1 }}>{e.time}</div>
              <div>{e.message}</div>
            </div>
          ))
        )}
      </div>

      <div className="comms-ftr">
        <div style={{ fontFamily: '"Press Start 2P",monospace', fontSize: 4, color: '#0a2a22' }}>
          v0.3 · ISO
        </div>
      </div>
    </div>
  )
}
