/**
 * POST /api/products/deliver
 * Déclenche la livraison d'un produit après achat
 * Appelé par webhook Stripe (interne uniquement)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { emailService } from '@/lib/email-service'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const deliveryLogger = logger.child({ component: 'ProductDeliveryAPI' })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { purchaseId, accessUrl } = body

    if (!purchaseId || !accessUrl) {
      return NextResponse.json(
        { error: 'purchaseId et accessUrl requis' },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabaseClient()

    // 1. Récupérer l'achat
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('*, digital_products(title, email_sequence)')
      .eq('id', purchaseId)
      .single()

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: 'Achat non trouvé' },
        { status: 404 }
      )
    }

    // 2. Générer le token d'accès unique (s'il n'existe pas)
    let accessToken = purchase.access_token
    if (!accessToken) {
      accessToken = crypto.randomBytes(32).toString('hex')
      await supabase
        .from('purchases')
        .update({ access_token: accessToken, access_url: accessUrl })
        .eq('id', purchaseId)
    }

    // 3. Envoyer l'email de livraison
    const therapistProfile = await supabase
      .from('therapist_profiles')
      .select('name, email, user_id')
      .match({ user_id: purchase.therapist_user_id })
      .single()

    const therapistName = therapistProfile.data?.name || 'Thérapeute'
    const therapistEmail = therapistProfile.data?.email || ''

    await emailService.sendProductDelivery({
      buyerEmail: purchase.buyer_email,
      buyerName: purchase.buyer_name || 'Client',
      productTitle: purchase.digital_products?.title || 'Votre produit',
      accessUrl,
      therapistName,
      therapistEmail,
    })

    // 4. Planifier les emails de drip si une séquence existe
    const emailSequence = purchase.digital_products?.email_sequence || []
    for (const email of emailSequence) {
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + (email.dayOffset || 0))

      await emailService.scheduleDripEmail({
        purchaseId,
        email: purchase.buyer_email,
        moduleTitle: email.subject || 'Nouveau contenu',
        moduleContent: email.body || '',
        deliveryDate,
      })
    }

    // 5. Marquer comme livré
    await supabase
      .from('purchases')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', purchaseId)

    deliveryLogger.info('Produit livré avec succès', { purchaseId, email: purchase.buyer_email })

    return NextResponse.json({
      success: true,
      accessToken,
      accessUrl,
    })
  } catch (error) {
    deliveryLogger.error('Erreur lors de la livraison', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
