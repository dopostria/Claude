import Anthropic from '@anthropic-ai/sdk'
import type { Concept, AnimationConcept, HistorySelection } from './types'

const MODEL = 'claude-sonnet-4-5'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function buildIdeaSystemPrompt(brandContext: Record<string, unknown>): string {
  return `You are the CantSleept Content Factory IDEA ENGINE. You generate absurdist visual concepts for @CantSleept — an anonymous pop culture account on Instagram and TikTok.

BRAND DNA:
- Language: Spanglish (Spanish + English mixed naturally, never forced)
- Tone: deadpan + surreal + unhinged — simultaneously
- Humor model: @elhijotuerto — the CONCEPT is the joke, no explanation ever needed
- Visual reference: Garbage Pail Kids — grotesque, hyper-detailed, saturated, slightly broken characters
- Core paradox: polished content that LOOKS broken

QUALITY FILTERS — every concept must pass all 4:
1. Stops the scroll in half a second (if it needs context → NOT ready)
2. The punchline needs zero explanation (if you need to explain it → it's broken)
3. Humor comes from CONTRAST, never from cruelty or punching down
4. Works 100% without audio — the image alone is the joke

CONCEPT TAGS (assign all that apply):
- "Bolivia" → has a bolivian cultural wink (cholitas, Tiwanaku, Mercado de Brujas, etc.)
- "POP_CULTURE" → references a globally recognizable icon
- "COTIDIANO" → universal everyday situation that everyone recognizes instantly

REFERENCE EXAMPLES (this is the bar):
${JSON.stringify(brandContext.reference_examples || [], null, 2)}

CRITICAL RULES:
- NEVER explain the joke inside the concept
- The visual setup + punchline together = the complete joke
- Auto-improve any concept scoring below 7 before including it
- Only output concepts that pass ALL 4 filters
- Mix tags: include Bolivia, POP_CULTURE, and COTIDIANO concepts
- Write titles and setups in Spanglish
- Punchlines must be visual, not text-dependent`
}

export async function generateConcepts(
  brandContext: Record<string, unknown>,
  recentHistory: HistorySelection[],
  date: string
): Promise<Concept[]> {
  const client = getClient()

  const historyNote = recentHistory.length > 0
    ? `\nRECENT APPROVED CONCEPTS (DO NOT repeat these themes or settings):\n${recentHistory.map(h => `- ${h.concept_title}: ${h.concept_setup}`).join('\n')}`
    : '\nNo recent history — this is a fresh session.'

  const userPrompt = `Generate exactly 10 visual concepts for @CantSleept. Today's date: ${date}.
${historyNote}

Return ONLY valid JSON — no markdown, no explanation, just the JSON object:

{
  "concepts": [
    {
      "id": "unique-kebab-slug",
      "title": "Max 5 words, punchy, in Spanglish",
      "setup": "Visual description — what we see in the image. Max 30 words. In Spanglish.",
      "punchline": "What closes the joke — the visual twist. Max 20 words. Must work WITHOUT explanation.",
      "scores": {
        "scroll_stop": 8,
        "no_explanation": 9,
        "contrast_not_cruelty": 10,
        "no_audio": 9,
        "overall": 9
      },
      "tags": ["Bolivia"],
      "improved": false
    }
  ]
}

Mix of tags required: at least 2 Bolivia, at least 3 POP_CULTURE, at least 3 COTIDIANO. All concepts score 7+ overall.`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: buildIdeaSystemPrompt(brandContext),
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in Claude response')

  const parsed = JSON.parse(jsonMatch[0])
  return parsed.concepts as Concept[]
}

