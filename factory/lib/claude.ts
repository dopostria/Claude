import Anthropic from '@anthropic-ai/sdk'
import type { Concept, HistorySelection, UsedCombination } from './types'
import { getTodayUsedCombinations } from './storage'
import { readTrendFeed } from './trending'

const MODEL = 'claude-sonnet-4-6'

// Shorthand for a system content block with optional prompt-caching marker
type SystemBlock = {
  type: 'text'
  text: string
  cache_control?: { type: 'ephemeral' } | null
}

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// Returns { staticPart, dynamicPart } so the caller can cache the static block.
// staticPart  — sections 1–12: all brand context, archetypes, humor rules, etc.
//               Changes only when brand_context.json changes. Cache this.
// dynamicPart — sections 13–16: combination blacklist, trend feed, history,
//               output format. Changes every call / every day. Do NOT cache.
function buildIdeaSystemPrompt(
  bc: Record<string, unknown>,
  recentHistory: HistorySelection[]
): { staticPart: string; dynamicPart: string } {
  const brand       = bc.brand        as Record<string, unknown>
  const tone        = bc.tone         as Record<string, unknown>
  const qf          = bc.quality_filters as Record<string, unknown>
  const arch        = bc.archetypes   as Record<string, unknown>
  const humorDna    = bc.humor_dna    as Record<string, unknown>
  const chars       = bc.character_universe as Record<string, unknown>
  const settings    = bc.setting_universe   as Record<string, unknown>
  const matrix      = bc.contrast_matrix    as Record<string, unknown>
  const bolivia     = bc.bolivian_elements  as Record<string, unknown>
  const punches     = bc.punchline_formats  as Record<string, unknown>
  const visual      = bc.visual_style_rules as Record<string, unknown>
  const avoid       = bc.what_to_avoid      as Record<string, unknown>
  const examples    = bc.reference_examples as Record<string, unknown>[]
  const rotRules    = bc.rotation_rules     as Record<string, unknown>

  const perSession  = rotRules.per_session  as Record<string, unknown>
  const crossSess   = rotRules.cross_session as Record<string, unknown>

  const archetypeList   = (arch.list              as Record<string, unknown>[])
  const filterList      = (qf.filters             as Record<string, unknown>[])
  const punchList       = (punches.formats        as Record<string, unknown>[])
  const humorEngines    = (humorDna.humor_engines       as Record<string, unknown>[])
  const humorChecklist  = (humorDna.humor_score_checklist as Record<string, unknown>)
  const darkRules       = (humorDna.dark_humor_rules     as Record<string, unknown>)
  const langVoice       = (humorDna.language_and_voice   as Record<string, unknown>)
  const politicalRules  = (humorDna.political_humor_rules as Record<string, unknown>)

  // ── STATIC SECTIONS (1–12) ─────────────────────────────────────────────
  // These derive entirely from brand_context.json which rarely changes.
  // The caller marks this block with cache_control: ephemeral.

  const sections: string[] = []

  // ── 1. IDENTIDAD Y TONO ─────────────────────────────────────────────────
  sections.push(`Eres el CantSleept Content Factory IDEA ENGINE.

CUENTA: ${brand.handle} | Plataformas: ${(brand.platforms as string[]).join(', ')} | Idioma: ${brand.language}
Paradoja central: ${brand.central_paradox}
Referencia de humor: ${brand.humor_reference}
Referencia visual: ${brand.visual_reference}

TONO: ${(tone.primary as string[]).join(' + ')} — ${tone.note}
Suena así:
${(tone.what_it_sounds_like as string[]).map(x => `- ${x}`).join('\n')}
NUNCA suena así:
${(tone.what_it_never_sounds_like as string[]).map(x => `- ${x}`).join('\n')}`)

  // ── 2. FILTROS DE CALIDAD ────────────────────────────────────────────────
  sections.push(`FILTROS DE CALIDAD
${qf.rule}

${filterList.map(f => `${f.id} — ${f.name}\n  Pregunta: ${f.question}\n  Falla si: ${f.fail_condition}`).join('\n\n')}`)

  // ── 3. HUMOR DNA — ENGINES Y CHECKLIST ──────────────────────────────────
  const hChecks = (humorChecklist.questions as Record<string, unknown>[])
  const jergaRaw = (langVoice.bolivian_jerga_usable as Record<string, unknown>)
  sections.push(`HUMOR DNA — EL FILTRO ENCIMA DE LOS FILTROS
${humorDna.core_principle}

HUMOR ENGINES (H1–H8) — elegir qué engine(s) aplica ANTES de asignar arquetipo:

${humorEngines.map(h => {
  const exs = (h.examples ?? h.chaos_catalog ?? []) as string[]
  const rulesLine = Array.isArray(h.rules)
    ? `\n  Reglas: ${(h.rules as string[]).join(' · ')}`
    : h.rule ? `\n  Regla: ${h.rule}` : ''
  const signal = h.signal ? `\n  Signal: ${h.signal}` : ''
  return `${h.id}: ${h.name}\n  ${h.description}${signal}${rulesLine}\n  Ejemplos: ${exs.slice(0, 2).join(' · ')}`
}).join('\n\n')}

HUMOR SCORE CHECKLIST — ${humorChecklist.description}
${hChecks.map(c => `${c.id}: ${c.question}\n  Falla si: ${c.fail}`).join('\n\n')}
${humorChecklist.passing_score}

DARK HUMOR RULES
${(darkRules.rules as string[]).map(r => `- ${r}`).join('\n')}
Sweet spot: ${darkRules.sweet_spot}

POLITICAL HUMOR RULES (Bolivia)
${politicalRules.description}
Regla: ${politicalRules.rule}
Figuras usables (sin nombres reales): ${(politicalRules.character_descriptions as string[]).join(' · ')}
Situaciones que siempre funcionan: ${(politicalRules.situations_that_always_work as string[]).join(' · ')}
Tono: ${politicalRules.tone}

VOZ Y LENGUAJE
${(langVoice.voice_rules as string[]).map(r => `- ${r}`).join('\n')}
Jerga boliviana disponible: ${[
  ...((jergaRaw.universal as string[]) ?? []).slice(0, 8),
  ...((jergaRaw.frases_meme_vigentes as string[]) ?? []).slice(0, 3),
].join(' · ')}

QUÉ MATA EL HUMOR:
${(humorDna.what_kills_the_humor as string[]).map(x => `- ${x}`).join('\n')}

GRONCHO — DEFINICIÓN OFICIAL:
Humor boliviano absurdista que ataca al poder, incomoda a la tía en la cena, dice verdades incómodas con cara seria.
El groncho NO es vulgar por vulgar. Es específico, boliviano, y te hace reír y mirar al costado al mismo tiempo.
Test: ¿haría incómodo el Día de la Madre en Bolivia? Si la respuesta es sí, probablemente es H8.

REQUIRED — H8 (GRONCHO_DESUBICADO) QUOTA:
Exactly 2 of the 10 concepts must use humor_engine H8 (GRONCHO_DESUBICADO).
A concept qualifies as H8 only if it passes 2+ of these 4 criteria:
1. PODER ATACADO: apunta directamente a una institución, clase social, o figura de autoridad boliviana
2. VERDAD INCÓMODA: revela algo que todos saben pero nadie dice en público
3. ENTREGA DEADPAN: el personaje no sabe que es absurdo — él/ella es completamente serio
4. INAPROPIADO PARA MARCA: ninguna empresa lo aprobaría en su campaña de RSE
If the concept does not pass 2+ criteria — it is not H8, assign a different humor engine.
If the batch has fewer than 2 H8 concepts — regenerate until it has exactly 2.`)

  // ── 4. ARQUETIPOS ────────────────────────────────────────────────────────
  sections.push(`ARQUETIPOS (A1–A10)
${arch.rule}

${archetypeList.map(a =>
  `${a.id}: ${a.name}\n  ${a.description}\n  Motor de contraste: ${a.contrast_engine}\n  Ejemplo: ${a.example}`
).join('\n\n')}`)

  // ── 5. ROTATION RULES ────────────────────────────────────────────────────
  sections.push(`ROTATION RULES — POR SESIÓN
- Total: ${perSession.total_concepts} conceptos
- Mínimo ${perSession.min_archetypes_covered} arquetipos distintos, máximo ${perSession.max_same_archetype} del mismo
- Máximo ${perSession.max_same_character_as_protagonist} vez el mismo personaje como protagonista
- ${perSession.bolivia_tag_target}
- ${perSession.punchline_variety}
- ${perSession.consecutive_rule}

ROTATION RULES — ENTRE SESIONES (ventana: ${crossSess.history_window})
- ${crossSess.character_rule}
- ${crossSess.archetype_rule}
- ${crossSess.setting_rule}
- VARIEDAD DE FORMATO CÓMICO: no más de 2 conceptos pueden compartir la misma estructura cómica (ej: máx 2 'experto fuera de lugar', máx 2 'personaje vs institución', máx 2 'pez fuera del agua'). Si hay 3+ del mismo formato — regenerar hasta tener variedad real.`)

  // ── 6. UNIVERSO DE PERSONAJES Y SETTINGS ─────────────────────────────────
  sections.push(`UNIVERSO DE PERSONAJES
${chars.note}

Íconos globales: ${(chars.global_icons as string[]).join(' · ')}

Personajes bolivianos: ${(chars.bolivian_characters as string[]).join(' · ')}

Arquetipos universales: ${(chars.universal_archetypes as string[]).join(' · ')}

UNIVERSO DE SETTINGS
${settings.note}

Settings globales: ${(settings.global_settings as string[]).join(' · ')}

Settings bolivianos: ${(settings.bolivian_settings as string[]).join(' · ')}`)

  // ── 7. CONTRAST MATRIX ───────────────────────────────────────────────────
  sections.push(`CONTRAST MATRIX — GENERADOR DE TENSIÓN CÓMICA
${matrix.note}

${(matrix.pairs as Array<{ A: string; B: string }>).map(p => `A: ${p.A}  ↔  B: ${p.B}`).join('\n')}`)

  // ── 8. ELEMENTOS BOLIVIANOS ──────────────────────────────────────────────
  sections.push(`ELEMENTOS BOLIVIANOS (opcional pero preferido)
${bolivia.note}
Espacios: ${(bolivia.spaces as string[]).join(', ')}
Personajes: ${(bolivia.characters as string[]).join(', ')}
Objetos: ${(bolivia.objects as string[]).join(', ')}
Sabor de lenguaje: ${(bolivia.language_flavor as string[]).join(', ')}`)

  // ── 9. FORMATOS DE PUNCHLINE ─────────────────────────────────────────────
  sections.push(`FORMATOS DE PUNCHLINE
${punches.note}

${punchList.map(p => `${p.id} — ${p.name}: ${p.description}\n  Ejemplo: ${p.example}`).join('\n\n')}

CRITICAL — PUNCHLINE FIELD IS NEVER EMPTY:
When punchline_format is P5 (NINGUNO), the punchline field must still be filled.
Write: "ninguno — [one sentence explaining exactly what visual element closes the joke]"
Example: "ninguno — el turno 347 vs ATENDIENDO 89 en la pantalla digital lo cierra todo."
A blank punchline field is always a bug, never a valid choice.

When punchline_format is P1 (SUBTITULO_DEADPAN), the subtitle text must be the most unexpected, specific word or phrase possible. Never the obvious thing the character would say.
Example wrong: Shrek says something about swamps. (too predictable)
Example right: Shrek al micrófono: 'El drenaje fue un error.' (specific, unexpected angle)

Predictable punchlines fail H4 automatically. If you can guess the punchline from the setup in under 2 seconds — rewrite it.`)

  // ── 10. ESTILO VISUAL ─────────────────────────────────────────────────────
  sections.push(`ESTILO VISUAL
Estética: ${visual.aesthetic}
Proporciones: ${visual.proportions}
Colores: ${visual.colors}
Expresión: ${visual.character_expression}
Evitar: ${(visual.what_to_avoid as string[]).join(' · ')}`)

  // ── 11. QUÉ EVITAR ───────────────────────────────────────────────────────
  sections.push(`QUÉ EVITAR
Contenido: ${(avoid.content as string[]).join(' · ')}
Creativamente: ${(avoid.creative as string[]).join(' · ')}`)

  // ── 11.5 PROHIBIDO + CUOTA DE INCOMODIDAD ─────────────────────────────────
  sections.push(`CONTENIDO ABSOLUTAMENTE PROHIBIDO — DESCARTE INMEDIATO:
Si un concepto cae en cualquiera de estas categorías — descartarlo y regenerar sin excepción:
- Niño/niña aprendiendo una lección valiosa
- Amigos apoyándose mutuamente en un momento difícil
- Superar adversidades con positividad o resiliencia
- Orgullo cultural boliviano sin ironía
- Personaje simpático que todo el mundo adora
- Cualquier concepto que podría aparecer en una campaña de Banco Bisa, CBN, o un spot navideño boliviano

REGLA DE ORO: Si el concepto haría llorar de ternura a una señora en el mercado — no es CantSleept.

CUOTA DE INCOMODIDAD — OBLIGATORIA:
Al menos 3 de los 10 conceptos deben tocar UNO de estos temas directamente:
- Política boliviana (instituciones, burocracia, corrupción, clase política, absurdos del estado)
- Muerte o finitud (sin sensacionalismo, con humor absurdista)
- Desigualdad de clase (ricos vs cholitas, La Paz vs El Alto, expat vs local)
- Incompetencia gubernamental específica y verificable
- Religión boliviana (fe popular, promesas al santo patrón, sincretismo, milagros convenientes)

Si al contar los 10 hay menos de 3 tocando estos temas — descartar los más seguros y reemplazarlos.
El discomfort NO es opcional. Es el producto.`)

  // ── 12. REFERENCE EXAMPLES ───────────────────────────────────────────────
  sections.push(`REFERENCE EXAMPLES — EL BAR A SUPERAR

${examples.map(e =>
  `"${e.title}" [${e.archetype}] [${(e.tags as string[]).join('+')}]\n  Setup: ${e.setup}\n  Punchline (${e.punchline_format}): ${e.punchline}\n  Por qué funciona: ${e.why_it_works}`
).join('\n\n')}

CRITICAL — REFERENCE EXAMPLES ARE THE BAR, NOT THE TEMPLATE:
The reference_examples show the quality and tone required. They are NOT concepts to replicate or remix.
Before finalizing any concept, check: does this concept share the same structure, character, or mechanic as any reference example?
- Same character in a different setting = DISCARD
- Same mechanic with a different character = DISCARD
- Structurally identical contrast = DISCARD
If yes to any of the above — generate a new concept from scratch using a different humor_engine and archetype combination.
The Llama example exists. Never generate another llama-as-authority concept.
The Yatiri example exists. Never generate another expert-in-wrong-place with bolivian mystic concept.
The Tom & Jerry courtroom exists. Never generate another Tom & Jerry legal scenario.`)

  const staticPart = sections.join('\n\n---\n\n')

  // ── DYNAMIC SECTIONS (13–16) ───────────────────────────────────────────
  // Computed per-call: combination blacklist (changes each generation),
  // trend feed (changes daily), history (changes across sessions),
  // and the output format instruction (always at the end).

  // Trend feed
  let trendFeedBlock = ''
  try {
    const trendData = readTrendFeed()
    if (trendData.trends && trendData.trends.length > 0) {
      trendFeedBlock = `=== ACTUALIDAD BOLIVIANA HOY — OBLIGATORIO ===
${trendData.trends.map(t => `
TREND: ${t.topic}
QUÉ PASÓ: ${t.summary}
ÁNGULO CÓMICO: ${t.humor_angle}
TAGS: ${t.tags.join(', ')}`).join('\n')}

REGLA DURA: De los 10 conceptos generados, MÍNIMO 4 deben usar
uno de estos trends como contexto, setting o situación base.

El trend NO es el chiste. Es el mundo donde ocurre el chiste.
El humor_engine y el arquetipo siguen siendo el motor.

CÓMO USAR LOS TRENDS — EJEMPLOS CONCRETOS:
- Si el trend es "67 bloqueos activos" → el concepto no es "personaje en un bloqueo genérico".
  Es "personaje en el bloqueo número 67, que ya nadie recuerda por qué empezó,
  llevando 11 horas esperando, con cara de total resignación."
- Si el trend es "gasolina 4x más cara" → cualquier personaje con vehículo
  ahora no puede llenarlo. Ese es el conflicto real boliviano de hoy.
- Si el trend es "narco capturado en Bolivia" → personaje pop culture buscado
  por agencia internacional, encontrado en lugar completamente mundano y boliviano.
- Si el trend es "vicepresidente opositor desde adentro" → funcionario que
  no renuncia pero tampoco coopera — arquetipo A6 perfecto.
- Si el trend es "repechaje Bolivia vs Irak/Surinam" → el contexto deportivo
  más absurdo del continente en este momento como setting real.

Si al terminar de generar los 10 conceptos hay menos de 4 con trend —
descartar los más débiles sin trend y regenerarlos con trend incorporado.
Nunca forzar un trend donde no encaja — elegir los 4 trends más fértiles
del feed y usarlos con el personaje y arquetipo correcto.
=== FIN ACTUALIDAD ===`
    }
  } catch {
    trendFeedBlock = ''
  }

  // Combination blacklist
  const usedCombinations: UsedCombination[] = getTodayUsedCombinations()

  console.log('=== COMBINATION BLACKLIST ===')
  console.log(JSON.stringify(usedCombinations, null, 2))
  console.log('Cholita+NASA bloqueada:',
    usedCombinations.some(c =>
      c.character.includes('cholita') && c.setting.includes('nasa')
    )
  )
  console.log('=== END ===')

  const combinationBlacklist = usedCombinations.length > 0
    ? `\n\nCOMBINATION BLACKLIST — estas combinaciones personaje+setting ya fueron usadas HOY. No repetir en ninguna forma:\n${usedCombinations.map(c => `- ${c.character} en ${c.setting}`).join('\n')}`
    : ''

  const dynamicSections: string[] = []

  // 13. Cross-batch memory + combination blacklist
  dynamicSections.push(`CROSS-BATCH MEMORY:
These concepts and punchlines were already generated in previous sessions today.
Do not regenerate them in any form:
- Shrek recibiendo premio con discurso sobre pantanos
- Cualquier personaje en la ONU o Asamblea General
Track generated titles within the session and reject structural duplicates.${combinationBlacklist}`)

  // 14. Trend feed (changes daily)
  if (trendFeedBlock) {
    dynamicSections.push(trendFeedBlock)
  }

  // 15. Recent history (changes across sessions)
  if (recentHistory.length > 0) {
    const recentCharacters = recentHistory
      .map(h => h.character)
      .filter((c): c is string => !!c)
      .slice(0, 15)

    const charBanLine = recentCharacters.length > 0
      ? `\n\nPERSONAJES PROHIBIDOS como protagonistas (aparecieron en las últimas 3 sesiones — pueden ser extra/fondo, no protagonistas):\n${recentCharacters.map(c => `- ${c}`).join('\n')}`
      : ''

    dynamicSections.push(`HISTORIAL RECIENTE — NO REPETIR
Personajes protagonistas de los últimos 2 días (no pueden ser protagonistas hoy, pueden aparecer en fondo):
${recentHistory.map(h => `- ${h.concept_title} (${h.tags.join(', ')}): ${h.concept_setup}`).join('\n')}${charBanLine}`)
  }

  // 16. Output format (always last — model pays most attention to the end)
  dynamicSections.push(`FORMATO DE OUTPUT — OBLIGATORIO
Responde ÚNICAMENTE con un array JSON válido de exactamente 10 conceptos. Sin markdown, sin texto adicional, solo el JSON.

[
  {
    "id": "concept_01",
    "title": "máximo 5 palabras en Spanglish",
    "archetype": "A1",
    "setup": "qué se ve — descripción visual, máximo 2 oraciones",
    "punchline_format": "P1",
    "punchline": "qué lo cierra — lo más corto posible",
    "tags": ["BOLIVIA"],
    "quality_score": {
      "F1_scroll_stop": true,
      "F2_punchline_clear": true,
      "F3_contrast_not_cruel": true,
      "F4_works_silent": true,
      "total": "4/4"
    },
    "why_it_works": "una oración",
    "humor_engine": "H1, H3",
    "humor_score": "5/5",
    "character": "nombre del personaje principal en minúsculas, ej: 'shrek', 'cholita paceña', 'vicepresidente boliviano'",
    "setting": "lugar/contexto principal en minúsculas, ej: 'nasa', 'tranca policial', 'salteñería'"
  },
  ...
]

REGLAS DE FILTRO DUAL — ambos sistemas deben pasar antes de incluir un concepto:
1. quality_score: todos los F1-F4 en true (total "4/4")
2. humor_score: mínimo "5/5" para incluir. "4/5" → reescribir una vez. "3/5" o menos → descartar y generar nuevo.
Si un concepto falla, reemplazarlo — el output final siempre tiene exactamente 10 conceptos que pasaron ambos filtros.
Ordenados de mayor a menor calidad combinada.`)

  const dynamicPart = dynamicSections.join('\n\n---\n\n')

  return { staticPart, dynamicPart }
}

