import Anthropic from '@anthropic-ai/sdk'

// Safe JSON parsing helper
function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}

// Scoring dimensions
export interface VideoAnalysis {
  overallScore: number // 0-100
  dimensions: {
    hookStrength: { score: number; feedback: string }      // First 3 seconds
    emotionalArc: { score: number; feedback: string }      // Problem → Empathy → Solution
    authenticityScore: { score: number; feedback: string }  // Natural, trustworthy
    ctaClarity: { score: number; feedback: string }         // Clear call to action
    technicalQuality: { score: number; feedback: string }   // Audio, lighting, framing
    paceAndLength: { score: number; feedback: string }      // Optimal duration/rhythm
  }
  strengths: string[]          // What works well (in French)
  improvements: string[]       // What to improve (in French)
  predictedCTR: 'low' | 'medium' | 'high' | 'very_high'
  readyToLaunch: boolean       // true if score >= 70
}

export interface VideoScript {
  title: string
  targetSegment: string // intention segment this video targets
  totalDuration: string // e.g., "45-60 secondes"
  shots: {
    timestamp: string        // e.g., "0:00 - 0:03"
    instruction: string      // What the therapist should do
    dialogue: string         // Exact words to say
    visualNote: string       // Camera angle, gesture, expression
    whyItWorks: string       // Brief explanation of the psychology
  }[]
  tips: string[]             // General filming tips
  equipment: string[]         // What they need (phone, tripod, etc.)
}

interface ComparisonResult {
  improvement: number          // percentage improvement
  oldScore: number
  newScore: number
  whatImproved: string[]
  stillNeedsWork: string[]
}

