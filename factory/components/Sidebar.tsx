'use client'

import type { LogEntry } from '@/lib/types'

interface SidebarProps {
  log: LogEntry[]
}

const typeColors: Record<LogEntry['type'], string> = {
  info:    '#004d3d',
  working: '#ff6b35',
  success: '#00ffcc',
  error:   '#ff4444',
}

const typePrefixes: Record<LogEntry['type'], string> = {
  info:    '»',
  working: '⚙',
  success: '✓',
  error:   '✗',
}

export default function Sidebar({ log }: SidebarProps) {
  return (
    <div style={{
      width: 240,
      minWidth: 240,
      background: '#060f0e',
      borderLeft: '2px solid #0d3330',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: '2px solid #0d3330',
        background: '#050e0d',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          color: '#00c4a0',
          letterSpacing: 1,
        }}>SESSION LOG</div>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 5,
          color: '#004d3d',
          marginTop: 5,
        }}>{new Date().toISOString().split('T')[0]}</div>
      </div>

      {/* Log entries */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}>
        {log.length === 0 && (
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
            color: '#0d3330',
            marginTop: 6,
          }}>
            _awaiting input...
          </div>
        )}

        {[...log].reverse().map((entry, i) => (
          <div
            key={i}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 6,
              color: typeColors[entry.type],
              lineHeight: 1.7,
              borderLeft: `2px solid ${typeColors[entry.type]}44`,
              paddingLeft: 7,
            }}
          >
            <div style={{ color: '#0d3330', marginBottom: 1, fontSize: 5 }}>{entry.time}</div>
            <div>
              <span style={{ marginRight: 5 }}>{typePrefixes[entry.type]}</span>
              {entry.message}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 12px',
        borderTop: '2px solid #0d3330',
        background: '#050e0d',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 5,
          color: '#0d3330',
        }}>cantsleept_factory v0.2</div>
      </div>
    </div>
  )
}
