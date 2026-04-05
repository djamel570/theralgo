import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { TargetingDiagnosticSchema } from '@/lib/validations'
import { getAuthenticatedUser, verifyResourceOwnership, forbidden } from '@/lib/auth-helpers'

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

interface Gap {
  item: string
  priority: 'high' | 'medium' | 'low'
  recommendation: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body (using a simpler validation since body structure differs from schema)
    if (!body.profileId || !body.therapistData) {
      return NextResponse.json(
        { error: 'Missing profileId or therapistData' },
        { status: 400 }
      )
    }

    const { profileId, therapistData } = body
    const diagnosticData = therapistData as DiagnosticData

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

    // Calculate signal score
    let signal_score = 0

    if (diagnosticData.has_pixel) signal_score += 20
    if (diagnosticData.has_capi) signal_score += 25
    if (diagnosticData.has_landing_page) signal_score += 15
    if (['website_form', 'calendly', 'doctolib'].includes(diagnosticData.form_type)) signal_score += 10
    if (diagnosticData.has_crm) signal_score += 10

    // Check for key events (max 20 points)
    const keyEvents = ['Lead', 'Purchase', 'CompleteRegistration']
    const matchingEvents = diagnosticData.existing_events.filter(e => keyEvents.includes(e))
    signal_score += Math.min(matchingEvents.length * 10, 20)

    // Cap score at 100
    signal_score = Math.min(signal_score, 100)

    // Determine maturity level
    let maturity_level: 'debutant' | 'intermediaire' | 'avance'
    if (signal_score < 30) maturity_level = 'debutant'
    else if (signal_score <= 60) maturity_level = 'intermediaire'
    else maturity_level = 'avance'

    // Generate gaps array
    const gaps: Gap[] = []

    if (!diagnosticData.has_pixel) {
      gaps.push({
        item: 'Pixel Meta',
        priority: 'high',
        recommendation: 'Installez le pixel Meta sur votre site pour suivre les visiteurs et les conversions.',
      })
    }

    if (!diagnosticData.has_capi) {
      gaps.push({
        item: 'Conversion API (CAPI)',
        priority: 'high',
        recommendation: 'Configurez la Conversion API pour suivre les événements côté serveur avec plus de précision.',
      })
    }

    if (!diagnosticData.has_landing_page) {
      gaps.push({
        item: 'Landing page dédiée',
        priority: 'high',
        recommendation: 'Créez une landing page optimisée pour vos campagnes publicitaires.',
      })
    }

    if (!['website_form', 'calendly', 'doctolib'].includes(diagnosticData.form_type)) {
      gaps.push({
        item: 'Formulaire de capture',
        priority: 'medium',
        recommendation: 'Utilisez un formulaire de capture efficace (formulaire site, Calendly ou Doctolib) pour les conversions.',
      })
    }

    if (!diagnosticData.has_crm) {
      gaps.push({
        item: 'CRM',
        priority: 'medium',
        recommendation: 'Intégrez un CRM pour gérer et automatiser le suivi de vos leads.',
      })
    }

    if (diagnosticData.existing_events.length === 0) {
      gaps.push({
        item: 'Événements de conversion',
        priority: 'high',
        recommendation: 'Définissez des événements de conversion clés (Lead, Appel, Rendez-vous).',
      })
    }

    if (diagnosticData.monthly_budget < 300) {
      gaps.push({
        item: 'Budget publicitaire',
        priority: 'medium',
        recommendation: 'Augmentez votre budget à minimum 300€/mois pour obtenir des résultats significatifs.',
      })
    }

    // Save to Supabase
    const supabase = createServiceSupabaseClient()

    const { error: dbError } = await supabase.from('targeting_diagnostics').insert({
      profile_id: profileId,
      user_id: user.id,
      diagnostic_data: diagnosticData,
      signal_score,
      maturity_level,
      gaps,
      created_at: new Date().toISOString(),
    })

    if (dbError) throw dbError

    return NextResponse.json({
      success: true,
      diagnostic: {
        signal_score,
        maturity_level,
        gaps,
        recommendations: gaps.map(g => g.recommendation),
      },
    })
  } catch (err: unknown) {
    console.error('Diagnostic error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
