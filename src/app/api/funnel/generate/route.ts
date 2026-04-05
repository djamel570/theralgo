import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { adaptiveFunnelEngine } from '@/lib/adaptive-funnel'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ['admin@theralgo.fr', process.env.ADMIN_EMAIL || '']

/**
 * POST /api/funnel/generate
 *
 * Generate all funnel variants for a therapist profile.
 * Admin only.
 *
 * Request body:
 * {
 *   profileId: string
 *   specialty: string
 *   segments: Array<{ key: string, label: string }>
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check - admin only
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const supabase = createServiceSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { profileId, specialty, segments } = body

    if (!profileId || !specialty || !segments || !Array.isArray(segments)) {
      return NextResponse.json(
        { error: 'Invalid request: missing profileId, specialty, or segments' },
        { status: 400 }
      )
    }

    // Fetch therapist profile
    const { data: profile, error: profileError } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Generate all variants
    const variants = await adaptiveFunnelEngine.generateAllVariants({
      profileId,
      specialty,
      segments,
      therapistProfile: {
        name: profile.name,
        city: profile.city,
        approach_description: profile.approach_description,
        main_problem_solved: profile.main_problem_solved,
        main_techniques: profile.main_techniques,
        patient_transformation: profile.patient_transformation,
      },
    })

    return NextResponse.json({
      success: true,
      variantCount: variants.length,
      variants,
    })
  } catch (err) {
    console.error('Funnel variant generation error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
