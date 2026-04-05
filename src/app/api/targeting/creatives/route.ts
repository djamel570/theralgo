import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { ProfileDataSchema } from '@/lib/validations'
import { getAuthenticatedUser, forbidden } from '@/lib/auth-helpers'
import { withRetry } from '@/lib/resilience'

export const dynamic = 'force-dynamic'

interface Segment {
  name: string
  description: string
  temperature: 'cold' | 'warm' | 'hot'
  media_priority: 'high' | 'medium' | 'low'
  example_situations: string[]
}

interface ProfileData {
  specialty: string
  city: string
  main_problem_solved: string
  patient_transformation: string
  ideal_patient_profile: string
  approach_description: string
}

interface CreativeItem {
  segment_name: string
  hooks: string[]
  promises: string[]
  angles: {
    educational: string
    transformation: string
    reassurance: string
  }
}

interface CreativePlan {
  creative_plan: CreativeItem[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate profile data
    const profileValidation = ProfileDataSchema.safeParse(body.profileData)
    if (!profileValidation.success) {
      return NextResponse.json(
        { error: 'Invalid profileData', details: profileValidation.error.errors },
        { status: 400 }
      )
    }

    if (!body.profileId || !Array.isArray(body.segments)) {
      return NextResponse.json(
        { error: 'Missing profileId or segments' },
        { status: 400 }
      )
    }

    const { profileId, segments } = body
    const profileData = profileValidation.data

    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this profile
    const supabaseForCheck = createServiceSupabaseClient()
    const { data: profile } = await supabaseForCheck
      .from('therapist_profiles')
      .select('user_id')
      .eq('id', profileId)
      .single()

    if (!profile || profile.user_id !== user.id) {
      return forbidden('You do not have permission to access this profile')
    }

    // Build segment details for Claude
    const segmentDetails = segments
      .map(
        s => `
Segment: ${s.name}
Description: ${s.description}
Temperature: ${s.temperature}
Media Priority: ${s.media_priority}
Example Situations: ${s.example_situations.join(', ')}
`
      )
      .join('\n')

    const prompt = `Tu es un expert en copywriting pour les publicités Meta Ads de thérapeutes en France. Génère du contenu créatif percutant et empathique.

Profil du thérapeute:
- Spécialité: ${profileData.specialty}
- Ville: ${profileData.city}
- Problème résolu: ${profileData.main_problem_solved}
- Transformation: ${profileData.patient_transformation}
- Profil client idéal: ${profileData.ideal_patient_profile}
- Approche: ${profileData.approach_description}

Segments d'intention:
${segmentDetails}

Pour CHAQUE segment, génère:
- 3 hooks (accroches percutantes, max 15 mots)
- 2 promesses testables (ce que le patient recevra)
- 3 angles créatifs:
  * educational: Angle pédagogique (partager du savoir)
  * transformation: Angle transformation (avant/après)
  * reassurance: Angle rassurant (confiance, sécurité)

Réponds UNIQUEMENT en JSON valide dans ce format exact:
{
  "creative_plan": [
    {
      "segment_name": "...",
      "hooks": ["...", "...", "..."],
      "promises": ["...", "..."],
      "angles": {
        "educational": "...",
        "transformation": "...",
        "reassurance": "..."
      }
    }
  ]
}`

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const completion = await withRetry(async () => {
      return anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: 0.8,
        system: 'Tu es un expert en copywriting publicitaire pour thérapeutes. Tu crées du contenu émotif, percutant et centré sur le patient. Tous les textes doivent être en français. Réponds UNIQUEMENT en JSON valide, sans markdown.',
        messages: [{ role: 'user', content: prompt }],
      })
    }, { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 })

    const text = completion.content[0].type === 'text' ? completion.content[0].text : '{}'
    const data: CreativePlan = JSON.parse(text)
    const creative_plan = data.creative_plan || []

    // Save to Supabase
    const supabase = createServiceSupabaseClient()

    const { error: dbError } = await supabase.from('targeting_plans').insert({
      profile_id: profileId,
      user_id: user.id,
      plan_type: 'creatives',
      plan_data: creative_plan,
      created_at: new Date().toISOString(),
    })

    if (dbError) throw dbError

    return NextResponse.json({
      success: true,
      creative_plan,
    })
  } catch (err: unknown) {
    console.error('Creatives error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
