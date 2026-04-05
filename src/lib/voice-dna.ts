// src/lib/voice-dna.ts
// Voice DNA — captures and models each therapist's unique communication style
// Analyzes and extracts voice characteristics for content generation

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase'

const anthropic = new Anthropic()

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceProfile {
  therapist_id: string
  tone_warmth: number // 0-1
  tone_authority: number // 0-1
  tone_empathy: number // 0-1
  tone_humor: number // 0-1
  tone_directness: number // 0-1
  preferred_expressions: Record<string, number> // expression -> frequency score
  avoided_expressions: Record<string, number> // expression -> frequency score
  metaphor_style: 'minimal' | 'moderate' | 'abundant'
  sentence_length: 'short' | 'medium' | 'long'
  formality_level: 'casual' | 'professional' | 'formal'
  recurring_themes: Record<string, number> // theme -> frequency
  explanation_patterns: Record<string, number> // pattern -> frequency
  signature_phrases: string[]
  source_video_ids: string[]
  source_content_ids: string[]
  confidence_score: number // 0-1 (increases with more samples)
  samples_analyzed: number
  last_calibrated_at: string
}

export interface VoiceSample {
  source: 'video' | 'text' | 'interview'
  content: string
  sourceId?: string
}

export interface VoiceAnalysis {
  tones: {
    warmth: number
    authority: number
    empathy: number
    humor: number
    directness: number
  }
  preferred_expressions: string[]
  avoided_expressions: string[]
  metaphor_usage: 'minimal' | 'moderate' | 'abundant'
  sentence_patterns: {
    average_length: number
    style: 'short' | 'medium' | 'long'
  }
  recurring_themes: string[]
  explanation_patterns: string[]
  signature_phrases: string[]
}

export interface VoiceInterviewQuestion {
  id: string
  question: string
  purpose: string
  expected_response_length: 'short' | 'medium' | 'long'
}

// ============================================================================
// 1. ANALYZE VOICE SAMPLE
// ============================================================================

