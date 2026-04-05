/**
 * Meta Marketing API Service for Theralgo
 *
 * Handles: Campaign creation, Ad Set creation, Ad creation,
 * Creative upload, Insights retrieval, Campaign management
 *
 * API Reference: https://developers.facebook.com/docs/marketing-apis/
 */

import { withRetry, CircuitBreaker } from './resilience'

import { logger } from './logger'

// Types
export interface MetaConfig {
  accessToken: string
  adAccountId: string // format: act_XXXXXXXXX
  pixelId: string
  pageId: string // Facebook Page ID for ads
  appId?: string
  appSecret?: string
}

export interface CampaignParams {
  name: string
  objective: 'OUTCOME_LEADS' | 'OUTCOME_TRAFFIC' | 'OUTCOME_AWARENESS' | 'OUTCOME_ENGAGEMENT' | 'OUTCOME_SALES'
  status: 'PAUSED' | 'ACTIVE'
  special_ad_categories: string[] // ['NONE'] or ['HOUSING', 'CREDIT', 'EMPLOYMENT', etc.]
  daily_budget?: number // in cents
  lifetime_budget?: number // in cents
  buying_type?: 'AUCTION' | 'RESERVED'
}

export interface AdSetParams {
  name: string
  campaign_id: string
  optimization_goal: 'LEAD_GENERATION' | 'LANDING_PAGE_VIEWS' | 'LINK_CLICKS' | 'REACH' | 'IMPRESSIONS'
  billing_event: 'IMPRESSIONS' | 'LINK_CLICKS'
  daily_budget: number // in cents
  targeting: AdSetTargeting
  status: 'PAUSED' | 'ACTIVE'
  start_time?: string // ISO format
  end_time?: string
  promoted_object?: { pixel_id: string; custom_event_type?: string }
}

export interface AdSetTargeting {
  geo_locations: {
    cities?: { key: string; radius: number; distance_unit: 'kilometer' | 'mile' }[]
    countries?: string[]
    regions?: { key: string }[]
  }
  age_min?: number // 18-65
  age_max?: number
  genders?: number[] // [0]=all, [1]=male, [2]=female
  publisher_platforms?: ('facebook' | 'instagram' | 'audience_network')[]
  facebook_positions?: string[]
  instagram_positions?: string[]
  // Advantage+ audience (broad targeting) - let Meta's algorithm find the audience
  targeting_automation?: {
    advantage_audience: number // 1 = enabled
  }
}

export interface AdCreativeParams {
  name: string
  object_story_spec: {
    page_id: string
    video_data?: {
      video_id: string
      title: string
      message: string
      call_to_action: {
        type: 'LEARN_MORE' | 'BOOK_TRAVEL' | 'CONTACT_US' | 'GET_QUOTE' | 'SIGN_UP' | 'SUBSCRIBE' | 'APPLY_NOW'
        value: { link: string }
      }
    }
    link_data?: {
      link: string
      message: string
      name: string // headline
      description: string
      call_to_action: {
        type: string
        value: { link: string }
      }
      image_hash?: string
    }
  }
}

export interface AdParams {
  name: string
  adset_id: string
  creative: { creative_id: string }
  status: 'PAUSED' | 'ACTIVE'
  tracking_specs?: Array<{ action_type: string[]; fb_pixel: string[] }>
}

export interface InsightsParams {
  level?: 'campaign' | 'adset' | 'ad'
  fields: string[] // e.g. ['impressions', 'clicks', 'spend', 'actions', 'ctr', 'cpc', 'cpp']
  date_preset?: 'today' | 'yesterday' | 'last_7d' | 'last_14d' | 'last_30d' | 'lifetime'
  time_range?: { since: string; until: string }
  breakdowns?: string[]
}

export interface MetaApiError {
  error: {
    message: string
    type: string
    code: number
    error_subcode?: number
    fbtrace_id: string
  }
}

// Helper to build Graph API URL
function graphUrl(path: string, version = 'v21.0'): string {
  return `https://graph.facebook.com/${version}/${path}`
}

export class MetaMarketingAPI {
  private config: MetaConfig
  private apiLogger: typeof logger
  private circuitBreaker: CircuitBreaker

  constructor(config: MetaConfig) {
    this.config = config
    this.apiLogger = logger.child({ adAccountId: config.adAccountId, component: 'MetaMarketingAPI' })
    this.circuitBreaker = new CircuitBreaker({ failureThreshold: 5, timeout: 60000 })
  }

