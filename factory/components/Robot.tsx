'use client'

import type { RoomState } from '@/lib/types'

type RoomType = 'boss' | 'ideas' | 'images' | 'video'

const BODY: Record<RoomType, string> = {
  boss:   '#a855f7',
  ideas:  '#ffdd00',
  images: '#0088ff',
  video:  '#ff0040',
}
// Darkened variant for shadow/panel details
const DARK: Record<RoomType, string> = {
  boss:   '#5a1a99',
  ideas:  '#997a00',
  images: '#004499',
  video:  '#990020',
}
const ACCENT = '#00ffcc' // eyes + core glow

// Pixel unit size (3× scale)
const U = 3

// Sprite: 13 cols (0–12) × 20 rows (0–19)  →  39 × 60 px rendered
// Base element sits at (0,0) transparent; all pixels are box-shadow offsets:
//   col*U px  row*U px  0  0  color
// Types: 1=body  2=accent(eyes/core)  3=dark(visor/joints/bolts)
type P = [number, number, 1 | 2 | 3]

/* eslint-disable @typescript-eslint/no-unused-vars */
const PIXELS: P[] = [
  // ── antenna ─────────────────────────────────────────────────────
  [5,0,2],

  // ── head top dome ───────────────────────────────────────────────
  [4,1,1],[5,1,1],[6,1,1],[7,1,1],[8,1,1],
  [3,2,1],[4,2,1],[5,2,1],[6,2,1],[7,2,1],[8,2,1],[9,2,1],

  // ── visor row 1 (dark band) ─────────────────────────────────────
  [3,3,1],[4,3,3],[5,3,3],[6,3,3],[7,3,3],[8,3,3],[9,3,1],

  // ── eyes row (accent pixels at 5 and 8 inside dark visor) ───────
  [3,4,1],[4,4,3],[5,4,2],[6,4,3],[7,4,3],[8,4,2],[9,4,1],

  // ── visor row 2 ─────────────────────────────────────────────────
  [3,5,1],[4,5,3],[5,5,3],[6,5,3],[7,5,3],[8,5,3],[9,5,1],

  // ── head lower + chin ───────────────────────────────────────────
  [3,6,1],[4,6,1],[5,6,1],[6,6,1],[7,6,1],[8,6,1],[9,6,1],
  [3,7,1],[4,7,1],[5,7,1],[6,7,1],[7,7,1],[8,7,1],[9,7,1],

  // ── neck ────────────────────────────────────────────────────────
  [5,8,1],[6,8,1],[7,8,1],

  // ── shoulders ───────────────────────────────────────────────────
  [2,9,1],[3,9,1],[4,9,1],[5,9,1],[6,9,1],[7,9,1],[8,9,1],[9,9,1],[10,9,1],

  // ── arms + body row (arm joints marked dark) ────────────────────
  [1,10,1],[2,10,3],[3,10,1],[4,10,1],[5,10,1],[6,10,1],[7,10,1],[8,10,1],[9,10,1],[10,10,3],[11,10,1],

  // ── arms extended ────────────────────────────────────────────────
  [0,11,1],[1,11,1],[4,11,1],[5,11,1],[6,11,1],[7,11,1],[8,11,1],[9,11,1],[11,11,1],[12,11,1],

  // ── arm tips ─────────────────────────────────────────────────────
  [0,12,1],[1,12,1],[4,12,1],[5,12,1],[6,12,1],[7,12,1],[8,12,1],[9,12,1],[11,12,1],[12,12,1],

  // ── chest panel row 1 (no arms) ─────────────────────────────────
  [3,13,1],[4,13,1],[5,13,3],[6,13,1],[7,13,1],[8,13,3],[9,13,1],[10,13,1],

  // ── chest with core (accent at 6-7) ─────────────────────────────
  [2,14,1],[3,14,1],[4,14,1],[5,14,1],[6,14,2],[7,14,2],[8,14,1],[9,14,1],[10,14,1],[11,14,1],

  // ── lower body ──────────────────────────────────────────────────
  [2,15,1],[3,15,1],[4,15,1],[5,15,1],[6,15,1],[7,15,1],[8,15,1],[9,15,1],[10,15,1],[11,15,1],

  // ── bolt-corner row ─────────────────────────────────────────────
  [2,16,1],[3,16,3],[4,16,1],[5,16,1],[6,16,1],[7,16,1],[8,16,1],[9,16,3],[10,16,1],[11,16,1],

  // ── waist ───────────────────────────────────────────────────────
  [3,17,1],[4,17,1],[5,17,1],[6,17,1],[7,17,1],[8,17,1],[9,17,1],[10,17,1],

  // ── upper legs ──────────────────────────────────────────────────
  [4,18,1],[5,18,1],[7,18,1],[8,18,1],

  // ── boots ───────────────────────────────────────────────────────
  [3,19,1],[4,19,1],[5,19,1],[7,19,1],[8,19,1],[9,19,1],
  [3,20,1],[4,20,1],[5,20,1],[7,20,1],[8,20,1],[9,20,1],
]

function buildShadow(body: string, dark: string): string {
  return PIXELS.map(([c, r, t]) => {
    const color = t === 1 ? body : t === 2 ? ACCENT : dark
    return `${c * U}px ${r * U}px 0 0 ${color}`
  }).join(', ')
}

interface RobotProps {
  room: RoomType
  state: RoomState
  launching?: boolean
}

export default function Robot({ room, state, launching }: RobotProps) {
  const shadow = buildShadow(BODY[room], DARK[room])
  const cls = `robot ${state} ${room}${launching ? ' launching' : ''}`

  // Container: (max_col+1)*U × (max_row+1)*U = 13*3 × 21*3 = 39 × 63 px
  return (
    <div className={cls} style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ position: 'relative', width: 39, height: 63 }}>
        {/* Transparent base element at (0,0); all pixels rendered via box-shadow */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: U,
            height: U,
            background: 'transparent',
            boxShadow: shadow,
          }}
        />
      </div>
    </div>
  )
}
