/**
 * Launch Engine pour Theralgo
 *
 * Crée automatiquement une campagne Meta Ads pour le lancement d'un produit numérique
 * Gère: Création de campagne, optimisation pour ventes, targeting local
 */

import { MetaMarketingAPI, type CampaignParams, type AdSetParams, type AdSetTargeting } from './meta-api'
import { logger } from './logger'

export interface ProductLaunchParams {
  product: {
    title: string
    type: string
    price: number
    salesPageUrl: string
    adVariants: { headline: string; primaryText: string; description: string; ctaType: string }[]
  }
  therapist: {
    userId: string
    name: string
    city: string
    specialty: string
    adAccountId: string
    pixelId: string
    pageId: string
    accessToken: string
  }
  budget: {
    daily: number // in EUR
    durationDays: number
  }
}

export interface LaunchCampaignResult {
  campaignId: string
  adSetIds: string[]
  adIds: string[]
  totalBudget: number
  estimatedReach: { min: number; max: number }
}

class LaunchEngine {
  private launchLogger: typeof logger

  constructor() {
    this.launchLogger = logger.child({ component: 'LaunchEngine' })
  }

  /**
   * Crée une campagne complète de lancement pour un produit numérique
   */
  async createProductLaunchCampaign(params: ProductLaunchParams): Promise<LaunchCampaignResult> {
    try {
      this.launchLogger.info('Démarrage de la création de campagne de lancement', {
        product: params.product.title,
        therapist: params.therapist.name,
      })

      // Initialiser l'API Meta
      const meta = new MetaMarketingAPI({
        accessToken: params.therapist.accessToken,
        adAccountId: params.therapist.adAccountId,
        pixelId: params.therapist.pixelId,
        pageId: params.therapist.pageId,
      })

      // Calcul du budget total en centimes (EUR)
      const budgetInCents = Math.round(params.budget.daily * 100)
      const totalBudgetCents = budgetInCents * params.budget.durationDays

      // 1. Créer la campagne avec objectif OUTCOME_SALES
      const campaignName = `${params.product.title} - Lancement (${new Date().toLocaleDateString('fr-FR')})`
      const campaign = await meta.createCampaign({
        name: campaignName,
        objective: 'OUTCOME_SALES',
        status: 'ACTIVE',
        special_ad_categories: ['NONE'],
        buying_type: 'AUCTION',
        daily_budget: budgetInCents,
      })

      if (!campaign.id) {
        throw new Error('Echec de la création de la campagne Meta')
      }

      this.launchLogger.info('Campagne créée', { campaignId: campaign.id })

      // 2. Créer l'Ad Set avec targeting local
      const targeting = this.buildProductTargeting(params.therapist.city)

      const adSetName = `${params.product.title} - Ad Set - ${params.product.type}`
      const adSet = await meta.createAdSet({
        name: adSetName,
        campaign_id: campaign.id,
        optimization_goal: 'LINK_CLICKS',
        billing_event: 'LINK_CLICKS',
        daily_budget: budgetInCents,
        targeting,
        status: 'ACTIVE',
        promoted_object: {
          pixel_id: params.therapist.pixelId,
          custom_event_type: 'Purchase',
        },
      })

      if (!adSet.id) {
        throw new Error('Echec de la création de l\'Ad Set')
      }

      this.launchLogger.info('Ad Set créé', { adSetId: adSet.id })

      // 3. Créer les publicités pour chaque variante
      const adIds: string[] = []

      for (let i = 0; i < params.product.adVariants.length; i++) {
        const variant = params.product.adVariants[i]

        const ad = await meta.createAd({
          name: `${params.product.title} - Ad ${i + 1}`,
          adset_id: adSet.id,
          creative: {
            creative_id: await this.createCreative(
              meta,
              {
                headline: variant.headline,
                primaryText: variant.primaryText,
                description: variant.description,
                link: params.product.salesPageUrl,
                ctaType: variant.ctaType as 'LEARN_MORE' | 'SIGN_UP' | 'SUBSCRIBE' | 'CONTACT_US',
              },
              params.therapist.pageId
            ),
          },
          status: 'ACTIVE',
          tracking_specs: [
            {
              action_type: ['Purchase'],
              fb_pixel: [params.therapist.pixelId],
            },
          ],
        })

        if (ad.id) {
          adIds.push(ad.id)
          this.launchLogger.debug('Publicité créée', { adId: ad.id, variant: i + 1 })
        }
      }

      if (adIds.length === 0) {
        throw new Error('Echec de la création des publicités')
      }

      // 4. Estimer la portée
      const estimatedReach = this.estimateReach(params.budget.daily, params.budget.durationDays)

      const result: LaunchCampaignResult = {
        campaignId: campaign.id,
        adSetIds: [adSet.id],
        adIds,
        totalBudget: totalBudgetCents / 100,
        estimatedReach,
      }

      this.launchLogger.info('Campagne de lancement créée avec succès', result)
      return result
    } catch (error) {
      this.launchLogger.error('Erreur lors de la création de la campagne de lancement', error)
      throw error
    }
  }

  /**
   * Construit le targeting pour un produit local
   */
  private buildProductTargeting(city: string): AdSetTargeting {
    return {
      geo_locations: {
        cities: [
          {
            key: city,
            radius: 30, // 30 km autour de la ville
            distance_unit: 'kilometer',
          },
        ],
      },
      age_min: 25,
      age_max: 65,
      genders: [0], // Tous les genres
      publisher_platforms: ['facebook', 'instagram'],
      targeting_automation: {
        advantage_audience: 1, // Laisser Meta optimiser l'audience
      },
    }
  }

  /**
   * Crée une publicité créative pour la campagne
   */
  private async createCreative(
    meta: MetaMarketingAPI,
    variant: {
      headline: string
      primaryText: string
      description: string
      link: string
      ctaType: 'LEARN_MORE' | 'SIGN_UP' | 'SUBSCRIBE' | 'CONTACT_US'
    },
    pageId: string
  ): Promise<string> {
    const creative = await meta.createAdCreative({
      name: `Creative - ${variant.headline}`,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          link: variant.link,
          message: variant.primaryText,
          name: variant.headline,
          description: variant.description,
          call_to_action: {
            type: variant.ctaType,
            value: { link: variant.link },
          },
        },
      },
    })

    if (!creative.id) {
      throw new Error('Echec de la création du créatif')
    }

    return creative.id
  }

  /**
   * Estime la portée basée sur le budget et la durée
   */
  private estimateReach(dailyBudgetEur: number, durationDays: number): { min: number; max: number } {
    // CPM estimé pour les thérapeutes en Europe: 3-8 EUR
    const minCpm = 3
    const maxCpm = 8

    const totalBudget = dailyBudgetEur * durationDays

    // Reach = (Budget / CPM) * 1000
    const minReach = Math.round((totalBudget / maxCpm) * 1000)
    const maxReach = Math.round((totalBudget / minCpm) * 1000)

    return { min: minReach, max: maxReach }
  }
}

export const launchEngine = new LaunchEngine()
