// Generates /public/sprites/robot.png — 5 frames × 39×63px = 195×63px sprite sheet
// Run: node scripts/generate-sprite.mjs  (from factory/ directory)

import { createRequire } from 'module'
import { mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const sharp = require(path.join(__dirname, '../node_modules/sharp'))

const U = 3        // px per grid unit
const COLS = 13    // grid cols 0–12
const ROWS = 21    // grid rows 0–20
const W = COLS * U // 39
const H = ROWS * U // 63

// Orange body base → hue-rotate shifts to each room color at render time
// ACCENT kept as teal (will shift per room too — acceptable trade-off)
const BODY   = [255, 136,   0, 255]  // #ff8800
const DARK   = [136,  68,   0, 255]  // #884400
const ACCENT = [  0, 255, 204, 255]  // #00ffcc

// Base robot pixel map: [col, row, type]  type 1=body  2=accent  3=dark
const BASE = [
  [5,0,2],
  [4,1,1],[5,1,1],[6,1,1],[7,1,1],[8,1,1],
  [3,2,1],[4,2,1],[5,2,1],[6,2,1],[7,2,1],[8,2,1],[9,2,1],
  [3,3,1],[4,3,3],[5,3,3],[6,3,3],[7,3,3],[8,3,3],[9,3,1],
  [3,4,1],[4,4,3],[5,4,2],[6,4,3],[7,4,3],[8,4,2],[9,4,1],
  [3,5,1],[4,5,3],[5,5,3],[6,5,3],[7,5,3],[8,5,3],[9,5,1],
  [3,6,1],[4,6,1],[5,6,1],[6,6,1],[7,6,1],[8,6,1],[9,6,1],
  [3,7,1],[4,7,1],[5,7,1],[6,7,1],[7,7,1],[8,7,1],[9,7,1],
  [5,8,1],[6,8,1],[7,8,1],
  [2,9,1],[3,9,1],[4,9,1],[5,9,1],[6,9,1],[7,9,1],[8,9,1],[9,9,1],[10,9,1],
  [1,10,1],[2,10,3],[3,10,1],[4,10,1],[5,10,1],[6,10,1],[7,10,1],[8,10,1],[9,10,1],[10,10,3],[11,10,1],
  [0,11,1],[1,11,1],[4,11,1],[5,11,1],[6,11,1],[7,11,1],[8,11,1],[9,11,1],[11,11,1],[12,11,1],
  [0,12,1],[1,12,1],[4,12,1],[5,12,1],[6,12,1],[7,12,1],[8,12,1],[9,12,1],[11,12,1],[12,12,1],
  [3,13,1],[4,13,1],[5,13,3],[6,13,1],[7,13,1],[8,13,3],[9,13,1],[10,13,1],
  [2,14,1],[3,14,1],[4,14,1],[5,14,1],[6,14,2],[7,14,2],[8,14,1],[9,14,1],[10,14,1],[11,14,1],
  [2,15,1],[3,15,1],[4,15,1],[5,15,1],[6,15,1],[7,15,1],[8,15,1],[9,15,1],[10,15,1],[11,15,1],
  [2,16,1],[3,16,3],[4,16,1],[5,16,1],[6,16,1],[7,16,1],[8,16,1],[9,16,3],[10,16,1],[11,16,1],
  [3,17,1],[4,17,1],[5,17,1],[6,17,1],[7,17,1],[8,17,1],[9,17,1],[10,17,1],
  [4,18,1],[5,18,1],[7,18,1],[8,18,1],
  [3,19,1],[4,19,1],[5,19,1],[7,19,1],[8,19,1],[9,19,1],
  [3,20,1],[4,20,1],[5,20,1],[7,20,1],[8,20,1],[9,20,1],
]

// Walk frames: alternate raising left / right foot by 1 grid unit
function walkFrame(side) {
  return BASE.map(([c, r, t]) => {
    if (side === 'left'  && r >= 19 && r <= 20 && c >= 3 && c <= 5) return [c, r - 1, t]
    if (side === 'right' && r >= 19 && r <= 20 && c >= 7 && c <= 9) return [c, r - 1, t]
    return [c, r, t]
  })
}

// Celebrate: arms raised (extended arm cols move to rows 7–9 alongside head)
function celebrateFrame() {
  const LEFT  = [0, 1]
  const RIGHT = [11, 12]
  const EXT   = [11, 12]  // rows of extended arms

  const base = BASE.filter(([c, r]) => {
    if (LEFT.includes(c)  && EXT.includes(r)) return false
    if (RIGHT.includes(c) && EXT.includes(r)) return false
    return true
  })

  const raised = []
  for (const c of [...LEFT, ...RIGHT])
    for (const r of [7, 8, 9]) raised.push([c, r, 1])

  return [...base, ...raised]
}

const FRAMES = [
  BASE,
  walkFrame('left'),
  walkFrame('right'),
  celebrateFrame(),
  BASE,   // frame 4: collapse pose — CSS handles the tilt
]

function makeFrameBuffer(pixels) {
  const buf = Buffer.alloc(W * H * 4, 0)
  for (const [col, row, type] of pixels) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue
    const c = type === 1 ? BODY : type === 2 ? ACCENT : DARK
    for (let dy = 0; dy < U; dy++) {
      for (let dx = 0; dx < U; dx++) {
        const i = ((row * U + dy) * W + (col * U + dx)) * 4
        buf[i] = c[0]; buf[i+1] = c[1]; buf[i+2] = c[2]; buf[i+3] = c[3]
      }
    }
  }
  return buf
}

async function main() {
  const sw = W * FRAMES.length  // 195
  const sh = H                   // 63
  const full = Buffer.alloc(sw * sh * 4, 0)

  for (let f = 0; f < FRAMES.length; f++) {
    const fb = makeFrameBuffer(FRAMES[f])
    const xOff = f * W
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const si = (y * W + x) * 4
        const di = (y * sw + xOff + x) * 4
        full[di] = fb[si]; full[di+1] = fb[si+1]; full[di+2] = fb[si+2]; full[di+3] = fb[si+3]
      }
    }
  }

  const outDir = path.resolve(__dirname, '../public/sprites')
  mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'robot.png')

  await sharp(full, { raw: { width: sw, height: sh, channels: 4 } })
    .png()
    .toFile(outPath)

  console.log(`✓ ${outPath}  (${sw}×${sh}px, ${FRAMES.length} frames × ${W}×${H}px)`)
}

main().catch(e => { console.error(e); process.exit(1) })
