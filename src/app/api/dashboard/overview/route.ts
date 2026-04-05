import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceSupabaseClient()

    // Fetch all necessary data in parallel
    const [
      campaignsRes,
      leadsRes,
      purchasesRes,
      metricsRes,
      eventsRes,
      campaignMetricsRes,
    ] = await Promise.all([
      supabase
        .from('campaigns')
        .select('id, status, budget, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('leads')
        .select('id, status, created_at')
        .eq('user_id', user.id),
      supabase
        .from('purchases')
        .select('id, amount, created_at')
        .eq('user_id', user.id),
      supabase
        .from('campaign_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('micro_events')
        .select('event_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('campaign_metrics')
        .select('lead_cost, spend, conversions')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
    ])

    const campaigns = campaignsRes.data || []
    const leads = leadsRes.data || []
    const purchases = purchasesRes.data || []
    const metrics = metricsRes.data || []
    const events = eventsRes.data || []
    const lastMetric = campaignMetricsRes.data

    // Calculate metrics
    const now = new Date()
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    // Patients acquired this month (leads that converted)
    const patientsThisMonth = leads.filter((l) => {
      const date = new Date(l.created_at)
      return date >= monthAgo && l.status === 'converted'
    }).length

    const patientsLastMonth = leads.filter((l) => {
      const date = new Date(l.created_at)
      return (
        date < monthAgo && date >= new Date(monthAgo.getFullYear(), monthAgo.getMonth() - 1, monthAgo.getDate())
      )
    }).length

    const patientsTrend =
      patientsLastMonth > 0 ? Math.round(((patientsThisMonth - patientsLastMonth) / patientsLastMonth) * 100) : 0

    // Leads waiting (not qualified/converted)
    const leadsWaiting = leads.filter((l) => l.status === 'new' || l.status === 'contacted').length
    const leadsStatus = [
      { status: 'Nouveaux', count: leads.filter((l) => l.status === 'new').length },
      { status: 'Contactés', count: leads.filter((l) => l.status === 'contacted').length },
    ]

    // Product revenue this month
    const productRevenueThisMonth = purchases
      .filter((p) => new Date(p.created_at) >= monthAgo)
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const productRevenueLastMonth = purchases
      .filter((p) => {
        const date = new Date(p.created_at)
        return date < monthAgo && date >= new Date(monthAgo.getFullYear(), monthAgo.getMonth() - 1, monthAgo.getDate())
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const revenueTrend =
      productRevenueLastMonth > 0
        ? Math.round(((productRevenueThisMonth - productRevenueLastMonth) / productRevenueLastMonth) * 100)
        : 0

    // Calculate ROI
    const totalSpend = metrics.reduce((sum, m) => sum + (m.spend || 0), 0)
    const totalRevenue = patientsThisMonth * 100 + productRevenueThisMonth // Estimate: €100 per patient consultation

    const roi = totalSpend > 0 ? totalRevenue / totalSpend : 0
    const roiTrend = lastMetric ? 15 : 0 // Placeholder

    // Campaign status
    const activeCampaign = campaigns.find((c) => c.status === 'active' || c.status === 'learning')
    const campaignStatus = (activeCampaign?.status as 'active' | 'paused' | 'learning') || 'paused'

    // Signal multiplier (based on event volume)
    const eventCount = events.length
    const signalMultiplier = Math.min(10, 1 + eventCount / 50) // Scale 1-10x

    // Best performing segment
    const segmentPerformance = new Map<string, number>()
    metrics.forEach((m) => {
      if (m.segment_name) {
        const current = segmentPerformance.get(m.segment_name) || 0
        segmentPerformance.set(m.segment_name, current + (m.conversions || 0))
      }
    })
    const bestSegment =
      Array.from(segmentPerformance.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Tous les segments'

    // Next optimization time (placeholder)
    const nextOptimization = 'Demain à 14h'

    // Flywheel health
    let flywheelHealth: 'positive' | 'neutral' | 'negative' = 'neutral'
    if (roi > 1.5) flywheelHealth = 'positive'
    if (roi < 0.8) flywheelHealth = 'negative'

    // Generate recommendations
    const recommendations = [
      {
        id: 'video-score',
        title: 'Vidéo score 45/100',
        description: 'Améliorez le hook dans les 3 premières secondes pour augmenter le CTR de +30%',
        cta: 'Améliorer la vidéo',
        href: '/dashboard/media',
        priority: 'high' as const,
      },
      leadsWaiting > 2 && {
        id: 'leads-follow',
        title: `${leadsWaiting} leads non contactés`,
        description: 'Ces leads ne vous ont pas été contactés depuis 48h. Appelez-les avant qu\'ils refroidissent.',
        cta: 'Voir les leads',
        href: '/dashboard/results',
        priority: 'high' as const,
      },
      {
        id: 'product-campaign',
        title: 'Lancer campagne produit',
        description: 'Votre programme audio est prêt mais n\'a pas encore de campagne de promotion.',
        cta: 'Créer une campagne',
        href: '/dashboard/admin/products',
        priority: 'medium' as const,
      },
    ].filter(Boolean) as Array<{
      id: string
      title: string
      description: string
      cta: string
      href: string
      priority: 'high' | 'medium' | 'low'
    }>

    return NextResponse.json({
      patientsAcquired: patientsThisMonth,
      patientsTrend,
      leadsWaiting,
      leadsStatus,
      productRevenue: Math.round(productRevenueThisMonth),
      revenueTrend,
      roi: Math.max(0, roi),
      roiTrend,
      campaignStatus,
      signalMultiplier: Math.round(signalMultiplier * 10) / 10,
      bestSegment,
      nextOptimization,
      flywheelHealth,
      recommendations,
    })
  } catch (error) {
    console.error('Error in dashboard overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
