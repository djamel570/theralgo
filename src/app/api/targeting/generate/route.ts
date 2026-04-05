import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { ProfileDataSchema, TargetingGenerateSchema } from '@/lib/validations'
import { getAuthenticatedUser, forbidden } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

interface DiagnosticData {
  has_pixel: boolean
  has_capi: boolean
  has_landing_page: boolean
  landing_page_url: string
  form_type: 'native_meta' | 'website_form' | 'calendly' | 'doctolib' | 'other'
  has_crm: boolean
  crm_name: string
  existing_events: string[]
  current_lead_source: string[]
  monthly_budget: number
  main_objective: 'leads' | 'calls' | 'appointments' | 'workshops' | 'other'
}

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
  temperature: string
  media_priority: string
  example_situations: string[]
}

interface CompletePlan {
  diagnostic: object
  segments: object[]
  creative_plan: object[]
  campaign_structure: object
  funnel_variants?: object[]
  video_scripts?: object[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate entire request body against schema
    const validation = TargetingGenerateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      )
    }

    const {
      profileId,
      profileData,
      diagnosticData,
      budget,
      generateFunnelVariants = false,
      generateVideoScripts = false,
    } = validation.data

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Step 1: Diagnostic
    const diagnosticRes = await fetch(`${baseUrl}/api/targeting/diagnostic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, therapistData: diagnosticData }),
    })

    if (!diagnosticRes.ok) {
      throw new Error('Failed to generate diagnostic')
    }

    const diagnosticResult = await diagnosticRes.json()
    const diagnostic = diagnosticResult.diagnostic

    // Step 2: Intentions
    const intentionsRes = await fetch(`${baseUrl}/api/targeting/intentions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, profileData }),
    })

    if (!intentionsRes.ok) {
      throw new Error('Failed to generate intentions')
    }

    const intentionsResult = await intentionsRes.json()
    const segments = intentionsResult.segments

    // Step 3: Creatives
    const creativesRes = await fetch(`${baseUrl}/api/targeting/creatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, segments, profileData }),
    })

    if (!creativesRes.ok) {
      throw new Error('Failed to generate creatives')
    }

    const creativesResult = await creativesRes.json()
    const creative_plan = creativesResult.creative_plan

    // Step 4: Structure
    const structureRes = await fetch(`${baseUrl}/api/targeting/structure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, diagnostic, segments, creatives: creative_plan, budget }),
    })

    if (!structureRes.ok) {
      throw new Error('Failed to generate structure')
    }

    const structureResult = await structureRes.json()
    const campaign_structure = structureResult.campaign_structure

    // Compile complete plan
    const complete_plan: CompletePlan = {
      diagnostic,
      segments,
      creative_plan,
      campaign_structure,
    }

    // Step 5 (Optional): Generate funnel variants
    let funnel_variants: object[] | undefined
    if (generateFunnelVariants) {
      const funnelRes = await fetch(`${baseUrl}/api/targeting/funnel-variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          segments,
          profileData,
        }),
      })

      if (!funnelRes.ok) {
        // Log warning but don't fail the entire request
        console.warn('Warning: Failed to generate funnel variants')
      } else {
        const funnelResult = await funnelRes.json()
        funnel_variants = funnelResult.funnel_variants
        complete_plan.funnel_variants = funnel_variants
      }
    }

    // Step 6 (Optional): Generate video scripts
    let video_scripts: object[] | undefined
    if (generateVideoScripts) {
      // Select top 3 segments by media_priority
      const topSegments = (segments as Segment[])
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return (priorityOrder[a.media_priority as keyof typeof priorityOrder] || 3) -
                 (priorityOrder[b.media_priority as keyof typeof priorityOrder] || 3)
        })
        .slice(0, 3)

      const videoRes = await fetch(`${baseUrl}/api/targeting/video-scripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          segments: topSegments,
          profileData,
        }),
      })

      if (!videoRes.ok) {
        // Log warning but don't fail the entire request
        console.warn('Warning: Failed to generate video scripts')
      } else {
        const videoResult = await videoRes.json()
        video_scripts = videoResult.video_scripts
        complete_plan.video_scripts = video_scripts
      }
    }

    // Save complete plan to Supabase
    const supabase = createServiceSupabaseClient()

    const { error: dbError } = await supabase.from('targeting_plans').insert({
      profile_id: profileId,
      user_id: user.id,
      plan_type: 'complete',
      plan_data: complete_plan,
      created_at: new Date().toISOString(),
    })

    if (dbError) throw dbError

    return NextResponse.json({
      success: true,
      plan: complete_plan,
    })
  } catch (err: unknown) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
