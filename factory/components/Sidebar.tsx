'use client'

import type { LogEntry } from '@/lib/types'

export default function Sidebar({ log }: { log: LogEntry[] }) {
  return (
    <div className="comms-panel">
      <div className="comms-hdr">
        <div className="comms-title">◈ COMMS</div>
        <div className="comms-date">{new Date().toISOString().split('T')[0]}</div>
      </div>

      <div className="comms-body">
        {log.length === 0 ? (
          <div className="comms-empty">_ awaiting signal...</div>
        ) : (
          [...log].reverse().map((e, i) => (
            <div key={i} className={`comms-entry ${e.type}`}>
              <div className="comms-ts">{e.time}</div>
              <div className="comms-msg">{e.message}</div>
            </div>
          ))
        )}
      </div>

      <div className="comms-ftr">
        <span className="comms-ver">v0.4</span>
        <span className="comms-status">● ONLINE</span>
      </div>
    </div>
  )
}
