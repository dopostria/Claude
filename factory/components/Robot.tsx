'use client'

import type { RoomState } from '@/lib/types'

type RoomType = 'boss' | 'ideas' | 'images' | 'video'

// Robot body colors per spec: #ffdd00 Ideas, #0088ff Images, #ff0040 Video
const BODY_COLORS: Record<RoomType, string> = {
  boss:   '#a855f7',
  ideas:  '#ffdd00',
  images: '#0088ff',
  video:  '#ff0040',
}

const ACCENT = '#00ffcc' // eyes + core

// Unit size: 3px (8×8 grid scaled 3x = 24px wide)
const U = 3

// Pixel map: [col, row, type]  type 1=body  type 2=accent
// Base element sits at grid (3, 0) = container position (9px, 0px).
// Shadow offset for pixel at (c, r): x=(c-3)*U, y=r*U
const PIXELS: [number, number, 1 | 2][] = [
  // row 1 — antenna base
  [2,1,1],[3,1,1],[4,1,1],[5,1,1],
  // row 2 — head top
  [1,2,1],[2,2,1],[3,2,1],[4,2,1],[5,2,1],[6,2,1],
  // row 3 — head with eyes (cols 2 and 5)
  [0,3,1],[1,3,1],[2,3,2],[3,3,1],[4,3,1],[5,3,2],[6,3,1],[7,3,1],
  // row 4 — head lower
  [0,4,1],[1,4,1],[2,4,1],[3,4,1],[4,4,1],[5,4,1],[6,4,1],[7,4,1],
  // row 5 — neck
  [2,5,1],[3,5,1],[4,5,1],[5,5,1],
  // row 6 — body top
  [0,6,1],[1,6,1],[2,6,1],[3,6,1],[4,6,1],[5,6,1],[6,6,1],[7,6,1],
  // row 7 — body with core (cols 2-4)
  [0,7,1],[1,7,1],[2,7,2],[3,7,2],[4,7,2],[5,7,1],[6,7,1],[7,7,1],
  // row 8 — body lower
  [0,8,1],[1,8,1],[2,8,1],[3,8,1],[4,8,1],[5,8,1],[6,8,1],[7,8,1],
  // rows 9-10 — legs
  [1,9,1],[2,9,1],[5,9,1],[6,9,1],
  [1,10,1],[2,10,1],[5,10,1],[6,10,1],
]

function buildBoxShadow(body: string, accent: string): string {
  return PIXELS.map(([c, r, t]) =>
    `${(c - 3) * U}px ${r * U}px 0 0 ${t === 2 ? accent : body}`
  ).join(', ')
}

interface RobotProps {
  room: RoomType
  state: RoomState
  launching?: boolean
}

export default function Robot({ room, state, launching }: RobotProps) {
  const body   = BODY_COLORS[room]
  const shadow = buildBoxShadow(body, ACCENT)
  const cls    = `robot ${state} ${room}${launching ? ' launching' : ''}`

  return (
    // Container sized to exactly fit all box-shadow pixels: 24×33px
    // Base element at col 3, row 0 → container left=9px, top=0
    <div className={cls} style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ position: 'relative', width: 24, height: 33 }}>
        <div
          style={{
            position: 'absolute',
            left: 9,
            top: 0,
            width: U,
            height: U,
            background: body,
            boxShadow: shadow,
          }}
        />
      </div>
    </div>
  )
}
