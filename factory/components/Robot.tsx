'use client'

import { useEffect, useRef, useState } from 'react'
import type { RoomState } from '@/lib/types'

type RoomType = 'boss' | 'ideas' | 'images' | 'video'

const FRAME_W = 39
const FRAME_H = 63

// Hue-rotate the orange base (#ff8800) to each room color
const FILTERS: Record<RoomType, string> = {
  boss:   'hue-rotate(238deg) saturate(1.4)',
  ideas:  'hue-rotate(19deg)  saturate(1.2)',
  images: 'hue-rotate(177deg) saturate(1.3)',
  video:  'hue-rotate(314deg) saturate(1.5)',
}

// Sprite sheet column offsets (frame index → backgroundPositionX)
const F_IDLE      = 0
const F_WALK1     = 1
const F_WALK2     = 2
const F_CELEBRATE = 3
const F_COLLAPSE  = 4

interface RobotProps {
  room: RoomType
  state: RoomState
  launching?: boolean
}

export default function Robot({ room, state, launching }: RobotProps) {
  const [frame, setFrame] = useState(F_IDLE)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef   = useRef<ReturnType<typeof setTimeout>  | null>(null)

  useEffect(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (timeoutRef.current)  { clearTimeout(timeoutRef.current);   timeoutRef.current  = null }

    if (state === 'working') {
      let i = 0
      setFrame(F_WALK1)
      intervalRef.current = setInterval(() => {
        i ^= 1
        setFrame(i === 0 ? F_WALK1 : F_WALK2)
      }, 150)
    } else if (state === 'done') {
      setFrame(F_CELEBRATE)
      timeoutRef.current = setTimeout(() => setFrame(F_COLLAPSE), 600)
    } else {
      setFrame(F_IDLE)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current)  clearTimeout(timeoutRef.current)
    }
  }, [state])

  const idleFilter = state === 'idle' ? ' opacity(0.5)' : ''
  const cls = `robot${launching ? ' launching' : ''}`

  return (
    <div
      className={cls}
      style={{
        width:               FRAME_W,
        height:              FRAME_H,
        backgroundImage:  "url('/sprites/robot.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `${-frame * FRAME_W}px 0px`,
        imageRendering:      'pixelated',
        filter:              `${FILTERS[room]}${idleFilter}`,
        flexShrink:          0,
      }}
    />
  )
}
