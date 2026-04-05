/**
 * POST /api/products/launch
 * Crée et lance une campagne Meta Ads pour un produit
 * Auth requise (admin/thérapeute)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { launchEngine } from '@/lib/launch-engine'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const launchLogger = logger.child({ component: 'ProductLaunchAPI' })

const LaunchProductSchema = z.object({
  productId: z.string().uuid(),
  budgetDaily: z.number().min(5).max(1000), // EUR
  durationDays: z.number().min(1).max(90),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Authentification
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Validation
    const body = await req.json()
    const validation = LaunchProductSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation échouée', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { productId, budgetDaily, durationDays } = validation.data

    const supabase = createServiceSupabaseClient()

    // 3. Récupérer le produit
    const { data: product, error: productError } = await supabase
      .from('digital_products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // 4. Récupérer le profil thérapeute
    const { data: therapistProfile, error: profileError } = await supabase
      .from('therapist_profiles')
      .select('*, meta_config:therapist_meta_configs(*)')
      .eq('user_id', user.id)
      .single()

    if (profileError || !therapistProfile) {
      return NextResponse.json(
        { error: 'Profil thérapeute non trouvé' },
        { status: 404 }
      )
    }

    const metaConfig = Array.isArray(therapistProfile.meta_config)
      ? therapistProfile.meta_config[0]
      : therapistProfile.meta_config

    if (!metaConfig?.access_token || !metaConfig?.ad_account_id) {
      return NextResponse.json(
        { error: 'Configuration Meta Ads manquante' },
        { status: 400 }
      )
    }

    // 5. Créer les variantes d'annonce si manquantes
    const adVariants = product.ad_campaign_config?.adVariants || [
      {
        headline: `Découvrez ${product.title}`,
        primaryText: product.description || product.title,
        description: `Formation complète par ${therapistProfile.name}`,
        ctaType: 'LEARN_MORE',
      },
    ]

    // 6. Lancer la campagne
    launchLogger.info('Lancement de la campagne', {
      productId,
      therapist: therapistProfile.name,
      budget: budgetDaily,
    })

    const campaignResult = await launchEngine.createProductLaunchCampaign({
      product: {
        title: product.title,
        type: product.type,
        price: product.price_amount / 100,
        salesPageUrl: product.metadata?.salesPageUrl || `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.id}`,
        adVariants,
      },
      therapist: {
        userId: user.id,
        name: therapistProfile.name,
        city: therapistProfile.city || '',
        specialty: therapistProfile.specialty || '',
        adAccountId: metaConfig.ad_account_id,
        pixelId: metaConfig.pixel_id || '',
        pageId: metaConfig.page_id || '',
        accessToken: metaConfig.access_token,
      },
      budget: {
        daily: budgetDaily,
        durationDays,
      },
    })

    // 7. Sauvegarder la config de campagne
    await supabase
      .from('digital_products')
      .update({
        ad_campaign_config: {
          ...product.ad_campaign_config,
          campaignId: campaignResult.campaignId,
          adSetIds: campaignResult.adSetIds,
          adIds: campaignResult.adIds,
          budget: { daily: budgetDaily, total: budgetDaily * durationDays },
          launchedAt: new Date().toISOString(),
          estimatedReach: campaignResult.estimatedReach,
        },
      })
      .eq('id', productId)

    launchLogger.info('Campagne lancée avec succès', {
      productId,
      campaignId: campaignResult.campaignId,
    })

    return NextResponse.json({
      success: true,
      campaign: campaignResult,
    })
  } catch (error) {
    launchLogger.error('Erreur lors du lancement', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
