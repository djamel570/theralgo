import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { TargetingIntentionsSchema, ProfileDataSchema } from '@/lib/validations'
import { getAuthenticatedUser, forbidden } from '@/lib/auth-helpers'
import { withRetry } from '@/lib/resilience'

export const dynamic = 'force-dynamic'

interface ProfileData {
  specialty: string
  city: string
  main_problem_solved: string
  patient_transformation: string
  ideal_patient_profile: string
  approach_description: string
}

interface Segment {
  name: string
  description: string
  temperature: 'cold' | 'warm' | 'hot'
  media_priority: 'high' | 'medium' | 'low'
  example_situations: string[]
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

    if (!body.profileId) {
      return NextResponse.json(
        { error: 'Missing profileId' },
        { status: 400 }
      )
    }

    const { profileId } = body
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

    // Call Claude API to generate intention segments
    const prompt = `Analyze this therapist's profile and generate 3-7 intention segments for Meta Ads targeting.

Profile:
- Specialty: ${profileData.specialty}
- City: ${profileData.city}
- Main Problem Solved: ${profileData.main_problem_solved}
- Patient Transformation: ${profileData.patient_transformation}
- Ideal Patient Profile: ${profileData.ideal_patient_profile}
- Approach: ${profileData.approach_description}

Generate intention segments based on pain points, situations, and motivations (NOT Meta interest keywords). Each segment should include:
- name: Segment name
- description: What this audience is dealing with
- temperature: "cold" (unaware), "warm" (aware but indecisive), or "hot" (actively seeking)
- media_priority: "high", "medium", or "low"
- example_situations: Array of real-life situations this audience faces

Respond ONLY with valid JSON in this format:
{
  "segments": [
    {
      "name": "...",
      "description": "...",
      "temperature": "cold|warm|hot",
      "media_priority": "high|medium|low",
      "example_situations": ["...", "..."]
    }
  ]
}`

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const completion = await withRetry(async () => {
      return anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: 0.7,
        system: 'Tu es un stratège en Meta Ads spécialisé dans le secteur santé et bien-être. Tu analyses les profils de thérapeutes et génères des segments d\'intention basés sur la psychologie des patients. Réponds UNIQUEMENT en JSON valide.',
        messages: [{ role: 'user', content: prompt }],
      })
    }, { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 })

    const text = completion.content[0].type === 'text' ? completion.content[0].text : '{}'
    const data = JSON.parse(text)
    const segments: Segment[] = data.segments || []

    // Save to Supabase
    const supabase = createServiceSupabaseClient()

    const { error: dbError } = await supabase.from('targeting_plans').insert({
      profile_id: profileId,
      user_id: user.id,
      plan_type: 'intentions',
      plan_data: segments,
      created_at: new Date().toISOString(),
    })

    if (dbError) throw dbError

    return NextResponse.json({
      success: true,
      segments,
    })
  } catch (err: unknown) {
    console.error('Intentions error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
