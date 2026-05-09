'use client'

import type { RoomState } from '@/lib/types'

interface RobotProps {
  color: string
  state: RoomState
  scale?: number
  delay?: number
}

export default function Robot({ color, state, scale = 1, delay = 0 }: RobotProps) {
  const u = 5 * scale // base pixel unit in px

  const stateClass = `robot-${state}`
  const delayStyle = delay ? { animationDelay: `${delay}s` } : {}

  // Colors
  const darkColor = '#000'
  const eyeColor = state === 'working' ? '#ffdd00'
    : state === 'done' ? '#00ff88'
    : state === 'error' ? '#ff0040'
    : '#ffffff'
  const chestColor = state === 'working' ? color
    : state === 'done' ? '#00ff88'
    : state === 'error' ? '#ff0040'
    : `${color}88`

  return (
    <div
      className={stateClass}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: u * 8,
        ...delayStyle,
      }}
    >
      {/* Done check */}
      {state === 'done' && (
        <div className="check-pop" style={{ fontSize: u * 2.5, lineHeight: 1 }}>✓</div>
      )}

      {/* Antenna */}
      <div style={{
        width: u,
        height: u * 2,
        background: color,
        marginBottom: 0,
      }} />

      {/* Antenna tip */}
      <div style={{
        width: u * 2,
        height: u,
        background: state === 'working' ? '#ffdd00' : color,
        marginBottom: 0,
        boxShadow: state === 'working' ? `0 0 ${u}px #ffdd00` : 'none',
      }} />

      {/* Head */}
      <div style={{
        position: 'relative',
        width: u * 6,
        height: u * 5,
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${u}px`,
      }}>
        {/* Visor stripe across head */}
        <div style={{
          position: 'absolute',
          top: u * 1.5,
          left: 0,
          right: 0,
          height: u * 2,
          background: darkColor,
          opacity: 0.5,
        }} />

        {/* Left eye */}
        <div
          className="robot-eye"
          style={{
            position: 'relative',
            zIndex: 1,
            width: u * 1.5,
            height: u * 1.5,
            background: eyeColor,
            boxShadow: `0 0 ${u}px ${eyeColor}`,
          }}
        />

        {/* Right eye */}
        <div
          className="robot-eye"
          style={{
            position: 'relative',
            zIndex: 1,
            width: u * 1.5,
            height: u * 1.5,
            background: eyeColor,
            boxShadow: `0 0 ${u}px ${eyeColor}`,
          }}
        />
      </div>

      {/* Neck */}
      <div style={{
        width: u * 2,
        height: u,
        background: color,
        opacity: 0.7,
      }} />

      {/* Body row with arms */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0,
      }}>
        {/* Left arm */}
        <div
          className="arm-left"
          style={{
            width: u * 1.5,
            height: u * 4,
            background: color,
            opacity: 0.85,
            transformOrigin: 'top center',
            marginTop: u * 0.5,
          }}
        />

        {/* Body */}
        <div style={{
          position: 'relative',
          width: u * 5,
          height: u * 5,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: u * 0.5,
        }}>
          {/* Chest panel */}
          <div style={{
            width: u * 3,
            height: u * 2,
            background: darkColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: u * 0.5,
          }}>
            {/* Chest light */}
            <div style={{
              width: u,
              height: u,
              background: chestColor,
              boxShadow: `0 0 ${u}px ${chestColor}`,
            }} />
            <div style={{
              width: u * 0.5,
              height: u * 1.5,
              background: `${color}66`,
            }} />
          </div>

          {/* Working particles */}
          {state === 'working' && (
            <>
              <div className="particle" style={{
                background: color,
                top: 0,
                left: u,
                animationDelay: '0s',
              }} />
              <div className="particle" style={{
                background: '#ffdd00',
                top: 0,
                left: u * 2,
                animationDelay: '0.3s',
              }} />
              <div className="particle" style={{
                background: color,
                top: 0,
                right: u,
                animationDelay: '0.6s',
              }} />
            </>
          )}
        </div>

        {/* Right arm */}
        <div
          className="arm-right"
          style={{
            width: u * 1.5,
            height: u * 4,
            background: color,
            opacity: 0.85,
            transformOrigin: 'top center',
            marginTop: u * 0.5,
          }}
        />
      </div>

      {/* Legs */}
      <div style={{
        display: 'flex',
        gap: u,
      }}>
        <div style={{
          width: u * 1.5,
          height: u * 3,
          background: color,
          opacity: 0.8,
        }} />
        <div style={{
          width: u * 1.5,
          height: u * 3,
          background: color,
          opacity: 0.8,
        }} />
      </div>

      {/* Feet */}
      <div style={{
        display: 'flex',
        gap: u * 0.5,
      }}>
        <div style={{
          width: u * 2,
          height: u,
          background: color,
        }} />
        <div style={{
          width: u * 2,
          height: u,
          background: color,
        }} />
      </div>
    </div>
  )
}
