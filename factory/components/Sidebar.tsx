'use client'

import type { LogEntry } from '@/lib/types'

interface SidebarProps {
  log: LogEntry[]
}

const typeColors: Record<LogEntry['type'], string> = {
  info: '#555',
  working: '#ffdd00',
  success: '#00ff88',
  error: '#ff0040',
}

const typePrefixes: Record<LogEntry['type'], string> = {
  info: '»',
  working: '⚙',
  success: '✓',
  error: '✗',
}

export default function Sidebar({ log }: SidebarProps) {
  return (
    <div
      style={{
        width: 260,
        minWidth: 260,
        background: '#050508',
        border: '2px solid #111',
        borderLeft: '2px solid #1a1a2e',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 14px 10px',
        borderBottom: '2px solid #111',
        background: '#080810',
      }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 8,
          color: '#00ff88',
          letterSpacing: 1,
        }}>
          SESSION LOG
        </div>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 6,
          color: '#333',
          marginTop: 6,
        }}>
          {new Date().toISOString().split('T')[0]}
        </div>
      </div>

      {/* Log entries */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        {log.length === 0 && (
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            color: '#222',
            marginTop: 8,
          }}>
            _awaiting input...
          </div>
        )}
        {[...log].reverse().map((entry, i) => (
          <div
            key={i}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 7,
              color: typeColors[entry.type],
              lineHeight: 1.6,
              borderLeft: `2px solid ${typeColors[entry.type]}44`,
              paddingLeft: 8,
            }}
          >
            <div style={{ color: '#333', marginBottom: 2 }}>{entry.time}</div>
            <div>
              <span style={{ marginRight: 6 }}>{typePrefixes[entry.type]}</span>
              {entry.message}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 14px',
        borderTop: '2px solid #111',
        background: '#050508',
      }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 6,
          color: '#222',
        }}>
          cantsleept_factory v0.1
        </div>
      </div>
    </div>
  )
}
