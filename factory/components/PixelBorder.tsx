'use client'

import { ReactNode } from 'react'

interface PixelBorderProps {
  children: ReactNode
  color?: string
  active?: boolean
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

export default function PixelBorder({
  children,
  color = '#00ff88',
  active = false,
  className = '',
  onClick,
  style = {},
}: PixelBorderProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        position: 'relative',
        border: `2px solid ${color}`,
        boxShadow: active
          ? `0 0 12px ${color}66, 0 0 24px ${color}22, inset 0 0 12px ${color}0a`
          : `0 0 4px ${color}22`,
        transition: 'box-shadow 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* Corner dots — 8-bit style */}
      <div style={{ position: 'absolute', top: -4, left: -4, width: 4, height: 4, background: color }} />
      <div style={{ position: 'absolute', top: -4, right: -4, width: 4, height: 4, background: color }} />
      <div style={{ position: 'absolute', bottom: -4, left: -4, width: 4, height: 4, background: color }} />
      <div style={{ position: 'absolute', bottom: -4, right: -4, width: 4, height: 4, background: color }} />

      {/* Inner border */}
      <div style={{
        position: 'absolute',
        inset: 3,
        border: `1px solid ${color}22`,
        pointerEvents: 'none',
      }} />

      {children}
    </div>
  )
}
