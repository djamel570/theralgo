/**
 * Referral Engine pour Theralgo
 *
 * Digitalise le bouche-à-oreille: Les patients reçoivent un lien unique après une session ou achat,
 * le partagent avec des amis/famille via WhatsApp/email/SMS, et le système suit chaque clic,
 * conversion et récompense.
 */

import { createClient } from '@/lib/supabase'
import { createServiceSupabaseClient } from './supabase-server'
import { logger } from './logger'
import { emailService } from './email-service'

// ============================================================================
// TYPES
// ============================================================================

export interface ReferralLink {
  id: string
  therapistId: string
  referrerName: string
  referrerEmail?: string
  referrerPhone?: string
  code: string
  slug: string
  linkType: 'booking' | 'product' | 'both'
  productId?: string
  referrerMessage?: string
  therapistMessage?: string
  rewardType: 'discount' | 'free_session' | 'free_product' | 'credit' | 'none'
  rewardValue: number
  rewardUnit: 'euro' | 'percent'
  totalClicks: number
  totalBookings: number
  totalProductSales: number
  totalRevenueGenerated: number
  isActive: boolean
  expiresAt?: string
  createdAt: string
  shareUrl: string
  whatsappShareUrl: string
  emailShareUrl: string
}

export interface ReferralClick {
  id: string
  referralLinkId: string
  therapistId: string
  source: 'whatsapp' | 'email' | 'sms' | 'facebook' | 'instagram' | 'twitter' | 'copy' | 'qr_code' | 'other'
  ipHash?: string
  converted: boolean
  conversionType?: 'booking' | 'product_purchase' | 'lead_capture'
  conversionValue?: number
  convertedAt?: string
  createdAt: string
}

export interface ReferralReward {
  id: string
  referralLinkId: string
  therapistId: string
  clickId?: string
  referrerName: string
  rewardType: 'discount' | 'free_session' | 'free_product' | 'credit' | 'none'
  rewardValue: number
  rewardUnit: 'euro' | 'percent'
  rewardDescription: string
  status: 'pending' | 'sent' | 'claimed' | 'expired'
  deliveryMethod?: 'email' | 'sms' | 'whatsapp' | 'code'
  deliveryCode?: string
  createdAt: string
  expiresAt?: string
}

export interface ReferralCampaign {
  id: string
  therapistId: string
  name: string
  triggerType: 'post_booking' | 'post_session' | 'post_purchase' | 'milestone' | 'manual' | 'scheduled'
  triggerDelayHours: number
  triggerConditions?: Record<string, unknown>
  shareMessageTemplate: string
  whatsappMessage: string
  emailSubject: string
  emailBody: string
  smsMessage: string
  linkType: 'booking' | 'product' | 'both'
  productId?: string
  rewardType: 'discount' | 'free_session' | 'free_product' | 'credit' | 'none'
  rewardValue: number
  rewardUnit: 'euro' | 'percent'
  totalSent: number
  totalConversions: number
  conversionRate: number
  isActive: boolean
  createdAt: string
}

export interface ReferralStats {
  totalLinks: number
  totalClicks: number
  totalConversions: number
  conversionRate: number
  totalRevenueGenerated: number
  topReferrers: Array<{ name: string; conversions: number; revenue: number }>
  rewardsPending: number
  rewardsSent: number
  activeLinks: number
}

export interface SharePayload {
  channel: 'whatsapp' | 'email' | 'sms' | 'copy'
  referrerName: string
  recipientContact?: string
  customMessage?: string
}

// ============================================================================
// TEMPLATES
// ============================================================================

const SHARE_TEMPLATES = {
  whatsapp: {
    body: `Salut ! Mon thérapeute m'aide vraiment beaucoup. Je te partage son lien si jamais tu en as besoin 🙏\n\n{url}`,
  },
  email: {
    subject: `Je te recommande mon thérapeute - {therapist_name}`,
    body: `Bonjour,

Je te recommande vivement mon thérapeute, {therapist_name}. {therapist_message}

Je partage mon lien de parrainage pour que tu puisses le/la découvrir et en bénéficier :
{url}

À bientôt !
{referrer_name}`,
  },
  sms: {
    body: `Hey ! Je te recommande mon psy : {url} C'est vraiment aidant 👍`,
  },
}