export class CreativeDirector {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  // Analyze a video thumbnail/frames
  async analyzeVideoFrames(params: {
    frames: { base64: string; timestamp: string }[]
    specialty: string
    targetSegment: string
    videoMetadata: { duration: number; hasAudio: boolean }
  }): Promise<VideoAnalysis> {
    const { frames, specialty, targetSegment, videoMetadata } = params

    // Build image content blocks for Claude
    const imageContent = frames.map(f => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/jpeg' as const,
        data: f.base64,
      },
    }))

    const systemPrompt = `Tu es un directeur créatif expérimenté spécialisé dans les vidéos thérapeutiques pour Meta Ads en France.

Tu évalues les vidéos selon 6 dimensions critiques:
1. ACCROCHE (0-20): Les 3 premières secondes capturent-elles l'attention? Y a-t-il une question provocatrice ou un problème établi immédiatement?
2. ARC ÉMOTIONNEL (0-20): La progression Problème → Empathie → Espoir → Solution est-elle claire et puissante?
3. AUTHENTICITÉ (0-20): La vidéo semble-t-elle naturelle, sincère, non-polie? Le thérapeute est-il authentique?
4. CLARTÉ CTA (0-20): L'appel à l'action est-il explicite et irrésistible? Sait-on exactement quoi faire?
5. QUALITÉ TECHNIQUE (0-20): L'audio, l'éclairage, le cadrage et la résolution sont-ils professionnels?
6. RYTHME ET DURÉE (0-20): Le rythme est-il engageant? La durée est-elle optimale pour le segment?

Rappels importants:
- Les vidéos thérapeutiques doivent privilégier L'AUTHENTICITÉ sur la perfection
- Les hooks efficaces posent une question ou établissent un problème dans les 3 premières secondes
- Le CTR prédit dépend SURTOUT du hook et de l'authenticité
- L'arc émotionnel doit se sentir organique, jamais forcé
- Le français doit être naturel et accessible

Fournis ton évaluation en JSON valide UNIQUEMENT.`

    const userPrompt = `Évalue cette vidéo thérapeutique en fonction de mes directives.

CONTEXTE:
- Spécialité: ${specialty}
- Segment visé: ${targetSegment}
- Durée: ${videoMetadata.duration} secondes
- Audio: ${videoMetadata.hasAudio ? 'Oui' : 'Non'}

Réponds UNIQUEMENT en JSON valide dans ce format exact:
{
  "overallScore": <number 0-100>,
  "dimensions": {
    "hookStrength": { "score": <0-20>, "feedback": "..." },
    "emotionalArc": { "score": <0-20>, "feedback": "..." },
    "authenticityScore": { "score": <0-20>, "feedback": "..." },
    "ctaClarity": { "score": <0-20>, "feedback": "..." },
    "technicalQuality": { "score": <0-20>, "feedback": "..." },
    "paceAndLength": { "score": <0-20>, "feedback": "..." }
  },
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "predictedCTR": "low" | "medium" | "high" | "very_high",
  "readyToLaunch": true | false
}`

    const response = await this.client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const data = safeJsonParse<VideoAnalysis>(text, {
      overallScore: 0,
      dimensions: {
        hookStrength: { score: 0, feedback: 'Analyse échouée' },
        emotionalArc: { score: 0, feedback: 'Analyse échouée' },
        authenticityScore: { score: 0, feedback: 'Analyse échouée' },
        ctaClarity: { score: 0, feedback: 'Analyse échouée' },
        technicalQuality: { score: 0, feedback: 'Analyse échouée' },
        paceAndLength: { score: 0, feedback: 'Analyse échouée' },
      },
      strengths: [],
      improvements: [],
      predictedCTR: 'low',
      readyToLaunch: false,
    })
    return data
  }

  // Analyze video transcript (from audio transcription)
  async analyzeTranscript(params: {
    transcript: string
    specialty: string
    targetSegment: string
    duration: number
  }): Promise<VideoAnalysis> {
    const { transcript, specialty, targetSegment, duration } = params

    const systemPrompt = `Tu es un directeur créatif expérimenté spécialisé dans les vidéos thérapeutiques pour Meta Ads en France.

Tu évalues les transcriptions vidéo selon 6 dimensions critiques:
1. ACCROCHE (0-20): Les 3 premières secondes établissent-elles un problème ou posent-elles une question captivante?
2. ARC ÉMOTIONNEL (0-20): Y a-t-il une progression claire Problème → Empathie → Espoir → Solution?
3. AUTHENTICITÉ (0-20): Le langage est-il naturel, conversationnel, sincère? Y a-t-il de l'humanité?
4. CLARTÉ CTA (0-20): Y a-t-il un appel à l'action explicite et irrésistible à la fin?
5. QUALITÉ TECHNIQUE (0-20): Le texte indique-t-il une bonne diction, sans hésitations ni erreurs?
6. RYTHME ET DURÉE (0-20): La durée est-elle optimale (${duration}s)? Le rythme est-il fluide?

Priorité: L'AUTHENTICITÉ et l'EMPATHIE avant la perfection.

Fournis ton évaluation en JSON valide UNIQUEMENT.`

    const userPrompt = `Évalue cette transcription de vidéo thérapeutique.

CONTEXTE:
- Spécialité: ${specialty}
- Segment visé: ${targetSegment}
- Durée: ${duration} secondes

TRANSCRIPTION:
${transcript}

Réponds UNIQUEMENT en JSON valide dans ce format exact:
{
  "overallScore": <number 0-100>,
  "dimensions": {
    "hookStrength": { "score": <0-20>, "feedback": "..." },
    "emotionalArc": { "score": <0-20>, "feedback": "..." },
    "authenticityScore": { "score": <0-20>, "feedback": "..." },
    "ctaClarity": { "score": <0-20>, "feedback": "..." },
    "technicalQuality": { "score": <0-20>, "feedback": "..." },
    "paceAndLength": { "score": <0-20>, "feedback": "..." }
  },
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "predictedCTR": "low" | "medium" | "high" | "very_high",
  "readyToLaunch": true | false
}`

    const response = await this.client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const data = safeJsonParse<VideoAnalysis>(text, {
      overallScore: 0,
      dimensions: {
        hookStrength: { score: 0, feedback: 'Analyse échouée' },
        emotionalArc: { score: 0, feedback: 'Analyse échouée' },
        authenticityScore: { score: 0, feedback: 'Analyse échouée' },
        ctaClarity: { score: 0, feedback: 'Analyse échouée' },
        technicalQuality: { score: 0, feedback: 'Analyse échouée' },
        paceAndLength: { score: 0, feedback: 'Analyse échouée' },
      },
      strengths: [],
      improvements: [],
      predictedCTR: 'low',
      readyToLaunch: false,
    })
    return data
  }

  // Generate a complete video script
  async generateScript(params: {
    specialty: string
    targetSegment: string
    therapistName: string
    therapistApproach: string
    mainProblemSolved: string
    tone: 'warm' | 'professional' | 'energetic' | 'calm'
    duration: '30s' | '45s' | '60s' | '90s'
    format: 'talking_head' | 'testimonial_style' | 'educational' | 'day_in_life'
  }): Promise<VideoScript> {
    const {
      specialty,
      targetSegment,
      therapistName,
      therapistApproach,
      mainProblemSolved,
      tone,
      duration,
      format,
    } = params

    // Map duration to seconds for script breakdown
    const durationMap = {
      '30s': 30,
      '45s': 45,
      '60s': 60,
      '90s': 90,
    }
    const totalSeconds = durationMap[duration]

    const systemPrompt = `Tu es un réalisateur de contenu expert créant des scripts de vidéo thérapeutique pour Meta Ads en France.

Tu crées des scripts suivant cette structure:
- ACCROCHE (0-3s): Question provocatrice ou problème établi
- PROBLÈME (3-15s): Valide les frustrations du spectateur
- EMPATHIE (15-35s): Montre que tu comprends, établis la confiance
- SOLUTION (35-50s): Ton approche unique, ce qui te différencie
- CALL TO ACTION (50-${totalSeconds}s): Irrésistible, clair, spécifique

Style: Conversationnel, authentique, comme parler à un ami. Pas de jargon.
Tone à utiliser: ${tone}

Format de présentation: ${format}
- talking_head: Thérapeute face caméra
- testimonial_style: Histoire d'un patient (fiction)
- educational: Partage un concept/technique
- day_in_life: Montre une journée type

Fournis le script en JSON valide UNIQUEMENT.`

    const userPrompt = `Génère un script de vidéo pour Meta Ads.

PROFIL DU THÉRAPEUTE:
- Nom: ${therapistName}
- Spécialité: ${specialty}
- Approche: ${therapistApproach}
- Problème principal résolu: ${mainProblemSolved}

VIDÉO:
- Segment visé: ${targetSegment}
- Durée totale: ${duration} (${totalSeconds} secondes)
- Format: ${format}

Génère un script shot-by-shot avec dialogue exact, notes visuelles et justification psychologique.

Réponds UNIQUEMENT en JSON valide dans ce format exact:
{
  "title": "Titre percutant de la vidéo",
  "targetSegment": "${targetSegment}",
  "totalDuration": "${duration}",
  "shots": [
    {
      "timestamp": "0:00 - 0:03",
      "instruction": "Ce que le thérapeute doit faire",
      "dialogue": "Les mots exacts à dire (en français naturel)",
      "visualNote": "Angle caméra, geste, expression",
      "whyItWorks": "Explication psychologique courte"
    }
  ],
  "tips": ["Conseil 1", "Conseil 2"],
  "equipment": ["Téléphone", "Trépied", "Éclairage naturel"]
}`

    const response = await this.client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const data = safeJsonParse<VideoScript>(text, {
      title: 'Script non généré',
      targetSegment,
      totalDuration: duration,
      shots: [],
      tips: [],
      equipment: [],
    })
    return data
  }

  // Generate variant scripts for A/B testing
  async generateScriptVariants(params: {
    baseScript: VideoScript
    numberOfVariants: number
    varyElement: 'hook' | 'cta' | 'emotional_arc' | 'all'
  }): Promise<VideoScript[]> {
    const { baseScript, numberOfVariants, varyElement } = params

    const systemPrompt = `Tu es un directeur créatif créant des variantes de script pour A/B testing en vidéo Meta Ads.

Tu crées des variantes en changeant SEULEMENT les éléments spécifiés, tout en gardant l'structure générale et la durée totale identiques.

Principes pour les variantes:
- Si "hook": Change l'accroche pour tester des angles différents (urgence, curiosité, empathie, preuve sociale)
- Si "cta": Varie l'appel à l'action (urgence, offre spéciale, scarcité, FOMO)
- Si "emotional_arc": Restructure la progression émotionnelle (plus d'empathie vs plus de data, etc.)
- Si "all": Change tout créativement tout en gardant le message central

Fournis chaque variante en JSON valide UNIQUEMENT.`

    const userPrompt = `Génère ${numberOfVariants} variantes du script suivant pour A/B testing. Change l'élément: "${varyElement}".

SCRIPT DE BASE:
${JSON.stringify(baseScript, null, 2)}

Génère un JSON array avec ${numberOfVariants} objets VideoScript complets. Chaque variante doit:
- Garder la même durée totale (${baseScript.totalDuration})
- Viser le même segment (${baseScript.targetSegment})
- Varier UNIQUEMENT le/les élément(s) spécifié(s)

Réponds UNIQUEMENT en JSON valide dans ce format exact (array de scripts):
[
  {
    "title": "Titre variante 1",
    "targetSegment": "${baseScript.targetSegment}",
    "totalDuration": "${baseScript.totalDuration}",
    "shots": [{ "timestamp": "...", "instruction": "...", "dialogue": "...", "visualNote": "...", "whyItWorks": "..." }],
    "tips": ["..."],
    "equipment": ["..."]
  }
]`

    const response = await this.client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const data = safeJsonParse<VideoScript[]>(text, [])
    return data
  }

  // Score improvement: compare old vs new version
  async compareVersions(params: {
    oldAnalysis: VideoAnalysis
    newFrames: { base64: string; timestamp: string }[]
    newTranscript?: string
    specialty: string
    targetSegment: string
  }): Promise<ComparisonResult> {
    const { oldAnalysis, newFrames, newTranscript, specialty, targetSegment } = params

    // Get new analysis
    let newAnalysis: VideoAnalysis

    if (newTranscript) {
      // We have transcript, use it
      newAnalysis = await this.analyzeTranscript({
        transcript: newTranscript,
        specialty,
        targetSegment,
        duration: 60, // Default estimate
      })
    } else {
      // We have frames
      newAnalysis = await this.analyzeVideoFrames({
        frames: newFrames,
        specialty,
        targetSegment,
        videoMetadata: {
          duration: 60,
          hasAudio: !!newTranscript,
        },
      })
    }

    const improvement = ((newAnalysis.overallScore - oldAnalysis.overallScore) / oldAnalysis.overallScore) * 100

    // Determine what improved
    const whatImproved: string[] = []
    const dimensions = [
      'hookStrength',
      'emotionalArc',
      'authenticityScore',
      'ctaClarity',
      'technicalQuality',
      'paceAndLength',
    ] as const

    for (const dim of dimensions) {
      if (
        newAnalysis.dimensions[dim].score > oldAnalysis.dimensions[dim].score
      ) {
        whatImproved.push(
          `${dim}: ${oldAnalysis.dimensions[dim].score} → ${newAnalysis.dimensions[dim].score}`
        )
      }
    }

    // Determine what still needs work
    const stillNeedsWork: string[] = []
    for (const dim of dimensions) {
      if (newAnalysis.dimensions[dim].score < 15) {
        stillNeedsWork.push(`${dim}: ${newAnalysis.dimensions[dim].feedback}`)
      }
    }

    return {
      improvement,
      oldScore: oldAnalysis.overallScore,
      newScore: newAnalysis.overallScore,
      whatImproved,
      stillNeedsWork,
    }
  }
}
