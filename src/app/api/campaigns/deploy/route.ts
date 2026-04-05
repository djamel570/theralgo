import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { createTheralgoMetaClient } from '@/lib/meta-api'
import { CampaignDeploySchema } from '@/lib/validations'
import { getAuthenticatedUser, verifyResourceOwnership, forbidden } from '@/lib/auth-helpers'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
const deployLogger = logger.child({ component: 'campaigns/deploy' })

interface TargetingPlan {
  segments?: string[]
  creative_plan?: {
    hooks?: string[]
    cta?: string
  }
  campaign_structure?: Array<{
    name?: string
    daily_budget?: number
    hooks_to_test?: string[]
  }>
}

export async function POST(req: NextRequest) {
  const supabase = createServiceSupabaseClient()
  let metaCampaignId: string | null = null
  let metaAdSetIds: string[] = []
  let metaAdIds: string[] = []
  let cleanupRequired = false
  let requestBody: any = {}

  try {
    deployLogger.info('Starting campaign deployment')

    // Parse body once and store it
    requestBody = await req.json()

    // Validate request body
    const validation = CampaignDeploySchema.safeParse(requestBody)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { campaignId, targetingPlan, autoActivate } = validation.data

    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId manquant' }, { status: 400 })
    }

    // Verify user owns this campaign
    const { data: campaignCheck } = await supabase
      .from('campaigns')
      .select('user_id')
      .eq('id', campaignId)
      .single()

    if (!campaignCheck) {
      return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
    }

    if ((campaignCheck as any).user_id !== user.id) {
      return forbidden('You do not have permission to deploy this campaign')
    }

    // 1. Fetch the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
    }

    if (!campaign.generated_content) {
      return NextResponse.json({ error: 'Pas de contenu à déployer' }, { status: 400 })
    }

    // 2. Fetch the therapist profile
    const { data: therapistProfile, error: profileError } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('user_id', campaign.user_id)
      .single()

    if (profileError || !therapistProfile) {
      return NextResponse.json({ error: 'Profil thérapeute introuvable' }, { status: 404 })
    }

    // 3. Get Meta credentials (from therapist profile or env)
    const adAccountId = therapistProfile.meta_ad_account_id || process.env.META_DEFAULT_AD_ACCOUNT_ID || ''
    const pixelId = therapistProfile.meta_pixel_id || process.env.META_DEFAULT_PIXEL_ID || ''

    if (!adAccountId || !pixelId) {
      return NextResponse.json(
        { error: 'Configuration Meta insuffisante' },
        { status: 400 }
      )
    }

    // 4. Create Meta client
    const metaClient = createTheralgoMetaClient(adAccountId, pixelId)

    // 5. Fetch therapist's media (video)
    const { data: media } = await supabase
      .from('media_uploads')
      .select('*')
      .eq('user_id', campaign.user_id)
      .order('upload_date', { ascending: false })
      .limit(1)
      .single()

    let videoId: string | null = null
    if (media) {
      try {
        deployLogger.debug('Uploading video to Meta', { mediaId: media.id })
        const uploadResult = await metaClient.uploadVideo(
          media.file_url,
          `Video for ${therapistProfile.name || 'therapist'}`
        )
        videoId = uploadResult.id
        deployLogger.info('Video uploaded successfully', { videoId })
      } catch (uploadErr) {
        deployLogger.warn('Video upload failed, continuing without video', uploadErr)
        // Continue without video - can use image instead
      }
    }

    cleanupRequired = true

    // 6. Create Meta Campaign
    const campaignName = `Theralgo - ${therapistProfile.name || 'Campaign'} - ${new Date().toISOString().split('T')[0]}`
    const createCampaignResult = await metaClient.createCampaign({
      name: campaignName,
      objective: 'OUTCOME_LEADS',
      status: 'PAUSED', // Start paused for safety
      special_ad_categories: ['NONE'],
    })
    metaCampaignId = createCampaignResult.id

    // 7. Process each ad set from targeting plan
    const adSets = targetingPlan?.campaign_structure || []
    let totalAdCount = 0

    for (const adSet of adSets) {
      const dailyBudgetCents = Math.round((adSet.daily_budget || 10) * 100)

      // Build targeting based on therapist's location
      const targetingSpec = {
        geo_locations: {
          cities: therapistProfile.city
            ? [{ key: therapistProfile.city, radius: 15, distance_unit: 'kilometer' as const }]
            : undefined,
        },
        age_min: 25,
        age_max: 65,
        genders: [0], // All genders
        publisher_platforms: ['facebook', 'instagram'],
        targeting_automation: {
          advantage_audience: 1,
        },
      }

      // Create Ad Set
      const adSetName = adSet.name || `Ad Set - ${Date.now()}`
      const createAdSetResult = await metaClient.createAdSet({
        name: adSetName,
        campaign_id: metaCampaignId,
        optimization_goal: 'LEAD_GENERATION',
        billing_event: 'IMPRESSIONS',
        daily_budget: dailyBudgetCents,
        targeting: targetingSpec,
        status: 'PAUSED',
        promoted_object: {
          pixel_id: pixelId,
          custom_event_type: 'Lead',
        },
      })
      metaAdSetIds.push(createAdSetResult.id)

      // 8. Create Ads for each hook
      const hooks = adSet.hooks_to_test || ['Trouvez la thérapie qui vous convient']
      for (const hook of hooks) {
        let creativeId: string | null = null

        // Create Ad Creative
        const creativeName = `Creative - ${hook.slice(0, 30)} - ${Date.now()}`
        const creativeParams: any = {
          name: creativeName,
          object_story_spec: {
            page_id: process.env.META_PAGE_ID || '',
            call_to_action: {
              type: 'CONTACT_US',
              value: { link: therapistProfile.website || process.env.NEXT_PUBLIC_APP_URL || '' },
            },
          },
        }

        // Use video if available, otherwise use link_data
        if (videoId) {
          creativeParams.object_story_spec.video_data = {
            video_id: videoId,
            title: therapistProfile.specialty || 'Therapist Services',
            message: hook,
            call_to_action: {
              type: 'CONTACT_US',
              value: { link: therapistProfile.website || process.env.NEXT_PUBLIC_APP_URL || '' },
            },
          }
        } else {
          creativeParams.object_story_spec.link_data = {
            link: therapistProfile.website || process.env.NEXT_PUBLIC_APP_URL || '',
            message: hook,
            name: therapistProfile.specialty || 'Services',
            description: therapistProfile.bio || 'Contact us for more information',
            call_to_action: {
              type: 'CONTACT_US',
              value: { link: therapistProfile.website || process.env.NEXT_PUBLIC_APP_URL || '' },
            },
          }
        }

        try {
          deployLogger.debug('Creating ad creative', { hook: hook.slice(0, 30) })
          const createCreativeResult = await metaClient.createAdCreative(creativeParams)
          creativeId = createCreativeResult.id
          deployLogger.debug('Ad creative created', { creativeId })
        } catch (creativeErr) {
          deployLogger.error('Creative creation failed', creativeErr, { hook: hook.slice(0, 30) })
          continue
        }

        if (creativeId) {
          // Create Ad
          const adName = `Ad - ${hook.slice(0, 20)} - ${Date.now()}`
          try {
            deployLogger.debug('Creating ad', { adName })
            const createAdResult = await metaClient.createAd({
              name: adName,
              adset_id: createAdSetResult.id,
              creative: { creative_id: creativeId },
              status: 'PAUSED',
            })
            metaAdIds.push(createAdResult.id)
            totalAdCount++
            deployLogger.debug('Ad created', { adId: createAdResult.id })
          } catch (adErr) {
            deployLogger.error('Ad creation failed', adErr, { adName })
          }
        }
      }
    }

    // 9. Save Meta IDs to campaign
    const metaIds = {
      campaign_id: metaCampaignId,
      adset_ids: metaAdSetIds,
      ad_ids: metaAdIds,
      video_id: videoId,
      created_at: new Date().toISOString(),
    }

    const updatedContent = {
      ...(campaign.generated_content || {}),
      meta_ids: metaIds,
    }

    await supabase
      .from('campaigns')
      .update({
        generated_content: updatedContent,
        status: autoActivate ? 'active' : 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    // 10. Optionally activate campaign
    if (autoActivate) {
      try {
        deployLogger.info('Activating campaign', { campaignId: metaCampaignId })
        await metaClient.activateCampaign(metaCampaignId)
        deployLogger.info('Campaign activated successfully')
      } catch (activateErr) {
        deployLogger.error('Campaign activation failed', activateErr)
        // Don't fail the whole response, campaign is still created
      }
    }

    deployLogger.info('Deployment completed successfully', {
      metaCampaignId,
      adSetsCount: metaAdSetIds.length,
      adsCount: totalAdCount,
    })

    return NextResponse.json({
      success: true,
      meta_campaign_id: metaCampaignId,
      meta_adset_ids: metaAdSetIds,
      meta_ad_count: totalAdCount,
      status: autoActivate ? 'active' : 'paused',
    })
  } catch (err) {
    deployLogger.error('Deployment failed', err)

    // Attempt cleanup if things went wrong
    if (cleanupRequired && metaCampaignId) {
      try {
        deployLogger.info('Attempting cleanup of campaign', { metaCampaignId })
        const metaClient = createTheralgoMetaClient(
          process.env.META_DEFAULT_AD_ACCOUNT_ID || '',
          process.env.META_DEFAULT_PIXEL_ID || ''
        )
        await metaClient.deleteCampaign(metaCampaignId)
        deployLogger.info('Campaign cleanup completed')
      } catch (cleanupErr) {
        deployLogger.error('Cleanup failed', cleanupErr)
      }
    }

    // Save error to campaign
    try {
      await supabase
        .from('campaigns')
        .update({
          status: 'failed',
          generated_content: {
            error: (err as Error).message || 'Erreur inconnue',
            timestamp: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestBody.campaignId)
      deployLogger.info('Error state saved to campaign')
    } catch (saveErr) {
      deployLogger.error('Failed to save error state', saveErr)
    }

    return NextResponse.json(
      { error: 'Erreur lors du déploiement: ' + ((err as Error).message || 'inconnue') },
      { status: 500 }
    )
  }
}