const REWARD_TEMPLATES = {
  discount: `Réduction appliquée automatiquement à votre prochaine séance`,
  free_session: `Vous débloquez 1 séance gratuite après 3 recommandations`,
  free_product: `Accès gratuit à {product_title}`,
  credit: `Crédit disponible sur votre compte`,
  none: `Merci de votre soutien !`,
}

// ============================================================================
// REFERRAL ENGINE CLASS
// ============================================================================

class ReferralEngine {
  private logger: typeof logger
  private appUrl: string

  constructor() {
    this.logger = logger.child({ component: 'ReferralEngine' })
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theralgo.com'
  }

  // ========================================================================
  // 1. CREATE REFERRAL LINK
  // ========================================================================

  async createReferralLink(
    therapistId: string,
    options: {
      referrerName: string
      referrerEmail?: string
      referrerPhone?: string
      linkType: 'booking' | 'product' | 'both'
      productId?: string
      rewardType?: 'discount' | 'free_session' | 'free_product' | 'credit' | 'none'
      rewardValue?: number
      rewardUnit?: 'euro' | 'percent'
      customMessage?: string
    }
  ): Promise<ReferralLink> {
    try {
      const supabase = createServiceSupabaseClient()

      // Generate unique code: therapist-slug + 6 random chars
      const { data: therapist } = await supabase
        .from('therapists')
        .select('slug')
        .eq('id', therapistId)
        .single()

      const code = this.generateCode(therapist?.slug || 'ref')
      const slug = code.toLowerCase()

      const shareUrl = `${this.appUrl}/r/${slug}`
      const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
        SHARE_TEMPLATES.whatsapp.body.replace('{url}', shareUrl)
      )}`
      const emailShareUrl = `mailto:?subject=${encodeURIComponent(
        SHARE_TEMPLATES.email.subject.replace('{therapist_name}', therapist?.name || 'mon thérapeute')
      )}&body=${encodeURIComponent(
        SHARE_TEMPLATES.email.body
          .replace('{therapist_name}', therapist?.name || 'mon thérapeute')
          .replace('{therapist_message}', '')
          .replace('{url}', shareUrl)
          .replace('{referrer_name}', options.referrerName)
      )}`

      const link: any = {
        therapist_id: therapistId,
        referrer_name: options.referrerName,
        referrer_email: options.referrerEmail,
        referrer_phone: options.referrerPhone,
        code,
        slug,
        link_type: options.linkType,
        product_id: options.productId,
        referrer_message: options.customMessage,
        reward_type: options.rewardType || 'none',
        reward_value: options.rewardValue || 0,
        reward_unit: options.rewardUnit || 'euro',
        total_clicks: 0,
        total_bookings: 0,
        total_product_sales: 0,
        total_revenue_generated: 0,
        is_active: true,
      }

      const { data, error } = await supabase.from('referral_links').insert(link).select().single()

      if (error) {
        this.logger.error('Erreur création lien de parrainage', { error, therapistId })
        throw error
      }

      this.logger.info('Lien de parrainage créé', { linkId: data.id, therapistId })

      return this.mapReferralLink(data, shareUrl, whatsappShareUrl, emailShareUrl)
    } catch (error) {
      this.logger.error('Erreur dans createReferralLink', { error, therapistId })
      throw error
    }
  }

  // ========================================================================
  // 2. TRACK CLICK
  // ========================================================================

  async trackClick(
    slug: string,
    source: string = 'other',
    ipHash?: string,
    userAgent?: string
  ): Promise<{
    referralLink: ReferralLink
    therapistSlug: string
    redirectTo: string
  }> {
    try {
      const supabase = createServiceSupabaseClient()

      // Get referral link
      const { data: linkData, error: linkError } = await supabase
        .from('referral_links')
        .select('*')
        .eq('slug', slug)
        .single()

      if (linkError || !linkData) {
        this.logger.warn('Lien de parrainage non trouvé', { slug })
        throw new Error('Referral link not found')
      }

      // Get therapist slug
      const { data: therapist } = await supabase
        .from('therapists')
        .select('slug')
        .eq('id', linkData.therapist_id)
        .single()

      // Record click
      await supabase.from('referral_clicks').insert({
        referral_link_id: linkData.id,
        therapist_id: linkData.therapist_id,
        source,
        ip_hash: ipHash,
        converted: false,
      })

      // Increment total_clicks
      await supabase
        .from('referral_links')
        .update({ total_clicks: linkData.total_clicks + 1 })
        .eq('id', linkData.id)

      // Determine redirect destination
      let redirectTo = `${this.appUrl}/${therapist?.slug || 'therapists'}`
      if (linkData.link_type === 'product' && linkData.product_id) {
        redirectTo = `${this.appUrl}/products/${linkData.product_id}`
      } else if (linkData.link_type === 'both') {
        redirectTo = `${this.appUrl}/${therapist?.slug || 'therapists'}?tab=bookings`
      }

      this.logger.info('Clic enregistré', { linkId: linkData.id, source })

      const shareUrl = `${this.appUrl}/r/${slug}`
      const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
        SHARE_TEMPLATES.whatsapp.body.replace('{url}', shareUrl)
      )}`
      const emailShareUrl = `mailto:?subject=Recommandation`

