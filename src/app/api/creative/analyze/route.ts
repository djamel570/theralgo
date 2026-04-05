import { NextRequest, NextResponse } from 'next/server'
import { CreativeDirector, VideoAnalysis } from '@/lib/creative-director'
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
    const { frames, videoMetadata, specialty, targetSegment, profileId } = body

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty frames array' },
        { status: 400 }
      )
    }

    if (!specialty || !targetSegment || !videoMetadata) {
      return NextResponse.json(
        { error: 'Missing specialty, targetSegment, or videoMetadata' },
        { status: 400 }
      )
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

    // Analyze video with Creative Director
    const director = new CreativeDirector()
    const analysis: VideoAnalysis = await director.analyzeVideoFrames({
      frames,
      specialty,
      targetSegment,
      videoMetadata,
    })

    // Optionally save analysis to database
    if (profileId) {
      const supabase = createServiceSupabaseClient()
      await supabase.from('creative_analyses').insert({
        profile_id: profileId,
        user_id: user.id,
        video_metadata: videoMetadata,
        analysis_data: analysis,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (err: unknown) {
    console.error('Creative analyze error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
