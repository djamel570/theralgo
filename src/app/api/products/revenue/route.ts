/**
 * GET /api/products/revenue
 * Retourne les données de revenus pour le dashboard
 * Auth requise
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const revenueLogger = logger.child({ component: 'ProductRevenueAPI' })

interface DailyRevenue {
  date: string
  revenue: number
  adSpend: number
  purchases: number
}

interface ProductBreakdown {
  productId: string
  title: string
  type: string
  price: number
  totalSales: number
  totalRevenue: number
  conversionRate: number
  pageViews: number
  checkouts: number
  accessOpened: number
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authentification
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const supabase = createServiceSupabaseClient()
    const daysBack = 30

    // 2. Récupérer tous les produits du thérapeute
    const { data: products } = await supabase
      .from('digital_products')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'published')

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        totalRevenue: 0,
        totalPurchases: 0,
        totalAdSpend: 0,
        roi: 0,
        flywheelPercentage: 0,
        dailyRevenue: [],
        productBreakdown: [],
        crossSellMetric: 0,
        passiveIncomeProjection: 0,
      })
    }

    const productIds = products.map((p) => p.id)

    // 3. Récupérer les achats des 30 derniers jours
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - daysBack)

    const { data: purchases } = await supabase
      .from('purchases')
      .select('*')
      .in('product_id', productIds)
      .eq('status', 'paid')
      .gte('created_at', thirtyDaysAgo.toISOString())

    // 4. Récupérer les analytics
    const { data: analytics } = await supabase
      .from('product_analytics')
      .select('*')
      .in('product_id', productIds)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // 5. Calculer les métriques agrégées
    let totalRevenue = 0
    let totalAdSpend = 0
    const dailyRevenueMap = new Map<string, DailyRevenue>()

    purchases?.forEach((purchase) => {
      totalRevenue += purchase.amount
      const date = new Date(purchase.created_at).toISOString().split('T')[0]
      const existing = dailyRevenueMap.get(date) || { date, revenue: 0, adSpend: 0, purchases: 0 }
      existing.revenue += purchase.amount
      existing.purchases += 1
      dailyRevenueMap.set(date, existing)
    })

    // Récupérer la dépense publicitaire des campagnes
    products.forEach((product) => {
      const campaignConfig = product.ad_campaign_config
      if (campaignConfig?.budget?.daily && campaignConfig?.launchedAt) {
        const launchDate = new Date(campaignConfig.launchedAt)
        const daysSinceLaunch = Math.floor((Date.now() - launchDate.getTime()) / (1000 * 60 * 60 * 24))
        const daysToCount = Math.min(daysSinceLaunch + 1, daysBack)
        totalAdSpend += campaignConfig.budget.daily * daysToCount
      }
    })

    // 6. Remplir les jours manquants dans le graphique
    const dailyRevenue: DailyRevenue[] = []
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyRevenue.push(dailyRevenueMap.get(dateStr) || { date: dateStr, revenue: 0, adSpend: 0, purchases: 0 })
    }

    // 7. Calcul des métriques par produit
    const productBreakdown: ProductBreakdown[] = products.map((product) => {
      const productPurchases = purchases?.filter((p) => p.product_id === product.id) || []
      const productAnalytics = analytics?.filter((a) => a.product_id === product.id) || []

      const pageViews = productAnalytics.filter((a) => a.event_type === 'page_view').length
      const checkouts = productAnalytics.filter((a) => a.event_type === 'checkout_start').length
      const accessOpened = productAnalytics.filter((a) => a.event_type === 'access').length

      const totalRevenueProd = productPurchases.reduce((sum, p) => sum + p.amount, 0)
      const conversionRate = checkouts > 0 ? (productPurchases.length / checkouts) * 100 : 0

      return {
        productId: product.id,
        title: product.title,
        type: product.type,
        price: product.price_amount / 100,
        totalSales: productPurchases.length,
        totalRevenue: totalRevenueProd / 100,
        conversionRate: Math.round(conversionRate),
        pageViews,
        checkouts,
        accessOpened,
      }
    })

    // 8. Calculs finaux
    const roi = totalAdSpend > 0 ? ((totalRevenue - totalAdSpend * 100) / (totalAdSpend * 100)) * 100 : 0
    const flywheelPercentage = totalAdSpend > 0 ? (totalRevenue / (totalAdSpend * 100)) * 100 : 0

    // Cross-sell: nombre d'acheteurs qui ont aussi pris RDV
    const buyerEmails = new Set(purchases?.map((p) => p.buyer_email) || [])
    const { data: leads } = await supabase
      .from('leads')
      .select('email')
      .in('email', Array.from(buyerEmails))

    const crossSellMetric = leads?.length || 0

    // Projection de revenu passif (projeté sur 12 mois avec croissance)
    const monthlyAverage = totalRevenue / daysBack * 30
    const passiveIncomeProjection = monthlyAverage * 12 * 1.1 // +10% croissance estimée

    revenueLogger.info('Métriques de revenu calculées', {
      totalRevenue: totalRevenue / 100,
      totalAdSpend: totalAdSpend,
      roi: Math.round(roi),
    })

    return NextResponse.json({
      success: true,
      totalRevenue: totalRevenue / 100, // EUR
      totalPurchases: purchases?.length || 0,
      totalAdSpend,
      roi: Math.round(roi * 100) / 100,
      flywheelPercentage: Math.round(flywheelPercentage),
      dailyRevenue,
      productBreakdown,
      crossSellMetric,
      passiveIncomeProjection: Math.round(passiveIncomeProjection / 100),
    })
  } catch (error) {
    revenueLogger.error('Erreur lors du calcul des revenus', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
