import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ProfileData {
  name: string
  specialty: string
  city: string
  consultation_price: number
  approach_description: string
  main_techniques: string
  patient_transformation: string
  ideal_patient_profile: string
  main_problem_solved: string
  unique_differentiator: string
}

interface Signature {
  headline: string
  about: string
  benefits: string[]
  cta: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, profileData } = body as { userId: string; profileData: ProfileData }

    if (!userId || !profileData) {
      return NextResponse.json({ error: 'userId et profileData requis' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic non configuré' }, { status: 500 })
    }

    // Dynamic import — keeps Anthropic out of edge runtime
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const specialtyLabels: Record<string, string> = {
      hypnotherapeute:  'Hypnothérapeute',
      naturopathe:      'Naturopathe',
      sophrologue:      'Sophrologue',
      psychotherapeute: 'Psychothérapeute',
      coach:            'Coach de vie',
      osteopathe:       'Ostéopathe',
      kinesiologue:     'Kinésiologue',
      autre:            'Thérapeute',
    }
    const specialtyLabel = specialtyLabels[profileData.specialty] || profileData.specialty

    const systemPrompt = `Tu es un expert en copywriting et branding pour les thérapeutes indépendants.
Tu génères des textes ultra-personnalisés en français en format JSON uniquement.
Réponds TOUJOURS avec du JSON valide, sans markdown, sans commentaire, sans texte supplémentaire.`

    const userPrompt = `
Analyse le profil de ce thérapeute et génère sa "Therapist Signature" — un ensemble de textes de copywriting ultra-personnalisés pour sa landing page.

## Profil du thérapeute
- Nom : ${profileData.name}
- Spécialité : ${specialtyLabel}
- Ville : ${profileData.city}
- Tarif : ${profileData.consultation_price}€
- Approche thérapeutique : ${profileData.approach_description}
- Techniques principales : ${profileData.main_techniques}
- Transformation apportée : ${profileData.patient_transformation}
- Patient idéal : ${profileData.ideal_patient_profile}
- Problème principal résolu : ${profileData.main_problem_solved}
- Différenciateur unique / histoire : ${profileData.unique_differentiator}

## Instructions de copywriting
1. L'accroche (headline) doit être puissante, spécifique, et parler directement au patient idéal. Pas de généralités. Pas de clichés. 8-14 mots maximum.
2. Le paragraphe "À propos" doit être chaleureux, authentique, et créer une connexion émotionnelle. 3-4 phrases. Parler à la 1ère personne.
3. Les 3 bénéfices doivent être concrets, mesurables, et focalisés sur la transformation (pas les méthodes). 1-2 phrases chacun.
4. Le call-to-action doit être spécifique à cette spécialité et cette transformation. Pas "Prenez rendez-vous" — quelque chose de plus évocateur.

## Format de réponse (JSON strict)
{
  "headline": "string",
  "about": "string",
  "benefits": ["string", "string", "string"],
  "cta": "string"
}
`

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      temperature: 0.8,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    })

    const raw = completion.content[0]?.text
    if (!raw) throw new Error('Réponse Anthropic vide')

    const signature: Signature = JSON.parse(raw)

    // Validate structure
    if (!signature.headline || !signature.about || !Array.isArray(signature.benefits) || !signature.cta) {
      throw new Error('Structure de signature invalide')
    }

    // Save to Supabase (optional — gracefully fail)
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase-server')
      const supabase = await createServerSupabaseClient()
      await supabase
        .from('therapist_profiles')
        .update({ signature_content: signature, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    } catch {
      // Don't fail the request if DB update fails
    }

    return NextResponse.json({ success: true, signature })

  } catch (err) {
    console.error('[generate-signature]', err)
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
