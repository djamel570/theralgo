import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { createTheralgoMetaClient } from '@/lib/meta-api'
import { OptimizationAgent } from '@/lib/optimization-agent'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const OptimizeSchema = z.object({
  campaignId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    // Validate request body
    const validation = OptimizeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = validation.data

    const supabase = createServiceSupabaseClient()

    // Fetch active campaigns (or a specific one) - only user's own campaigns
    let query = supabase
      .from('campaigns')
      .select('*, therapist_profiles(name, specialty, city, meta_config)')
      .eq('status', 'active')
      .eq('user_id', user.id)

    if (campaignId) query = query.eq('id', campaignId)

    const { data: campaigns, error } = await query
    if (error) throw error
    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ success: true, message: 'Aucune campagne active à optimiser', decisions: [] })
    }

    const allDecisions: Array<{ campaign_id: string; therapist: string; decisions: unknown[] }> = []

    for (const campaign of campaigns) {
      const metaIds = (campaign.generated_content as Record<string, unknown>)?.meta_ids as Record<string, unknown> | undefined
      if (!metaIds?.campaign_id) continue // Skip campaigns without real Meta IDs

      const profile = campaign.therapist_profiles as Record<string, unknown> | undefined
      const metaConfig = profile?.meta_config as Record<string, unknown> | undefined

      const adAccountId = (metaConfig?.ad_account_id as string) || process.env.META_DEFAULT_AD_ACCOUNT_ID || ''
      const pixelId = (metaConfig?.pixel_id as string) || process.env.META_DEFAULT_PIXEL_ID || ''

      if (!adAccountId || !pixelId) continue

      const metaClient = createTheralgoMetaClient(adAccountId, pixelId)
      const agent = new OptimizationAgent(metaClient)

      const decisions = await agent.analyzeCampaign(
        metaIds.campaign_id as string,
        campaign.created_at as string
      )

      // Save decisions to Supabase
      await supabase.from('agent_decisions').insert({
        campaign_id: campaign.id,
        decisions,
        created_at: new Date().toISOString(),
      }).catch(() => {}) // Non-critical

      // If campaign was paused by agent, update our DB too
      const campaignPaused = decisions.some(d => d.type === 'pause_campaign' && d.action_taken)
      if (campaignPaused) {
        await supabase
          .from('campaigns')
          .update({ status: 'paused', updated_at: new Date().toISOString() })
          .eq('id', campaign.id)
      }

      // Update metrics from the analysis
      const latestMetrics = decisions.reduce((acc, d) => {
        if (d.metrics.impressions) acc.impressions += d.metrics.impressions
        if (d.metrics.clicks) acc.clicks += d.metrics.clicks
        if (d.metrics.spend) acc.spend += d.metrics.spend
        if (d.metrics.leads) acc.leads += d.metrics.leads
        return acc
      }, { impressions: 0, clicks: 0, spend: 0, leads: 0 })

      if (latestMetrics.impressions > 0) {
        await supabase.from('campaign_metrics').insert({
          campaign_id: campaign.id,
          impressions: latestMetrics.impressions,
          clicks: latestMetrics.clicks,
          leads: latestMetrics.leads,
          spend: latestMetrics.spend,
          ctr: latestMetrics.clicks > 0 ? parseFloat(((latestMetrics.clicks / latestMetrics.impressions) * 100).toFixed(2)) : 0,
          cpl: latestMetrics.leads > 0 ? parseFloat((latestMetrics.spend / latestMetrics.leads).toFixed(2)) : 0,
          recorded_at: new Date().toISOString(),
        }).catch(() => {})
      }

      allDecisions.push({
        campaign_id: campaign.id,
        therapist: (profile?.name as string) || 'Unknown',
        decisions,
      })
    }

    return NextResponse.json({
      success: true,
      campaigns_analyzed: allDecisions.length,
      total_decisions: allDecisions.reduce((acc, c) => acc + c.decisions.length, 0),
      results: allDecisions,
    })

  } catch (err) {
    console.error('[agent/optimize]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
