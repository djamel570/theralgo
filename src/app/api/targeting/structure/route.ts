import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { getAuthenticatedUser, forbidden } from '@/lib/auth-helpers'
import { withRetry } from '@/lib/resilience'

export const dynamic = 'force-dynamic'

interface Diagnostic {
  signal_score: number
  maturity_level: string
}

interface Segment {
  name: string
  description: string
  temperature: 'cold' | 'warm' | 'hot'
  media_priority: 'high' | 'medium' | 'low'
  example_situations: string[]
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

interface AdSet {
  name: string
  segment: string
  daily_budget: number
  hooks_to_test: string[]
  priority: 'high' | 'medium' | 'low'
}

interface CampaignStructure {
  total_campaigns: number
  optimization_event: string
  audience_strategy: string
  ad_sets: AdSet[]
  testing_plan: string
  estimated_learning_period_days: number
}

interface ResponseData {
  campaign_structure: CampaignStructure
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.profileId || !body.diagnostic || !body.segments || !body.creatives || !body.budget) {
      return NextResponse.json(
        { error: 'Missing required fields (profileId, diagnostic, segments, creatives, budget)' },
        { status: 400 }
      )
    }

    const { profileId, diagnostic, segments, creatives: creative_plan, budget } = body

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

    // Build context for Claude
    const segmentSummary = segments
      .map(
        s => `
- ${s.name} (${s.temperature} | Priority: ${s.media_priority}): ${s.description}
`
      )
      .join('\n')

    const prompt = `Tu es un stratégiste en campagnes Meta Ads pour thérapeutes. Génère une structure de campagne optimisée.

Données:
- Signal Score: ${diagnostic.signal_score}/100
- Maturity Level: ${diagnostic.maturity_level}
- Budget mensuel: ${budget}€
- Nombre de segments: ${segments.length}

Segments:
${segmentSummary}

Recommande:
1. Nombre de campagnes (1-3 généralement)
2. Nombre d'ad sets par campagne (alignés aux segments)
3. Allocation de budget par ad set
4. Événement d'optimisation recommandé (basé sur le diagnostic)
5. Type d'audience ("broad", "advantage_plus", "lookalike", ou "interest_based")
6. Stratégie de test détaillée
7. Durée estimée de la phase d'apprentissage

Réponds UNIQUEMENT en JSON:
{
  "campaign_structure": {
    "total_campaigns": 1-3,
    "optimization_event": "Lead|Appel|Rendez-vous|PageView",
    "audience_strategy": "broad|advantage_plus|lookalike|interest_based",
    "ad_sets": [
      {
        "name": "Ad Set Name",
        "segment": "Segment Name",
        "daily_budget": number,
        "hooks_to_test": ["hook1", "hook2"],
        "priority": "high|medium|low"
      }
    ],
    "testing_plan": "Stratégie détaillée en français",
    "estimated_learning_period_days": 7-21
  }
}`

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const completion = await withRetry(async () => {
      return anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        temperature: 0.7,
        system: 'Tu es un expert en structure de campagnes Meta Ads pour thérapeutes. Tu recommandes des structures équilibrées et testables. Réponds UNIQUEMENT en JSON valide.',
        messages: [{ role: 'user', content: prompt }],
      })
    }, { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 })

    const text = completion.content[0].type === 'text' ? completion.content[0].text : '{}'
    const data: ResponseData = JSON.parse(text)
    const campaign_structure = data.campaign_structure

    // Save to Supabase
    const supabase = createServiceSupabaseClient()

    const { error: dbError } = await supabase.from('targeting_plans').insert({
      profile_id: profileId,
      user_id: user.id,
      plan_type: 'structure',
      plan_data: campaign_structure,
      created_at: new Date().toISOString(),
    })

    if (dbError) throw dbError

    return NextResponse.json({
      success: true,
      campaign_structure,
    })
  } catch (err: unknown) {
    console.error('Structure error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
