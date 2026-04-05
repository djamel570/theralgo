import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { authApiLimiter } from '@/lib/rate-limit'
import { MICRO_EVENTS, type MicroEventType } from '@/lib/signal-accelerator'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

interface FunnelStage {
  stage: string
  count: number
  percentage: number
}

interface SignalAnalytics {
  campaignId: string
  totalSessions: number
  totalEvents: number
  funnel: FunnelStage[]
  averageSessionQuality: number
  signalMultiplier: number
  conversionRate: number
  conversionMetrics: {
    totalFiredEvents: number
    eventTypes: Record<string, number>
    eventValues: Record<string, number>
  }
  timeTrends: Array<{
    date: string
    eventCount: number
    sessionCount: number
  }>
}

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const { user } = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get campaignId from query params
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
    }

    // Apply rate limiting (admin endpoints)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'
    const rateLimit = await authApiLimiter.check(20, clientIp)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.reset) } }
      )
    }

    const supabase = createServiceSupabaseClient()

    // Verify campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Ownership check: verify campaign belongs to authenticated user
    if (campaign.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch all micro-events for this campaign
    const { data: events, error: eventsError } = await supabase
      .from('micro_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (eventsError) {
      console.error('Failed to fetch micro-events:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Get all leads for this campaign for comparison
    const { data: leads } = await supabase
      .from('leads')
      .select('id, created_at')
      .eq('campaign_id', campaignId)

    // Build funnel analysis
    const eventCounts = new Map<string, number>()
    const eventValues = new Map<string, number>()
    const sessionIds = new Set<string>()
    const dateEvents = new Map<string, number>()
    const dateSessions = new Map<string, Set<string>>()

    for (const event of events || []) {
      const type = event.event_type as MicroEventType
      const eventDef = MICRO_EVENTS[type]

      // Count events
      eventCounts.set(type, (eventCounts.get(type) || 0) + 1)
      eventValues.set(type, (eventValues.get(type) || 0) + (eventDef?.value || 0))

      // Track sessions
      sessionIds.add(event.session_id)

      // Track by date
      const date = new Date(event.created_at).toISOString().split('T')[0]
      dateEvents.set(date, (dateEvents.get(date) || 0) + 1)

      if (!dateSessions.has(date)) {
        dateSessions.set(date, new Set())
      }
      dateSessions.get(date)!.add(event.session_id)
    }

    // Build funnel stages (in order of funnel depth)
    const funnelOrder: MicroEventType[] = [
      'PAGE_VIEW',
      'SCROLL_25',
      'SCROLL_50',
      'CTA_CLICK',
      'FORM_START',
      'FORM_SUBMIT',
      'APPOINTMENT_BOOKED',
    ]

    const funnel: FunnelStage[] = []
    const totalSessions = sessionIds.size

    for (const eventType of funnelOrder) {
      const count = eventCounts.get(eventType) || 0
      const percentage = totalSessions > 0 ? (count / totalSessions) * 100 : 0

      funnel.push({
        stage: MICRO_EVENTS[eventType].label,
        count,
        percentage: parseFloat(percentage.toFixed(2)),
      })
    }

    // Calculate average session quality (based on events per session)
    const avgSessionQuality = totalSessions > 0
      ? parseFloat(((events?.length || 0) / totalSessions).toFixed(2))
      : 0

    // Calculate signal multiplier (traditional: 1 event per lead, Signal Accelerator: ~8 events)
    const leadCount = leads?.length || 0
    const signalMultiplier = leadCount > 0
      ? parseFloat(((events?.length || 0) / leadCount).toFixed(2))
      : 0

    // Conversion rate
    const conversionRate = totalSessions > 0 && leadCount > 0
      ? parseFloat(((leadCount / totalSessions) * 100).toFixed(2))
      : 0

    // Build time trends
    const timeTrends = Array.from(dateEvents.keys())
      .sort()
      .map(date => ({
        date,
        eventCount: dateEvents.get(date) || 0,
        sessionCount: dateSessions.get(date)?.size || 0,
      }))

    const analytics: SignalAnalytics = {
      campaignId,
      totalSessions,
      totalEvents: events?.length || 0,
      funnel,
      averageSessionQuality: avgSessionQuality,
      signalMultiplier: Math.max(1, signalMultiplier), // At least 1x
      conversionRate,
      conversionMetrics: {
        totalFiredEvents: events?.length || 0,
        eventTypes: Object.fromEntries(eventCounts),
        eventValues: Object.fromEntries(eventValues),
      },
      timeTrends,
    }

    return NextResponse.json(analytics)
  } catch (err) {
    console.error('Signal analytics error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
