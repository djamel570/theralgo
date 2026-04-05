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
    const { profileId, baseScript, numberOfVariants, varyElement } = body

    // Validate required fields
    if (!baseScript || typeof numberOfVariants !== 'number' || numberOfVariants < 2 || numberOfVariants > 3) {
      return NextResponse.json(
        { error: 'Missing baseScript or invalid numberOfVariants (must be 2-3)' },
        { status: 400 }
      )
    }

    if (!['hook', 'cta', 'emotional_arc', 'all'].includes(varyElement)) {
      return NextResponse.json(
        { error: 'varyElement must be one of: hook, cta, emotional_arc, all' },
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

    // Generate variants with Creative Director
    const director = new CreativeDirector()
    const variants: VideoScript[] = await director.generateScriptVariants({
      baseScript,
      numberOfVariants,
      varyElement: varyElement as 'hook' | 'cta' | 'emotional_arc' | 'all',
    })

    // Optionally save variants to database
    if (profileId) {
      const supabase = createServiceSupabaseClient()
      await supabase.from('script_variants').insert({
        profile_id: profileId,
        user_id: user.id,
        base_script_title: baseScript.title,
        vary_element: varyElement,
        variants_data: variants,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      variants,
    })
  } catch (err: unknown) {
    console.error('Creative variants error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
