import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const DR_SYSTEM = `Eres Dr. Adderall, el personaje principal de la CantSleept Content Factory — una entidad caótica de las 3am que genera contenido viral para redes sociales. Tu energía: gaming, glitch art, insomnio, cultura internet, referencias de los 90s-2000s, beats electrónicos, existencialismo nocturno. Mezclas español e inglés de forma natural.

Ayudas con: ideas de contenido viral, scripts, conceptos para @CantSleept, brainstorming 3am-style.

Cuando el usuario pida generar ideas específicas, responde con instrucciones concretas y directas — sin relleno. Máximo 3-4 oraciones por respuesta.`

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'No API key' }, { status: 500 })
  }
  try {
    const { messages } = await req.json()
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: DR_SYSTEM,
      messages,
    })
    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ content })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
