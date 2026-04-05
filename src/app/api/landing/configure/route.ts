import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { LandingConfigureSchema } from '@/lib/validations'
import { getAuthenticatedUser, verifyResourceOwnership, forbidden } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

interface LandingConfig {
  show_video?: boolean
  show_testimonials?: boolean
  custom_colors?: {
    primary?: string
    accent?: string
  }
  cta_text?: string
  faq_items?: Array<{
    question: string
    answer: string
  }>
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body
    const validation = LandingConfigureSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { profileId, config } = validation.data

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

    const supabase = createServiceSupabaseClient()

    // Fetch current profile to merge configs
    const { data: profileData, error: fetchError } = await supabase
      .from('therapist_profiles')
      .select('landing_config')
      .eq('id', profileId)
      .single()

    if (fetchError) {
      console.error('Error fetching profile:', fetchError)
      return NextResponse.json(
        { error: 'Profil introuvable' },
        { status: 404 }
      )
    }

    // Merge with existing config
    const currentConfig = (profileData?.landing_config as LandingConfig) || {}
    const mergedConfig = {
      ...currentConfig,
      ...config,
    }

    // Update landing config
    const { error: updateError } = await supabase
      .from('therapist_profiles')
      .update({ landing_config: mergedConfig })
      .eq('id', profileId)

    if (updateError) {
      console.error('Error updating landing config:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      config: mergedConfig,
    })
  } catch (err) {
    console.error('Configure landing error:', err)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
