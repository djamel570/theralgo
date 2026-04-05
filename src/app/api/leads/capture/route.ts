import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { createConversionsClient } from '@/lib/meta-conversions'
import { publicApiLimiter } from '@/lib/rate-limit'
import { LeadCaptureSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Extract client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'

    // Apply rate limiting
    const rateLimit = await publicApiLimiter.check(10, clientIp)
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter: rateLimit.reset,
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.reset) } }
      )
    }

    const body = await req.json()

    // Validate request body
    const validation = LeadCaptureSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { campaignId, name, email, phone, message } = validation.data

    const supabase = createServiceSupabaseClient()

    // Verify campaign exists and is active
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, user_id, status, generated_content')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
    }

    // Insert lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        campaign_id: campaignId,
        user_id: campaign.user_id,
        name,
        email,
        phone: phone || null,
        message: message || null,
        status: 'new',
      })
      .select()
      .single()

    if (error) throw error

    // Update campaign metrics - increment leads count
    const { data: latestMetric } = await supabase
      .from('campaign_metrics')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()

    if (latestMetric) {
      await supabase.from('campaign_metrics').insert({
        campaign_id: campaignId,
        impressions: latestMetric.impressions,
        clicks: latestMetric.clicks,
        leads: (latestMetric.leads || 0) + 1,
        appointments: latestMetric.appointments,
        ctr: latestMetric.ctr,
        cpl: latestMetric.spend > 0 ? parseFloat((latestMetric.spend / ((latestMetric.leads || 0) + 1)).toFixed(2)) : 0,
        spend: latestMetric.spend,
      })
    }

    // Send lead event to Meta Conversions API (non-blocking)
    const pixelId = campaign.generated_content?.meta_ids?.pixel_id || process.env.META_DEFAULT_PIXEL_ID

    if (pixelId && process.env.META_ACCESS_TOKEN) {
      try {
        const capiClient = createConversionsClient(pixelId)

        // Extract fbc and fbp from cookies if available
        const cookies = req.headers.get('cookie') || ''
        const fbcMatch = cookies.match(/_fbc=([^;]+)/)
        const fbpMatch = cookies.match(/_fbp=([^;]+)/)
        const fbc = fbcMatch ? fbcMatch[1] : undefined
        const fbp = fbpMatch ? fbpMatch[1] : undefined

        // Extract user's first and last name
        const nameParts = name.trim().split(/\s+/)
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(' ') || undefined

        await capiClient.sendLeadEvent({
          email,
          phone,
          firstName,
          city: undefined, // Could be extracted from profile if available
          sourceUrl: req.headers.get('referer') || undefined,
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
          fbc,
          fbp,
          eventId: lead.id,
          contentName: 'Contact Form Submission',
        })
      } catch (capiErr) {
        // Log but don't fail the lead capture
        console.warn('Meta CAPI event send failed (non-blocking):', capiErr)
      }
    }

    return NextResponse.json({ success: true, leadId: lead.id })
  } catch (err) {
    console.error('Lead capture error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