export async function analyzeVoiceSample(sample: VoiceSample): Promise<VoiceAnalysis> {
  const systemPrompt = `Vous êtes un expert en analyse du style de communication et de la voix unique des thérapeutes.

Analysez le contenu fourni et identifiez les caractéristiques distinctives de la communication du thérapeute:
- Tonalité et sentiment (chaleur, autorité, empathie, humour, directivité)
- Expressions préférées et habituelles
- Expressions à éviter
- Utilisation de métaphores et d'analogies
- Longueur et structure des phrases
- Thèmes récurrents dans le discours
- Motifs d'explication préférés
- Phrases caractéristiques ou signature

Répondez en JSON valide uniquement, sans texte supplémentaire.`

  const userPrompt = `Analysez la voix unique de ce thérapeute dans le contenu suivant:

Source: ${sample.source}

Contenu:
${sample.content}

Fournissez une analyse détaillée au format JSON avec la structure suivante:
{
  "tones": {
    "warmth": <0-1>,
    "authority": <0-1>,
    "empathy": <0-1>,
    "humor": <0-1>,
    "directness": <0-1>
  },
  "preferred_expressions": [<list of 5-10 common expressions>],
  "avoided_expressions": [<list of 3-5 expressions or patterns never used>],
  "metaphor_usage": "<minimal|moderate|abundant>",
  "sentence_patterns": {
    "average_length": <approximate word count>,
    "style": "<short|medium|long>"
  },
  "recurring_themes": [<list of 3-5 recurring themes in the therapy context>],
  "explanation_patterns": [<list of how they typically explain concepts>],
  "signature_phrases": [<list of 2-5 unique or frequently repeated phrases>]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  try {
    const analysis = JSON.parse(content.text) as VoiceAnalysis
    return analysis
  } catch (error) {
    throw new Error(`Failed to parse voice analysis: ${error}`)
  }
}

// ============================================================================
// 2. BUILD VOICE PROFILE
// ============================================================================

export async function buildVoiceProfile(
  therapistId: string,
  samples: VoiceSample[]
): Promise<VoiceProfile> {
  if (samples.length === 0) {
    throw new Error('At least one sample is required to build a voice profile')
  }

  // Analyze all samples
  const analyses = await Promise.all(samples.map((sample) => analyzeVoiceSample(sample)))

  // Aggregate tone scores
  const avgTones = {
    warmth: analyses.reduce((sum, a) => sum + a.tones.warmth, 0) / analyses.length,
    authority: analyses.reduce((sum, a) => sum + a.tones.authority, 0) / analyses.length,
    empathy: analyses.reduce((sum, a) => sum + a.tones.empathy, 0) / analyses.length,
    humor: analyses.reduce((sum, a) => sum + a.tones.humor, 0) / analyses.length,
    directness: analyses.reduce((sum, a) => sum + a.tones.directness, 0) / analyses.length,
  }

  // Aggregate expressions
  const preferredExprMap = new Map<string, number>()
  const avoidedExprMap = new Map<string, number>()

  analyses.forEach((analysis) => {
    analysis.preferred_expressions.forEach((expr) => {
      preferredExprMap.set(expr, (preferredExprMap.get(expr) || 0) + 1)
    })
    analysis.avoided_expressions.forEach((expr) => {
      avoidedExprMap.set(expr, (avoidedExprMap.get(expr) || 0) + 1)
    })
  })

  // Aggregate themes and patterns
  const themesMap = new Map<string, number>()
  const patternsMap = new Map<string, number>()
  const signaturePhrases = new Set<string>()

  analyses.forEach((analysis) => {
    analysis.recurring_themes.forEach((theme) => {
      themesMap.set(theme, (themesMap.get(theme) || 0) + 1)
    })
    analysis.explanation_patterns.forEach((pattern) => {
      patternsMap.set(pattern, (patternsMap.get(pattern) || 0) + 1)
    })
    analysis.signature_phrases.forEach((phrase) => {
      if (analysis.signature_phrases.filter((p) => p === phrase).length > 0) {
        signaturePhrases.add(phrase)
      }
    })
  })

  // Determine metaphor style (most common)
  const metaphorCounts = analyses.reduce(
    (acc, a) => {
      acc[a.metaphor_usage] = (acc[a.metaphor_usage] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const metaphorStyle = (
    Object.entries(metaphorCounts).sort(([, a], [, b]) => b - a)[0][0] || 'moderate'
  ) as 'minimal' | 'moderate' | 'abundant'

  // Determine sentence length (most common)
  const sentenceCounts = analyses.reduce(
    (acc, a) => {
      acc[a.sentence_patterns.style] = (acc[a.sentence_patterns.style] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const sentenceLength = (
    Object.entries(sentenceCounts).sort(([, a], [, b]) => b - a)[0][0] || 'medium'
  ) as 'short' | 'medium' | 'long'

  // Confidence score increases with more samples (0.5 for 1 sample, 0.95 for 5+)
  const confidenceScore = Math.min(0.95, 0.5 + samples.length * 0.1)

  const profile: VoiceProfile = {
    therapist_id: therapistId,
    tone_warmth: avgTones.warmth,
    tone_authority: avgTones.authority,
    tone_empathy: avgTones.empathy,
    tone_humor: avgTones.humor,
    tone_directness: avgTones.directness,
    preferred_expressions: Object.fromEntries(preferredExprMap),
    avoided_expressions: Object.fromEntries(avoidedExprMap),
    metaphor_style: metaphorStyle,
    sentence_length: sentenceLength,
    formality_level: 'professional', // Default, can be refined
    recurring_themes: Object.fromEntries(themesMap),
    explanation_patterns: Object.fromEntries(patternsMap),
    signature_phrases: Array.from(signaturePhrases),
    source_video_ids: samples
      .filter((s) => s.source === 'video' && s.sourceId)
      .map((s) => s.sourceId!),
    source_content_ids: [],
    confidence_score: confidenceScore,
    samples_analyzed: samples.length,
    last_calibrated_at: new Date().toISOString(),
  }

  // Save to Supabase
  const supabase = createClient()
  const { error } = await supabase
    .from('voice_profiles')
    .upsert(profile, { onConflict: 'therapist_id' })

  if (error) {
    throw new Error(`Failed to save voice profile: ${error.message}`)
  }

  return profile
}

// ============================================================================
// 3. EXTRACT FROM VIDEO ANALYSES
// ============================================================================

export async function extractFromVideoAnalyses(therapistId: string): Promise<VoiceSample[]> {
  const supabase = createClient()

  const { data: analyses, error } = await supabase
    .from('video_analyses')
    .select('id, transcript, description, video_metadata')
    .eq('therapist_id', therapistId)

  if (error) {
    throw new Error(`Failed to fetch video analyses: ${error.message}`)
  }

  if (!analyses || analyses.length === 0) {
    return []
  }

  return analyses.map((analysis) => ({
    source: 'video' as const,
    content: analysis.transcript || analysis.description || '',
    sourceId: analysis.id,
  }))
}

// ============================================================================
// 4. CALIBRATE FROM CONTENT EDITS
// ============================================================================

export async function calibrateFromContent(
  therapistId: string,
  contentId: string,
  wasEdited: boolean
): Promise<void> {
  if (!wasEdited) {
    return
  }

  const supabase = createClient()

  // Fetch the content piece
  const { data: content, error: fetchError } = await supabase
    .from('content_pieces')
    .select('original_text, edited_text, metadata')
    .eq('id', contentId)
    .eq('therapist_id', therapistId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch content: ${fetchError.message}`)
  }

  if (!content.edited_text) {
    return
  }

  // Use Claude to analyze the differences and extract learnings
  const systemPrompt = `Vous êtes un expert en analyse des styles de communication.
Comparez le contenu original généré avec la version éditée par le thérapeute.
Identifiez ce qui a été changé et ce que cela révèle sur les préférences de voix du thérapeute.
Répondez en JSON valide uniquement.`

  const userPrompt = `Contenu original généré:
${content.original_text}

Contenu édité par le thérapeute:
${content.edited_text}

Analysez les changements et fournissez un feedback JSON:
{
  "changes_made": [<list of types of changes>],
  "preferences_revealed": {
    "tone": <brief description>,
    "expressions": <brief description>,
    "structure": <brief description>
  },
  "learning_points": [<what to apply in future generation>]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const responseText = response.content[0]
  if (responseText.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  try {
    const feedback = JSON.parse(responseText.text)
    // Store feedback metadata for future analysis
    const { error: updateError } = await supabase
      .from('content_pieces')
      .update({ metadata: { ...content.metadata, calibration_feedback: feedback } })
      .eq('id', contentId)

    if (updateError) {
      console.warn(`Failed to update calibration feedback: ${updateError.message}`)
    }
  } catch (error) {
    console.warn(`Failed to parse calibration feedback: ${error}`)
  }
}

// ============================================================================
// 5. GET VOICE PROFILE
// ============================================================================

export async function getVoiceProfile(therapistId: string): Promise<VoiceProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('therapist_id', therapistId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(`Failed to fetch voice profile: ${error.message}`)
  }

  return data as VoiceProfile
}

// ============================================================================
// 6. GENERATE VOICE PROMPT
// ============================================================================

export function generateVoicePrompt(profile: VoiceProfile): string {
  const toneDescriptions: string[] = []

  // Tone descriptions
  if (profile.tone_warmth > 0.7) toneDescriptions.push('chaleureux et bienveillant')
  if (profile.tone_empathy > 0.7) toneDescriptions.push('empathique et attentionné')
  if (profile.tone_authority > 0.6) toneDescriptions.push('assuré et expert')
  if (profile.tone_humor > 0.5) toneDescriptions.push('avec une touche d\'humour')
  if (profile.tone_directness > 0.7) toneDescriptions.push('direct et clair')

  const toneSection = `Écrivez dans un ton ${toneDescriptions.join(', ') || 'professionnel et aidant'}.`

  // Metaphor section
  const metaphorSection =
    profile.metaphor_style === 'abundant'
      ? 'Utilisez généreusement des métaphores et des analogies pour illustrer les concepts.'
      : profile.metaphor_style === 'minimal'
        ? 'Évitez les métaphores; préférez les explications directes et concrètes.'
        : 'Utilisez des métaphores avec modération pour clarifier les concepts clés.'

  // Expressions section
  const preferredExprs = Object.keys(profile.preferred_expressions).slice(0, 5)
  const avoidedExprs = Object.keys(profile.avoided_expressions).slice(0, 3)

  let expressionSection = ''
  if (preferredExprs.length > 0) {
    expressionSection += `Préférez les expressions comme: "${preferredExprs.join('", "')}".\n`
  }
  if (avoidedExprs.length > 0) {
    expressionSection += `Évitez les expressions comme: "${avoidedExprs.join('", "')}".\n`
  }

  // Sentence length
  const lengthSection =
    profile.sentence_length === 'short'
      ? 'Privilégiez les phrases courtes et percutantes.'
      : profile.sentence_length === 'long'
        ? 'Utilisez des phrases plus longues et nuancées pour développer les idées.'
        : 'Alternez entre les phrases courtes pour l\'impact et les phrases plus longues pour la nuance.'

  // Signature phrases
  const sigSection =
    profile.signature_phrases.length > 0
      ? `Utilisez occasionnellement ses phrases caractéristiques: "${profile.signature_phrases.slice(0, 2).join('", "')}".`
      : ''

  // Themes section
  const themes = Object.keys(profile.recurring_themes).slice(0, 3)
  const themesSection =
    themes.length > 0
      ? `Intégrez naturellement ces thèmes récurrents: ${themes.join(', ')}.`
      : ''

  return [toneSection, metaphorSection, expressionSection, lengthSection, sigSection, themesSection]
    .filter(Boolean)
    .join('\n')
}

// ============================================================================
// 7. CONDUCT VOICE INTERVIEW
// ============================================================================

export function conductVoiceInterview(): VoiceInterviewQuestion[] {
  return [
    {
      id: 'approach',
      question:
        'Comment décrivez-vous votre approche thérapeutique unique auprès d\'un nouveau patient?',
      purpose: 'Capture overall therapeutic philosophy and core values',
      expected_response_length: 'long',
    },
    {
      id: 'metaphors',
      question:
        'Quelles métaphores ou analogies utilisez-vous le plus souvent pour aider vos patients à comprendre?',
      purpose: 'Identify preferred metaphor patterns',
      expected_response_length: 'medium',
    },
    {
      id: 'expressions',
      question: 'Y a-t-il des phrases ou des expressions que vous utilisez régulièrement?',
      purpose: 'Extract signature phrases and common expressions',
      expected_response_length: 'medium',
    },
    {
      id: 'challenges',
      question:
        'Comment abordez-vous les sujets difficiles ou sensibles avec vos patients?',
      purpose: 'Understand tone when handling sensitive topics',
      expected_response_length: 'long',
    },
    {
      id: 'explanation',
      question: 'Décrivez votre méthode habituelle pour expliquer des concepts psychologiques complexes.',
      purpose: 'Identify explanation patterns and complexity handling',
      expected_response_length: 'long',
    },
    {
      id: 'style',
      question:
        'Préférez-vous une communication directe ou préférez-vous prendre du temps pour élaborer vos idées?',
      purpose: 'Determine directness and sentence length preferences',
      expected_response_length: 'short',
    },
    {
      id: 'humor',
      question: 'Quel rôle l\'humour joue-t-il dans votre pratique thérapeutique?',
      purpose: 'Assess humor frequency and style',
      expected_response_length: 'medium',
    },
    {
      id: 'themes',
      question:
        'Quels thèmes ou concepts revenez-vous souvent dans votre travail avec les patients?',
      purpose: 'Identify recurring themes',
      expected_response_length: 'medium',
    },
  ]
}

// ============================================================================
// 8. PROCESS INTERVIEW ANSWERS
// ============================================================================

export async function processInterviewAnswers(
  therapistId: string,
  answers: Record<string, string>
): Promise<VoiceProfile> {
  // Convert interview answers into voice samples
  const interviewContent = Object.entries(answers)
    .map(([, answer]) => answer)
    .join('\n\n')

  const sample: VoiceSample = {
    source: 'interview',
    content: interviewContent,
    sourceId: `interview-${therapistId}-${Date.now()}`,
  }

  // Build profile from interview
  const profile = await buildVoiceProfile(therapistId, [sample])

  return profile
}
