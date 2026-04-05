import { NextRequest, NextResponse } from 'next/server'
import { CreativeDirector, VideoScript } from '@/lib/creative-director'
import { getAuthenticatedUser, forbidden } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      profileId,
      specialty,
      targetSegment,
      therapistName,
      therapistApproach,
      mainProblemSolved,
      tone,
      duration,
      format,
    } = body

    // Validate required fields
    const requiredFields = [
      'specialty',
      'targetSegment',
      'therapistName',
      'therapistApproach',
      'mainProblemSolved',
      'tone',
      'duration',
      'format',
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Verify user owns this profile
    if (profileId) {
      const supabaseForCheck = createServiceSupabaseClient()
      const { data: profile } = await supabaseForCheck
        .from('therapist_profiles')
        .select('user_id')
        .eq('id', profileId)
        .single()

      if (!profile || profile.user_id !== user.id) {
        return forbidden('You do not have permission to access this profile')
      }
    }

    // Generate script with Creative Director
    const director = new CreativeDirector()
    const script: VideoScript = await director.generateScript({
      specialty,
      targetSegment,
      therapistName,
      therapistApproach,
      mainProblemSolved,
      tone: tone as 'warm' | 'professional' | 'energetic' | 'calm',
      duration: duration as '30s' | '45s' | '60s' | '90s',
      format: format as 'talking_head' | 'testimonial_style' | 'educational' | 'day_in_life',
    })

    // Optionally save script to database
    if (profileId) {
      const supabase = createServiceSupabaseClient()
      await supabase.from('generated_scripts').insert({
        profile_id: profileId,
        user_id: user.id,
        segment_name: targetSegment,
        script_data: script,
        tone,
        duration,
        format,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      script,
    })
  } catch (err: unknown) {
    console.error('Creative script error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
