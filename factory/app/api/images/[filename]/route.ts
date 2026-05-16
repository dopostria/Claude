import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const TMP_DIR = '/tmp/cantsleept-images'

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    // Prevent path traversal
    if (filename.includes('/') || filename.includes('..')) {
      return new NextResponse('Bad request', { status: 400 })
    }

    const filepath = join(TMP_DIR, filename)
    const buffer = await readFile(filepath)
    const mime = filename.endsWith('.png') ? 'image/png' : 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch {
    return new NextResponse('Image not found', { status: 404 })
  }
}