      return {
        referralLink: this.mapReferralLink(linkData, shareUrl, whatsappShareUrl, emailShareUrl),
        therapistSlug: therapist?.slug || 'therapists',
        redirectTo,
      }
    } catch (error) {
      this.logger.error('Erreur dans trackClick', { error, slug })
      throw error
    }
  }

  // ========================================================================
  // 3. RECORD CONVERSION
  // ========================================================================

  async recordConversion(
    referralLinkId: string,
    conversionType: 'booking' | 'product_purchase' | 'lead_capture',
    conversionId: string,
    conversionValue: number
  ): Promise<void> {
    try {
      const supabase = createServiceSupabaseClient()

      // Get the referral link
      const { data: linkData } = await supabase
        .from('referral_links')
        .select('*')
        .eq('id', referralLinkId)
        .single()

      if (!linkData) {
        this.logger.warn('Lien de parrainage non trouvé pour conversion', { referralLinkId })
        return
      }

      // Update click record
      const { data: clicks } = await supabase
        .from('referral_clicks')
        .select('id')
        .eq('referral_link_id', referralLinkId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (clicks && clicks.length > 0) {
        await supabase
          .from('referral_clicks')
          .update({
            converted: true,
            conversion_type: conversionType,
            conversion_value: conversionValue,
            converted_at: new Date().toISOString(),
          })
          .eq('id', clicks[0].id)
      }

      // Update referral link counters
      const updates: any = {
        total_revenue_generated: linkData.total_revenue_generated + conversionValue,
      }

      if (conversionType === 'booking') {
        updates.total_bookings = linkData.total_bookings + 1
      } else if (conversionType === 'product_purchase') {
        updates.total_product_sales = linkData.total_product_sales + 1
      }

      await supabase.from('referral_links').update(updates).eq('id', referralLinkId)

      // Create reward if applicable
      if (linkData.reward_type !== 'none') {
        await this.createReward(referralLinkId, clicks?.[0]?.id)
      }

      // Notify therapist
      await this.notifyTherapistOfConversion(linkData.therapist_id, linkData.referrer_name, conversionValue)

      this.logger.info('Conversion enregistrée', {
        linkId: referralLinkId,
        type: conversionType,
        value: conversionValue,
      })
    } catch (error) {
      this.logger.error('Erreur dans recordConversion', { error, referralLinkId })
      throw error
    }
  }

  // ========================================================================
  // 4. CREATE REWARD
  // ========================================================================

  async createReward(referralLinkId: string, clickId?: string): Promise<ReferralReward> {
    try {
      const supabase = createServiceSupabaseClient()

      const { data: linkData } = await supabase
        .from('referral_links')
        .select('*')
        .eq('id', referralLinkId)
        .single()

      if (!linkData) {
        throw new Error('Referral link not found')
      }

      const deliveryCode = linkData.reward_type !== 'none' ? this.generateCode('RWD') : undefined

      const reward: any = {
        referral_link_id: referralLinkId,
        therapist_id: linkData.therapist_id,
        click_id: clickId,
        referrer_name: linkData.referrer_name,
        reward_type: linkData.reward_type,
        reward_value: linkData.reward_value,
        reward_unit: linkData.reward_unit,
        reward_description: this.getRewardDescription(
          linkData.reward_type,
          linkData.reward_value,
          linkData.product_id
        ),
        status: 'pending',
        delivery_method: this.getDeliveryMethod(linkData),
        delivery_code: deliveryCode,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      }

      const { data, error } = await supabase.from('referral_rewards').insert(reward).select().single()

      if (error) {
        this.logger.error('Erreur création récompense', { error })
        throw error
      }

      this.logger.info('Récompense créée', { rewardId: data.id, type: linkData.reward_type })

      return data as ReferralReward
    } catch (error) {
      this.logger.error('Erreur dans createReward', { error, referralLinkId })
      throw error
    }
  }

  // ========================================================================
  // 5. CREATE CAMPAIGN
  // ========================================================================

  async createCampaign(therapistId: string, campaign: Partial<ReferralCampaign>): Promise<ReferralCampaign> {
    try {
      const supabase = createServiceSupabaseClient()

      const campaignData: any = {
        therapist_id: therapistId,
        name: campaign.name || 'Campagne sans titre',
        trigger_type: campaign.triggerType || 'manual',
        trigger_delay_hours: campaign.triggerDelayHours || 0,
        trigger_conditions: campaign.triggerConditions || {},
        share_message_template: campaign.shareMessageTemplate || 'Découvrez mon thérapeute !',
        whatsapp_message:
          campaign.whatsappMessage || SHARE_TEMPLATES.whatsapp.body.replace('{url}', '{link}'),
        email_subject:
          campaign.emailSubject ||
          SHARE_TEMPLATES.email.subject.replace('{therapist_name}', '{therapist_name}'),
        email_body: campaign.emailBody || SHARE_TEMPLATES.email.body,
        sms_message: campaign.smsMessage || SHARE_TEMPLATES.sms.body,
        link_type: campaign.linkType || 'booking',
        product_id: campaign.productId,
        reward_type: campaign.rewardType || 'none',
        reward_value: campaign.rewardValue || 0,
        reward_unit: campaign.rewardUnit || 'euro',
        total_sent: 0,
        total_conversions: 0,
        conversion_rate: 0,
        is_active: true,
      }

      const { data, error } = await supabase
        .from('referral_campaigns')
        .insert(campaignData)
        .select()
        .single()

      if (error) {
        this.logger.error('Erreur création campagne', { error })
        throw error
      }

      this.logger.info('Campagne créée', { campaignId: data.id, therapistId })

      return data as ReferralCampaign
    } catch (error) {
      this.logger.error('Erreur dans createCampaign', { error, therapistId })
      throw error
    }
  }

  // ========================================================================
  // 6. TRIGGER CAMPAIGN
  // ========================================================================

  async triggerCampaign(campaignId: string, patientData: { name: string; email?: string; phone?: string }): Promise<ReferralLink> {
    try {
      const supabase = createServiceSupabaseClient()

      const { data: campaign } = await supabase
        .from('referral_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (!campaign) {
        throw new Error('Campaign not found')
      }

      // Create referral link for patient
      const link = await this.createReferralLink(campaign.therapist_id, {
        referrerName: patientData.name,
        referrerEmail: patientData.email,
        referrerPhone: patientData.phone,
        linkType: campaign.link_type,
        productId: campaign.product_id,
        rewardType: campaign.reward_type,
        rewardValue: campaign.reward_value,
        rewardUnit: campaign.reward_unit,
      })

      // Send via configured channel based on campaign trigger
      if (campaign.trigger_type === 'post_booking' || campaign.trigger_type === 'post_session') {
        if (patientData.email) {
          await this.sendViaEmail(link, patientData.email, campaign)
        } else if (patientData.phone) {
          await this.sendViaSMS(link, patientData.phone, campaign)
        }
      } else if (campaign.trigger_type === 'post_purchase') {
        if (patientData.email) {
          await this.sendViaEmail(link, patientData.email, campaign)
        }
      }

      // Update campaign stats
      await supabase
        .from('referral_campaigns')
        .update({ total_sent: campaign.total_sent + 1 })
        .eq('id', campaignId)

      this.logger.info('Campagne déclenchée', { campaignId, patientName: patientData.name })

      return link
    } catch (error) {
      this.logger.error('Erreur dans triggerCampaign', { error, campaignId })
      throw error
    }
  }

  // ========================================================================
  // 7. GET SHARE CONTENT
  // ========================================================================

  async getShareContent(
    referralLinkId: string,
    channel: 'whatsapp' | 'email' | 'sms'
  ): Promise<{
    message: string
    url: string
    subject?: string
  }> {
    try {
      const supabase = createServiceSupabaseClient()

      const { data: link } = await supabase
        .from('referral_links')
        .select('*')
        .eq('id', referralLinkId)
        .single()

      if (!link) {
        throw new Error('Referral link not found')
      }

      const { data: therapist } = await supabase
        .from('therapists')
        .select('name')
        .eq('id', link.therapist_id)
        .single()

      const shareUrl = `${this.appUrl}/r/${link.slug}`

      const content: any = {
        url: shareUrl,
      }

      if (channel === 'whatsapp') {
        content.message = SHARE_TEMPLATES.whatsapp.body.replace('{url}', shareUrl)
      } else if (channel === 'email') {
        content.subject = SHARE_TEMPLATES.email.subject.replace('{therapist_name}', therapist?.name || 'mon thérapeute')
        content.message = SHARE_TEMPLATES.email.body
          .replace('{therapist_name}', therapist?.name || 'mon thérapeute')
          .replace('{url}', shareUrl)
          .replace('{referrer_name}', link.referrer_name)
      } else if (channel === 'sms') {
        content.message = SHARE_TEMPLATES.sms.body.replace('{url}', shareUrl)
      }

      return content
    } catch (error) {
      this.logger.error('Erreur dans getShareContent', { error, referralLinkId })
      throw error
    }
  }

  // ========================================================================
  // 8. GET REFERRAL STATS
  // ========================================================================

  async getReferralStats(therapistId: string, period: '7d' | '30d' | '90d' | 'all' = 'all'): Promise<ReferralStats> {
    try {
      const supabase = createServiceSupabaseClient()

      const dateFilter = this.getDateFilter(period)

      // Total links
      const { data: linksData } = await supabase
        .from('referral_links')
        .select('id, total_clicks, total_bookings, total_product_sales, total_revenue_generated, is_active')
        .eq('therapist_id', therapistId)
        .gte('created_at', dateFilter)

      const totalLinks = linksData?.length || 0
      const activeLinks = linksData?.filter((l: any) => l.is_active).length || 0
      const totalClicks = linksData?.reduce((sum: number, l: any) => sum + (l.total_clicks || 0), 0) || 0
      const totalConversions =
        linksData?.reduce((sum: number, l: any) => sum + (l.total_bookings || 0) + (l.total_product_sales || 0), 0) || 0
      const totalRevenueGenerated =
        linksData?.reduce((sum: number, l: any) => sum + (l.total_revenue_generated || 0), 0) || 0
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

      // Top referrers
      const { data: topReferrersData } = await supabase
        .from('referral_links')
        .select('referrer_name, total_bookings, total_product_sales, total_revenue_generated')
        .eq('therapist_id', therapistId)
        .gte('created_at', dateFilter)
        .order('total_revenue_generated', { ascending: false })
        .limit(5)

      const topReferrers =
        topReferrersData?.map((r: any) => ({
          name: r.referrer_name,
          conversions: (r.total_bookings || 0) + (r.total_product_sales || 0),
          revenue: r.total_revenue_generated || 0,
        })) || []

      // Pending rewards
      const { data: rewardsData } = await supabase
        .from('referral_rewards')
        .select('status')
        .eq('therapist_id', therapistId)
        .gte('created_at', dateFilter)

      const rewardsPending = rewardsData?.filter((r: any) => r.status === 'pending').length || 0
      const rewardsSent = rewardsData?.filter((r: any) => r.status === 'sent').length || 0

      return {
        totalLinks,
        totalClicks,
        totalConversions,
        conversionRate,
        totalRevenueGenerated,
        topReferrers,
        rewardsPending,
        rewardsSent,
        activeLinks,
      }
    } catch (error) {
      this.logger.error('Erreur dans getReferralStats', { error, therapistId })
      throw error
    }
  }

  // ========================================================================
  // 9. GET REFERRAL LINKS
  // ========================================================================

  async getReferralLinks(
    therapistId: string,
    options?: { active?: boolean; limit?: number }
  ): Promise<ReferralLink[]> {
    try {
      const supabase = createServiceSupabaseClient()

      let query = supabase
        .from('referral_links')
        .select('*')
        .eq('therapist_id', therapistId)
        .order('created_at', { ascending: false })

      if (options?.active !== undefined) {
        query = query.eq('is_active', options.active)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        this.logger.error('Erreur récupération liens de parrainage', { error })
        throw error
      }

      return (data || []).map((link: any) => {
        const shareUrl = `${this.appUrl}/r/${link.slug}`
        const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
          SHARE_TEMPLATES.whatsapp.body.replace('{url}', shareUrl)
        )}`
        const emailShareUrl = `mailto:?subject=Recommandation`
        return this.mapReferralLink(link, shareUrl, whatsappShareUrl, emailShareUrl)
      })
    } catch (error) {
      this.logger.error('Erreur dans getReferralLinks', { error, therapistId })
      throw error
    }
  }

  // ========================================================================
  // 10. DEACTIVATE LINK
  // ========================================================================

  async deactivateLink(linkId: string): Promise<void> {
    try {
      const supabase = createServiceSupabaseClient()

      const { error } = await supabase.from('referral_links').update({ is_active: false }).eq('id', linkId)

      if (error) {
        this.logger.error('Erreur désactivation lien', { error })
        throw error
      }

      this.logger.info('Lien de parrainage désactivé', { linkId })
    } catch (error) {
      this.logger.error('Erreur dans deactivateLink', { error, linkId })
      throw error
    }
  }

  // ========================================================================
  // 11. GENERATE QR CODE
  // ========================================================================

  generateQRCode(referralLinkId: string): string {
    const slug = referralLinkId.substring(0, 8).toLowerCase()
    const shareUrl = `${this.appUrl}/r/${slug}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`
  }

  // ========================================================================
  // 12. GET DEFAULT CAMPAIGNS
  // ========================================================================

  getDefaultCampaigns(therapistId: string): Partial<ReferralCampaign>[] {
    return [
      {
        therapistId,
        name: 'Post-séance',
        triggerType: 'post_session',
        triggerDelayHours: 24,
        linkType: 'booking',
        rewardType: 'discount',
        rewardValue: 10,
        rewardUnit: 'euro',
        whatsappMessage: SHARE_TEMPLATES.whatsapp.body,
        emailSubject: 'Je te recommande mon thérapeute',
        emailBody: SHARE_TEMPLATES.email.body,
        smsMessage: SHARE_TEMPLATES.sms.body,
        shareMessageTemplate: 'Si tu as aimé notre session, tu peux me recommander à des proches !',
      },
      {
        therapistId,
        name: 'Post-achat',
        triggerType: 'post_purchase',
        triggerDelayHours: 12,
        linkType: 'product',
        rewardType: 'free_product',
        rewardValue: 0,
        rewardUnit: 'euro',
        whatsappMessage: SHARE_TEMPLATES.whatsapp.body,
        emailSubject: 'Partage ce produit avec tes proches',
        emailBody: 'Tu as aimé ce produit ? Partage-le avec tes amis et obtiens des récompenses !',
        smsMessage: SHARE_TEMPLATES.sms.body,
        shareMessageTemplate: 'Ce produit m\'a vraiment aidé, je te le recommande !',
      },
      {
        therapistId,
        name: 'Patient satisfait',
        triggerType: 'manual',
        triggerDelayHours: 0,
        linkType: 'both',
        rewardType: 'credit',
        rewardValue: 15,
        rewardUnit: 'euro',
        whatsappMessage: SHARE_TEMPLATES.whatsapp.body,
        emailSubject: 'Tu apprécies mon travail ? Partage !',
        emailBody: 'Si mon accompagnement t\'a aidé, tes recommandations me soutiennent beaucoup 💙',
        smsMessage: SHARE_TEMPLATES.sms.body,
        shareMessageTemplate: 'Tes retours m\'aident énormément. Si tu veux me recommander...',
      },
    ]
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  private generateCode(prefix: string = 'ref'): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = prefix + '-'
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private mapReferralLink(
    data: any,
    shareUrl: string,
    whatsappShareUrl: string,
    emailShareUrl: string
  ): ReferralLink {
    return {
      id: data.id,
      therapistId: data.therapist_id,
      referrerName: data.referrer_name,
      referrerEmail: data.referrer_email,
      referrerPhone: data.referrer_phone,
      code: data.code,
      slug: data.slug,
      linkType: data.link_type,
      productId: data.product_id,
      referrerMessage: data.referrer_message,
      therapistMessage: data.therapist_message,
      rewardType: data.reward_type,
      rewardValue: data.reward_value,
      rewardUnit: data.reward_unit,
      totalClicks: data.total_clicks,
      totalBookings: data.total_bookings,
      totalProductSales: data.total_product_sales,
      totalRevenueGenerated: data.total_revenue_generated,
      isActive: data.is_active,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      shareUrl,
      whatsappShareUrl,
      emailShareUrl,
    }
  }

  private getRewardDescription(
    rewardType: string,
    rewardValue: number,
    productId?: string
  ): string {
    switch (rewardType) {
      case 'discount':
        return `${rewardValue}€ de réduction sur votre prochaine séance`
      case 'free_session':
        return `1 séance gratuite après ${rewardValue} recommandations`
      case 'free_product':
        return 'Accès gratuit au produit'
      case 'credit':
        return `${rewardValue}€ de crédit sur votre compte`
      default:
        return 'Merci de votre soutien !'
    }
  }

  private getDeliveryMethod(link: any): string {
    if (link.referrer_email) return 'email'
    if (link.referrer_phone) return 'sms'
    return 'code'
  }

  private getDateFilter(period: string): string {
    const now = new Date()
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return '1900-01-01'
    }
  }

  private async sendViaEmail(link: ReferralLink, recipientEmail: string, campaign: any): Promise<void> {
    try {
      const subject = campaign.email_subject || 'Je te recommande mon thérapeute'
      const body =
        campaign.email_body || `Découvre mon thérapeute : ${link.shareUrl}`

      await emailService.send({
        to: recipientEmail,
        subject,
        html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      })
    } catch (error) {
      this.logger.error('Erreur envoi email', { error })
    }
  }

  private async sendViaSMS(link: ReferralLink, recipientPhone: string, campaign: any): Promise<void> {
    try {
      const message = campaign.sms_message || `Découvre mon thérapeute : ${link.shareUrl}`

      // Would integrate with SMS provider (Twilio, etc.)
      this.logger.info('SMS à envoyer', { phone: recipientPhone, message })
    } catch (error) {
      this.logger.error('Erreur envoi SMS', { error })
    }
  }

  private async notifyTherapistOfConversion(therapistId: string, referrerName: string, conversionValue: number): Promise<void> {
    try {
      const supabase = createServiceSupabaseClient()

      const { data: therapist } = await supabase
        .from('therapists')
        .select('email')
        .eq('id', therapistId)
        .single()

      if (therapist?.email) {
        await emailService.send({
          to: therapist.email,
          subject: `Nouvelle conversion de parrainage : ${referrerName}`,
          html: `<p>Bravo ! <strong>${referrerName}</strong> a généré une conversion de <strong>${conversionValue}€</strong> grâce à votre lien de parrainage.</p>`,
        })
      }
    } catch (error) {
      this.logger.error('Erreur notification thérapeute', { error })
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const referralEngine = new ReferralEngine()

// ============================================================================
// NAMED EXPORTS FOR API ROUTES
// ============================================================================

/**
 * Create a referral link for a therapist
 */
export async function createReferralLink(options: {
  userId: string
  referrerName: string
  referrerEmail?: string
  referrerPhone?: string
  linkType: 'booking' | 'product' | 'both' | 'standard' | 'social' | 'email' | 'whatsapp'
  productId?: string
  rewardType?: 'discount' | 'free_session' | 'free_product' | 'credit' | 'none' | 'commission' | 'points'
  rewardValue?: number
  rewardUnit?: 'euro' | 'percent'
  customMessage?: string
}): Promise<ReferralLink> {
  return referralEngine.createReferralLink(options.userId, {
    referrerName: options.referrerName,
    referrerEmail: options.referrerEmail,
    referrerPhone: options.referrerPhone,
    linkType: (options.linkType === 'standard' || options.linkType === 'social' || options.linkType === 'email' || options.linkType === 'whatsapp')
      ? 'booking'
      : options.linkType,
    productId: options.productId,
    rewardType: (options.rewardType as any) || 'none',
    rewardValue: options.rewardValue,
    rewardUnit: options.rewardUnit,
    customMessage: options.customMessage,
  })
}

/**
 * Track a click on a referral link
 */
export async function trackClick(options: {
  slug: string
  source?: string
  ipHash?: string
  userAgent?: string
  referer?: string
}): Promise<{ id: string; redirectUrl: string }> {
  const result = await referralEngine.trackClick(
    options.slug,
    options.source || 'other',
    options.ipHash,
    options.userAgent
  )
  return {
    id: options.slug,
    redirectUrl: result.redirectTo,
  }
}

/**
 * Record a conversion from a referral
 */
export async function recordConversion(options: {
  referralSlug: string
  conversionType: 'booking' | 'inquiry' | 'signup' | 'purchase' | 'product_purchase' | 'lead_capture'
  name: string
  email: string
  phone?: string
  message?: string
  productId?: string
  bookingDate?: Date
  bookingTime?: string
  ipHash?: string
}): Promise<{
  id: string
  rewardEarned?: boolean
  rewardType?: string
  rewardValue?: number
}> {
  const supabase = createServiceSupabaseClient()
  const { data: linkData } = await supabase
    .from('referral_links')
    .select('id, therapist_id')
    .eq('slug', options.referralSlug)
    .single()
  if (!linkData) throw new Error('Referral link not found')
  let conversionType: 'booking' | 'product_purchase' | 'lead_capture'
  if (options.conversionType === 'booking') conversionType = 'booking'
  else if (options.conversionType === 'purchase') conversionType = 'product_purchase'
  else conversionType = 'lead_capture'
  await referralEngine.recordConversion(linkData.id, conversionType, options.email, 50)
  return { id: linkData.id, rewardEarned: true, rewardType: 'discount', rewardValue: 50 }
}

/**
 * Get referral links for a therapist
 */
export async function getReferralLinks(options: {
  userId: string
  active?: boolean
  limit?: number
}): Promise<ReferralLink[]> {
  return referralEngine.getReferralLinks(options.userId, {
    active: options.active,
    limit: options.limit,
  })
}

/**
 * Deactivate a referral link
 */
export async function deactivateLink(options: {
  linkId: string
  userId: string
}): Promise<{ success: boolean }> {
  await referralEngine.deactivateLink(options.linkId)
  return { success: true }
}

/**
 * Get referral statistics for a therapist
 */
export async function getReferralStats(options: {
  userId: string
  period?: '7d' | '30d' | '90d' | 'all'
}): Promise<ReferralStats> {
  return referralEngine.getReferralStats(options.userId, options.period || 'all')
}
