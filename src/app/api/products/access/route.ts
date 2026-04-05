/**
 * GET /api/products/access?token=xxx
 * Valide le token d'accès et retourne le contenu du produit
 * Publique (authentification basée sur token)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const accessLogger = logger.child({ component: 'ProductAccessAPI' })

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token requis' },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabaseClient()

    // 1. Valider le token
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*, digital_products(*)')
      .eq('access_token', token)
      .eq('status', 'paid')
      .single()

    if (purchaseError || !purchase) {
      accessLogger.warn('Token d\'accès invalide', { token: token.substring(0, 8) })
      return NextResponse.json(
        { error: 'Token invalide ou achat non complété' },
        { status: 403 }
      )
    }

    // 2. Tracker l'accès
    await supabase.from('product_analytics').insert({
      product_id: purchase.product_id,
      event_type: 'access',
      buyer_email: purchase.buyer_email,
      session_id: req.headers.get('x-session-id') || '',
      metadata: {
        userAgent: req.headers.get('user-agent'),
        accessedAt: new Date().toISOString(),
      },
    })

    // 3. Retourner le contenu du produit
    const { data: product, error: productError } = await supabase
      .from('digital_products')
      .select('*')
      .eq('id', purchase.product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    accessLogger.info('Accès au produit accordé', {
      productId: product.id,
      buyerEmail: purchase.buyer_email,
    })

    return NextResponse.json({
      success: true,
      purchase: {
        id: purchase.id,
        buyerEmail: purchase.buyer_email,
        buyerName: purchase.buyer_name,
        createdAt: purchase.created_at,
      },
      product: {
        id: product.id,
        title: product.title,
        description: product.description,
        type: product.type,
        modules: product.modules,
        emailSequence: product.email_sequence,
        metadata: product.metadata,
      },
    })
  } catch (error) {
    accessLogger.error('Erreur lors de la validation d\'accès', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