export async function generateImagePrompts(concept: Concept): Promise<string> {
  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: `You are the CantSleept Visual Prompt Engine. You generate a single, highly specific image prompt for each concept.

Your job: evaluate the concept and choose the MOST EFFECTIVE visual style for it. Do not default to one style.

AVAILABLE STYLES (choose the best fit — or invent a better one):
1. GPK / Collectible sticker: grotesque, hyper-detailed, wrong proportions, sticker card border
2. Hyperrealistic cartoon fusion: cartoon character in photorealistic environment, 4K textures, neon lighting
3. Cinematic photorealistic: cinematic composition, dramatic lighting, slightly exaggerated but near-real
4. Retro illustration: 80s-90s aesthetic, saturated colors, thick outlines, cassette/VHS cover energy
5. Dark surrealist: Dalí/Magritte meets pop culture, impossible backgrounds, broken physics
6. Anime grotesque: anime style with exaggerated/grotesque proportions, Junji Ito meets pop

ALL prompts MUST include:
- Neon saturated colors (#ff0040, #00ff88, #ffdd00, #0088ff)
- 9:16 vertical portrait format
- Ultra-high detail (4K / 8K)
- The visual contradiction that IS the concept

REFERENCE EXAMPLES (match this level of specificity):
EXAMPLE 1 (hyperrealistic cartoon fusion): "4K photorealistic grotesque detail, hyperrealistic cartoon fusion. Ultra-detailed chrome T-800 Terminator endoskeleton with oversized head, one bulging glowing crimson cybernetic eye with visible circuitry, sits defeated at wooden computer desk. Hyperrealistic metallic textures on skull, exposed servo motors in jaw. Computer LCD monitor shows crisp CAPTCHA interface 'Selecciona todas las imágenes con semáforos'. Bright red holographic scanning laser grid projects from eye socket onto screen. Vivid oversaturated lighting (#ff0040, #00ff88, #ffdd00), collectible sticker aesthetic, slightly exaggerated anatomy proportions. 9:16"

EXAMPLE 2 (GPK sticker): "Garbage Pail Kids style hyper-detailed illustration: Jesus with oversized glowing halo at Last Supper table, surrounded by 12 apostles all holding smartphones begging for WiFi password. Neon saturated colors. Judas in corner with laptop showing torrent download at 99%. Speech bubbles: '¿CUÁL ES LA CONTRASEÑA?' Sticker card texture with ornate gold collectible border. Grotesque-funny proportions, 9:16"

EXAMPLE 3 (hyperrealistic fusion con contexto boliviano): "4K photorealistic Garbage Pail Kids fusion. Barbie figure with oversized proportions, unnaturally smooth plastic skin, wearing 7-layered pollera with individual pleats, vibrant magenta pollera, traditional aguayo manta, brown bowler hat. Ken: coal dust on skin, weathered miner helmet. Background: Bolivian market stall, steam from aluminum pots, tucumanas, wiphala flag. Vivid oversaturated color grading, slightly wrong proportions. 9:16"

Return ONLY the prompt text — no JSON, no explanation, just the prompt.`,
    messages: [{
      role: 'user',
      content: `Concept:
Title: ${concept.title}
Setup: ${concept.setup}
Punchline: ${concept.punchline}
Tags: ${concept.tags.join(', ')}

Choose the most visually effective style for this specific concept and write one production-ready image prompt.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  if (!text) throw new Error('Empty prompt from Claude')
  return text
}

export async function generateAnimationConcepts(
  concept: Concept,
  imagePrompt: string
): Promise<AnimationConcept[]> {
  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You are the CantSleept Animation Engine. You generate 3 genuinely distinct video animation concepts.

RULES:
- Prompts LEAD with the action verb / movement — not scene description
- Describe WHAT MOVES and HOW, not what the image looks like
- Max 3 sentences per prompt
- PROHIBITED phrases: "electric ZAP", "magical", "glowing effect", "transition", "particle burst"

The 3 concepts must differ in ENERGY:
1. SUBTLE/ATMOSPHERIC — minimal movement, maximum impact. One small element changes everything.
2. DYNAMIC/KINETIC — clear action, active camera, kinetic energy.
3. SURREAL/UNEXPECTED — something that shouldn't move, moves. Physics breaks subtly.`,
    messages: [{
      role: 'user',
      content: `Concept:
Title: ${concept.title}
Setup: ${concept.setup}
Punchline: ${concept.punchline}

Image style: ${imagePrompt.slice(0, 200)}

Generate exactly 3 animation concepts. Return ONLY valid JSON:
{
  "animations": [
    {
      "id": "unique-kebab-slug",
      "name": "2-3 WORD NAME IN CAPS",
      "energy": "subtle",
      "movement": "Specific description of what moves, how, and timing. 1-2 sentences.",
      "camera_direction": "Exact camera behavior. E.g: ultra slow push in, locked off static, whip pan right",
      "video_prompt": "Production-ready Veo prompt. Start with movement verb. Max 3 sentences, max 60 words."
    }
  ]
}

Energy values must be exactly: "subtle", "dynamic", "surreal" — one of each.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in Claude response for animations')

  const parsed = JSON.parse(jsonMatch[0])
  return parsed.animations as AnimationConcept[]
}
