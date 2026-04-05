import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { createTheralgoMetaClient } from '@/lib/meta-api'
import { CampaignMonitorSchema } from '@/lib/validations'
import { getAuthenticatedUser, verifyResourceOwnership, forbidden } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body
    const validation = CampaignMonitorSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { campaignId } = validation.data

    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceSupabaseClient()

    // Fetch campaigns to monitor
    let campaignsQuery = supabase
      .from('campaigns')
      .select('*')
      .in('status', ['active', 'paused'])
      .eq('user_id', user.id)

    if (campaignId) {
      campaignsQuery = campaignsQuery.eq('id', campaignId)
    }

    const { data: campaigns, error: campaignsError } = await campaignsQuery

    if (campaignsError || !campaigns?.length) {
      return NextResponse.json({
        success: true,
        campaigns_monitored: 0,
        metrics: [],
      })
    }

    const metricsResults: any[] = []

    for (const campaign of campaigns) {
      try {
        const metaIds = campaign.generated_content?.meta_ids

        // Skip campaigns without Meta IDs (legacy/mock)
        if (!metaIds?.campaign_id) {
          // Use fallback simulation for mock campaigns
          const { data: latestMetric } = await supabase
            .from('campaign_metrics')
            .select('*')
            .eq('campaign_id', campaign.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single()

          const prevImpressions = (latestMetric?.impressions as number) || 0
          const prevClicks = (latestMetric?.clicks as number) || 0
          const prevLeads = (latestMetric?.leads as number) || 0
          const prevSpend = (latestMetric?.spend as number) || 0

          // Simulate realistic increments for mock
          const newImpressions = prevImpressions + Math.floor(Math.random() * 200 + 50)
          const newClicks = prevClicks + Math.floor(Math.random() * 15 + 3)
          const newLeads = prevLeads + (Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0)
          const newSpend = parseFloat((prevSpend + Math.random() * 8 + 2).toFixed(2))
          const ctr = newImpressions > 0 ? parseFloat(((newClicks / newImpressions) * 100).toFixed(2)) : 0
          const cpl = newLeads > 0 ? parseFloat((newSpend / newLeads).toFixed(2)) : 0

          await supabase.from('campaign_metrics').insert({
            campaign_id: campaign.id,
            impressions: newImpressions,
            clicks: newClicks,
            leads: newLeads,
            appointments: Math.floor(newLeads * 0.3),
            ctr,
            cpl,
            spend: newSpend,
          })

          metricsResults.push({
            campaign_id: campaign.id,
            type: 'mock',
            impressions: newImpressions,
            clicks: newClicks,
            leads: newLeads,
            ctr,
            cpl,
            spend: newSpend,
          })

          continue
        }

        // Create Meta client with proper credentials
        const adAccountId = campaign.generated_content?.meta_ad_account_id || process.env.META_DEFAULT_AD_ACCOUNT_ID
        const pixelId = campaign.generated_content?.meta_pixel_id || process.env.META_DEFAULT_PIXEL_ID

        if (!adAccountId || !pixelId) {
          console.warn(`Missing Meta credentials for campaign ${campaign.id}`)
          continue
        }

        const metaClient = createTheralgoMetaClient(adAccountId, pixelId)

        // Fetch campaign insights from Meta
        try {
          const insightsResult = await metaClient.getCampaignInsights(metaIds.campaign_id, {
            fields: ['impressions', 'clicks', 'spend', 'actions', 'ctr', 'cpc', 'cost_per_action_type'],
            date_preset: 'lifetime',
          })

          const data = insightsResult.data?.[0] || {}

          // Extract metrics from Meta response
          const impressions = parseInt(String(data.impressions || 0), 10)
          const clicks = parseInt(String(data.clicks || 0), 10)
          const spend = parseFloat(String(data.spend || 0))
          const ctr = parseFloat(String(data.ctr || 0))

          // Parse actions to find leads
          const actionsArray = data.actions as Array<{ action_type: string; value: string }> || []
          const leadAction = actionsArray.find(a => a.action_type === 'lead')
          const leads = leadAction ? parseInt(leadAction.value, 10) : 0

          const cpl = leads > 0 ? parseFloat((spend / leads).toFixed(2)) : 0

          // Save metrics to Supabase
          await supabase.from('campaign_metrics').insert({
            campaign_id: campaign.id,
            impressions,
            clicks,
            leads,
            appointments: 0, // Would need additional data
            ctr,
            cpl,
            spend: parseFloat(spend.toFixed(2)),
          })

          // Get ad set insights to identify best performers
          let bestAdSet = { name: 'N/A', ctr: 0 }
          try {
            const adSetsResult = await metaClient.getCampaignAdSets(metaIds.campaign_id)
            const adSetsList = adSetsResult.data || []

            for (const adSet of adSetsList.slice(0, 5)) {
              const adSetInsights = await metaClient.getAdSetInsights(String(adSet.id), {
                fields: ['ctr', 'impressions'],
                date_preset: 'lifetime',
              })
              const adSetData = adSetInsights.data?.[0]
              const adSetCtr = parseFloat(String(adSetData?.ctr || 0))

              if (adSetCtr > bestAdSet.ctr) {
                bestAdSet = {
                  name: String(adSet.name || 'Ad Set'),
                  ctr: adSetCtr,
                }
              }
            }
          } catch (adSetErr) {
            console.warn('Failed to fetch ad set insights:', adSetErr)
          }

          metricsResults.push({
            campaign_id: campaign.id,
            type: 'real',
            impressions,
            clicks,
            leads,
            ctr,
            cpl,
            spend: parseFloat(spend.toFixed(2)),
            best_adset: bestAdSet.name,
          })
        } catch (insightsErr) {
          // Meta returns no data for new campaigns (0 impressions yet) - this is normal
          console.warn(`No insights available for campaign ${campaign.id} (may be too new):`, insightsErr)

          // Insert zero metrics for new campaigns
          await supabase.from('campaign_metrics').insert({
            campaign_id: campaign.id,
            impressions: 0,
            clicks: 0,
            leads: 0,
            appointments: 0,
            ctr: 0,
            cpl: 0,
            spend: 0,
          })

          metricsResults.push({
            campaign_id: campaign.id,
            type: 'real',
            status: 'new_campaign',
            message: 'Données non encore disponibles (attendre 24-48h)',
          })
        }
      } catch (campaignErr) {
        console.error(`Error monitoring campaign ${campaign.id}:`, campaignErr)
        // Continue with next campaign
      }
    }

    return NextResponse.json({
      success: true,
      campaigns_monitored: campaigns.length,
      metrics: metricsResults,
    })
  } catch (err) {
    console.error('Monitor error:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques: ' + ((err as Error).message || 'inconnue') },
      { status: 500 }
    )
  }
}