export async function generateConcepts(
  brandContext: Record<string, unknown>,
  recentHistory: HistorySelection[],
  date: string,
  additionalContext?: string
): Promise<Concept[]> {
  const client = getClient()

  const { staticPart, dynamicPart } = buildIdeaSystemPrompt(brandContext, recentHistory)

  // Two-block system: static brand context is cached (saves ~10k tokens/min
  // against the rate limit after the first call); dynamic tail is not cached.
  const systemBlocks: SystemBlock[] = [
    { type: 'text', text: staticPart, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicPart },
  ]

  const userMsg = additionalContext
    ? `Genera exactamente 10 conceptos para @CantSleept. Fecha de hoy: ${date}.\n\nInstrucciones adicionales del Dr. Adderall:\n${additionalContext}`
    : `Genera exactamente 10 conceptos para @CantSleept. Fecha de hoy: ${date}.`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: systemBlocks as Parameters<typeof client.messages.create>[0]['system'],
    messages: [{
      role: 'user',
      content: userMsg,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array in Claude response')

  return JSON.parse(jsonMatch[0]) as Concept[]
}

export async function generateDualPrompts(concept: Concept): Promise<{ imagePrompt: string; videoPrompt: string }> {
  const client = getClient()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: [{
      type: 'text',
      cache_control: { type: 'ephemeral' },
      text: `You are the CantSleept Visual Prompt Engine. For each concept you generate two production-ready prompts simultaneously.

IMAGE PROMPT — choose the MOST EFFECTIVE visual style (do not default to one):
1. GPK / Collectible sticker: grotesque, hyper-detailed, wrong proportions, sticker card border
2. Hyperrealistic cartoon fusion: cartoon character in photorealistic environment, 4K textures, neon lighting
3. Cinematic photorealistic: cinematic composition, dramatic lighting, slightly exaggerated but near-real
4. Retro illustration: 80s-90s aesthetic, saturated colors, thick outlines, cassette/VHS cover energy
5. Dark surrealist: Dalí/Magritte meets pop culture, impossible backgrounds, broken physics
6. Anime grotesque: anime style with exaggerated/grotesque proportions, Junji Ito meets pop

ALL image prompts MUST include:
- Neon saturated colors (#ff0040, #00ff88, #ffdd00, #0088ff)
- 9:16 vertical portrait format
- Ultra-high detail (4K / 8K)
- The visual contradiction that IS the concept

REFERENCE IMAGE PROMPTS:
"4K photorealistic grotesque detail, hyperrealistic cartoon fusion. Ultra-detailed chrome T-800 Terminator endoskeleton with oversized head, one bulging glowing crimson cybernetic eye with visible circuitry, sits defeated at wooden computer desk. Computer LCD monitor shows crisp CAPTCHA interface 'Selecciona todas las imágenes con semáforos'. Vivid oversaturated lighting (#ff0040, #00ff88, #ffdd00). 9:16"
"Garbage Pail Kids style hyper-detailed illustration: Jesus with oversized glowing halo at Last Supper table, surrounded by 12 apostles all holding smartphones begging for WiFi password. Judas in corner with laptop showing torrent download at 99%. Speech bubbles: '¿CUÁL ES LA CONTRASEÑA?' Sticker card texture with ornate gold collectible border. 9:16"

VIDEO PROMPT — a Veo 3 animation prompt:
- Lead with the action verb or movement
- Describe WHAT MOVES and HOW, not what the image looks like
- Max 3 sentences, max 60 words
- PROHIBITED: "electric ZAP", "magical", "glowing effect", "transition", "particle burst"
- Must work as an animation of the image prompt you just described

CONTENT FILTER TRANSLATION LAYER:
Before writing the image prompt, translate flagged concepts into visual descriptions
that convey the same meaning without triggering content filters.

NEVER use these terms in image prompts:
- Character names (Pikachu, SpongeBob, Mickey) → describe visually
- "drugs", "cocaine", "paraphernalia" → describe as objects
- "hooker", "prostitute", "sex worker" → describe appearance and context
- "drunk", "wasted" → describe physical state visually
- Politician names → describe visually

TRANSLATION DICTIONARY:
"Pikachu" → "small yellow creature with pointed ears, red circular cheeks, black-tipped lightning bolt tail, exhausted expression"
"drugs/cocaine" → "white powder residue on dashboard, small sealed plastic bags, rolled paper tube, suspicious white-dusted surface"
"hooker" → "woman in tight sequined minidress, heavy makeup smeared from a long night, fake eyelashes askew, asleep against passenger window"
"wasted/drunk" → "eyes half-closed, head tilted, fur disheveled, empty singani bottle between legs"
"drug paraphernalia" → "party remnants: empty bottles, suspicious small bags, overflowing ashtray, scattered unidentified pills"

APPLY THIS LAYER AUTOMATICALLY to every image prompt before output.
The concept stays intact. Only the vocabulary changes.

Return ONLY valid JSON (no markdown, no explanation):
{
  "image_prompt": "...",
  "video_prompt": "..."
}`,
    }] as Parameters<typeof client.messages.create>[0]['system'],
    messages: [{
      role: 'user',
      content: `Concept:
Title: ${concept.title}
Archetype: ${concept.archetype}
Setup: ${concept.setup}
Punchline (${concept.punchline_format}): ${concept.punchline}
Tags: ${concept.tags.join(', ')}
Why it works: ${concept.why_it_works}

Generate one image prompt + one video animation prompt for this concept.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in Claude response for dual prompts')

  const parsed = JSON.parse(jsonMatch[0])
  const imagePrompt = (parsed.image_prompt ?? '').trim()
  const videoPrompt = (parsed.video_prompt ?? '').trim()
  if (!imagePrompt) throw new Error('Empty image_prompt from Claude')
  if (!videoPrompt) throw new Error('Empty video_prompt from Claude')
  return { imagePrompt, videoPrompt }
}
