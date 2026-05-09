import Anthropic from '@anthropic-ai/sdk'
import type { Concept, ImagePrompts, AnimationConcept, HistorySelection } from './types'

const MODEL = 'claude-sonnet-4-6'

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

export async function generateImagePrompts(concept: Concept): Promise<ImagePrompts> {
  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `You are the CantSleept Prompt Engine. You convert visual concepts into optimized image generation prompts.
Style: Garbage Pail Kids — grotesque-funny, hyper-detailed, neon saturated colors, sticker/collectible card texture, slightly wrong proportions (big heads, bulging eyes), polished but broken aesthetic.`,
    messages: [{
      role: 'user',
      content: `Concept:
Title: ${concept.title}
Setup: ${concept.setup}
Punchline: ${concept.punchline}

Generate TWO image prompts. Return ONLY valid JSON:
{
  "gemini": "Prompt optimized for Gemini Imagen 3. Style keywords: Garbage Pail Kids style, grotesque cartoon, hyper-detailed illustration, neon saturated colors (#ff0040, #00ff88, #ffdd00), sticker card texture, slightly distorted proportions, collectible card border. Describe the exact visual scene.",
  "higgsfield": "Prompt optimized for Higgsfield Nano Banana 2. Style keywords: 4K photorealistic grotesque detail, hyperrealistic cartoon fusion, vivid oversaturated colors, collectible sticker aesthetic, slightly wrong anatomy. Describe the exact visual scene with photorealistic detail cues."
}`
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in Claude response for prompts')

  return JSON.parse(jsonMatch[0]) as ImagePrompts
}

export async function generateAnimationConcepts(
  concept: Concept,
  imagePath: string
): Promise<AnimationConcept[]> {
  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You are the CantSleept Animation Engine. You create video animation concepts for still images.
Principle: video prompts favor ACTION over description. Describe MOVEMENT, not appearance.
NEVER use: "electric ZAP", tool-specific terms, static descriptions.`,
    messages: [{
      role: 'user',
      content: `Base image concept:
Title: ${concept.title}
Setup: ${concept.setup}
Punchline: ${concept.punchline}
Image: ${imagePath}

Generate 3 animation concepts. Return ONLY valid JSON:
{
  "animations": [
    {
      "id": "unique-slug",
      "name": "Short animation name",
      "movement": "What moves, how it moves, duration. Specific and kinetic.",
      "camera_direction": "Camera movement description. E.g: slow zoom in, static, pan left",
      "video_prompt": "Optimized video generation prompt. Lead with the action verb. Describe motion, timing, energy. Max 60 words."
    }
  ]
}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in Claude response for animations')

  const parsed = JSON.parse(jsonMatch[0])
  return parsed.animations as AnimationConcept[]
}