  // Generic request handler with retry and circuit breaker
  private async request<T>(url: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', body?: Record<string, unknown>): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      return withRetry(async () => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`,
        }

        // No longer add token to URL; use Authorization header instead
        const finalUrl = url

        const fetchBody = method === 'POST' ? JSON.stringify(body) : undefined

        try {
          const res = await fetch(finalUrl, { method, headers, body: fetchBody })
          const data = await res.json()

          if (!res.ok || data.error) {
            const error = data as MetaApiError
            this.apiLogger.error('Meta API request failed', new Error(`[${error.error?.code}]: ${error.error?.message || 'Unknown error'}`), {
              method,
              url: url.split('?')[0],
              statusCode: res.status,
            })
            throw new Error(`Meta API Error [${error.error?.code}]: ${error.error?.message || 'Unknown error'}`)
          }

          this.apiLogger.debug('Meta API request succeeded', { method, statusCode: res.status, url: url.split('?')[0] })
          return data as T
        } catch (err) {
          if (err instanceof Error && err.message.includes('Meta API Error')) {
            throw err
          }
          this.apiLogger.error('Meta API request error', err, { method, url: url.split('?')[0] })
          throw err
        }
      }, { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 })
    })
  }

  // ═══════════════════════════════════════════
  // CAMPAIGNS
  // ═══════════════════════════════════════════

  async createCampaign(params: CampaignParams): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      graphUrl(`${this.config.adAccountId}/campaigns`),
      'POST',
      {
        name: params.name,
        objective: params.objective,
        status: params.status,
        special_ad_categories: params.special_ad_categories,
        ...(params.daily_budget && { daily_budget: params.daily_budget }),
        ...(params.lifetime_budget && { lifetime_budget: params.lifetime_budget }),
        buying_type: params.buying_type || 'AUCTION',
      }
    )
  }

  async getCampaign(campaignId: string, fields: string[] = ['id', 'name', 'status', 'objective', 'daily_budget']): Promise<Record<string, unknown>> {
    return this.request(graphUrl(`${campaignId}?fields=${fields.join(',')}`))
  }

  async updateCampaign(campaignId: string, updates: Partial<CampaignParams>): Promise<{ success: boolean }> {
    return this.request(graphUrl(campaignId), 'POST', updates as Record<string, unknown>)
  }

  async pauseCampaign(campaignId: string): Promise<{ success: boolean }> {
    return this.updateCampaign(campaignId, { status: 'PAUSED' })
  }

  async activateCampaign(campaignId: string): Promise<{ success: boolean }> {
    return this.updateCampaign(campaignId, { status: 'ACTIVE' })
  }

  async deleteCampaign(campaignId: string): Promise<{ success: boolean }> {
    return this.request(graphUrl(campaignId), 'DELETE')
  }

  // ═══════════════════════════════════════════
  // AD SETS
  // ═══════════════════════════════════════════

  async createAdSet(params: AdSetParams): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      graphUrl(`${this.config.adAccountId}/adsets`),
      'POST',
      {
        name: params.name,
        campaign_id: params.campaign_id,
        optimization_goal: params.optimization_goal,
        billing_event: params.billing_event,
        daily_budget: params.daily_budget,
        targeting: params.targeting,
        status: params.status,
        ...(params.start_time && { start_time: params.start_time }),
        ...(params.end_time && { end_time: params.end_time }),
        ...(params.promoted_object && { promoted_object: params.promoted_object }),
      }
    )
  }

  async updateAdSet(adSetId: string, updates: Partial<AdSetParams>): Promise<{ success: boolean }> {
    return this.request(graphUrl(adSetId), 'POST', updates as Record<string, unknown>)
  }

  async pauseAdSet(adSetId: string): Promise<{ success: boolean }> {
    return this.updateAdSet(adSetId, { status: 'PAUSED' })
  }

  // ═══════════════════════════════════════════
  // AD CREATIVES
  // ═══════════════════════════════════════════

  async createAdCreative(params: AdCreativeParams): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      graphUrl(`${this.config.adAccountId}/adcreatives`),
      'POST',
      params as unknown as Record<string, unknown>
    )
  }

  // Upload video to ad account
  async uploadVideo(videoUrl: string, title: string): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      graphUrl(`${this.config.adAccountId}/advideos`),
      'POST',
      { file_url: videoUrl, title }
    )
  }

  // Upload image to ad account
  async uploadImage(imageUrl: string): Promise<{ images: Record<string, { hash: string }> }> {
    return this.request(
      graphUrl(`${this.config.adAccountId}/adimages`),
      'POST',
      { url: imageUrl }
    )
  }

  // ═══════════════════════════════════════════
  // ADS
  // ═══════════════════════════════════════════

  async createAd(params: AdParams): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      graphUrl(`${this.config.adAccountId}/ads`),
      'POST',
      {
        name: params.name,
        adset_id: params.adset_id,
        creative: params.creative,
        status: params.status,
        ...(params.tracking_specs && { tracking_specs: params.tracking_specs }),
      }
    )
  }

  async updateAd(adId: string, updates: Partial<AdParams>): Promise<{ success: boolean }> {
    return this.request(graphUrl(adId), 'POST', updates as Record<string, unknown>)
  }

  // ═══════════════════════════════════════════
  // INSIGHTS (Reporting)
  // ═══════════════════════════════════════════

  async getCampaignInsights(campaignId: string, params: InsightsParams): Promise<{ data: Record<string, unknown>[] }> {
    const queryParams = new URLSearchParams()
    queryParams.set('fields', params.fields.join(','))
    if (params.date_preset) queryParams.set('date_preset', params.date_preset)
    if (params.time_range) queryParams.set('time_range', JSON.stringify(params.time_range))
    if (params.breakdowns) queryParams.set('breakdowns', params.breakdowns.join(','))
    if (params.level) queryParams.set('level', params.level)

    return this.request(graphUrl(`${campaignId}/insights?${queryParams.toString()}`))
  }

  async getAdSetInsights(adSetId: string, params: InsightsParams): Promise<{ data: Record<string, unknown>[] }> {
    const queryParams = new URLSearchParams()
    queryParams.set('fields', params.fields.join(','))
    if (params.date_preset) queryParams.set('date_preset', params.date_preset)
    return this.request(graphUrl(`${adSetId}/insights?${queryParams.toString()}`))
  }

  async getAdInsights(adId: string, params: InsightsParams): Promise<{ data: Record<string, unknown>[] }> {
    const queryParams = new URLSearchParams()
    queryParams.set('fields', params.fields.join(','))
    if (params.date_preset) queryParams.set('date_preset', params.date_preset)
    return this.request(graphUrl(`${adId}/insights?${queryParams.toString()}`))
  }

  // Get all ad sets for a campaign with their insights
  async getCampaignAdSets(campaignId: string): Promise<{ data: Record<string, unknown>[] }> {
    return this.request(graphUrl(`${campaignId}/adsets?fields=id,name,status,daily_budget,optimization_goal,targeting`))
  }

  // ═══════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════

  // Check if the access token is valid
  async validateToken(): Promise<boolean> {
    try {
      await this.request(graphUrl('me'))
      return true
    } catch {
      return false
    }
  }

  // Get ad account info
  async getAdAccountInfo(): Promise<Record<string, unknown>> {
    return this.request(graphUrl(`${this.config.adAccountId}?fields=id,name,account_status,currency,timezone_name,balance`))
  }
}

// Factory function to create a MetaMarketingAPI instance from a therapist's config
export function createMetaClient(therapistMetaConfig: {
  access_token: string
  ad_account_id: string
  pixel_id: string
  page_id: string
}): MetaMarketingAPI {
  return new MetaMarketingAPI({
    accessToken: therapistMetaConfig.access_token,
    adAccountId: therapistMetaConfig.ad_account_id,
    pixelId: therapistMetaConfig.pixel_id,
    pageId: therapistMetaConfig.page_id,
  })
}

// Create a MetaMarketingAPI instance using Theralgo's own BM credentials
// Used when Theralgo manages the ad account on behalf of the therapist
export function createTheralgoMetaClient(adAccountId: string, pixelId: string): MetaMarketingAPI {
  if (!process.env.META_ACCESS_TOKEN) throw new Error('META_ACCESS_TOKEN not configured')
  if (!process.env.META_PAGE_ID) throw new Error('META_PAGE_ID not configured')

  return new MetaMarketingAPI({
    accessToken: process.env.META_ACCESS_TOKEN,
    adAccountId: adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`,
    pixelId,
    pageId: process.env.META_PAGE_ID,
  })
}
