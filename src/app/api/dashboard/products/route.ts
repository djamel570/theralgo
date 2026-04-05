/**
 * GET /api/dashboard/products
 * List products for authenticated therapist
 *
 * PATCH /api/dashboard/products
 * Update product status (publish/unpublish)
 * Body: { productId, status }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const productsLogger = logger.child({ component: 'ProductsAPI' })

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Fetch products
    const supabase = createServiceSupabaseClient()
    const { data: products, error } = await supabase
      .from('digital_products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // 3. Fetch sales data for each product
    const productIds = (products || []).map(p => p.id)
    let salesData: Record<string, { count: number; revenue: number }> = {}

    if (productIds.length > 0) {
      const { data: purchases } = await supabase
        .from('purchases')
        .select('product_id, amount')
        .in('product_id', productIds)
        .eq('status', 'paid')

      purchases?.forEach(purchase => {
        if (!salesData[purchase.product_id]) {
          salesData[purchase.product_id] = { count: 0, revenue: 0 }
        }
        salesData[purchase.product_id].count += 1
        salesData[purchase.product_id].revenue += purchase.amount
      })
    }

    productsLogger.info('Products fetched', {
      userId: user.id,
      count: products?.length || 0
    })

    return NextResponse.json({
      success: true,
      products: (products || []).map(product => ({
        id: product.id,
        title: product.title,
        type: product.type,
        price_amount: product.price_amount,
        status: product.status,
        sales_count: salesData[product.id]?.count || 0,
        revenue: salesData[product.id]?.revenue || 0,
        created_at: product.created_at
      }))
    })
  } catch (error) {
    productsLogger.error('Erreur lors de la récupération des produits', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await req.json()
    const { productId, status } = body

    if (!productId || !status) {
      return NextResponse.json(
        { error: 'productId et status requis' },
        { status: 400 }
      )
    }

    // 3. Verify product belongs to user
    const supabase = createServiceSupabaseClient()
    const { data: product, error: fetchError } = await supabase
      .from('digital_products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // 4. Update product status
    const { error: updateError } = await supabase
      .from('digital_products')
      .update({ status })
      .eq('id', productId)

    if (updateError) {
      throw updateError
    }

    productsLogger.info('Product status updated', {
      userId: user.id,
      productId,
      newStatus: status
    })

    return NextResponse.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      product: {
        id: productId,
        status
      }
    })
  } catch (error) {
    productsLogger.error('Erreur lors de la mise à jour du produit', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
