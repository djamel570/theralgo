import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { stripeService } from '@/lib/stripe-service'
import { publicApiLimiter } from '@/lib/rate-limit'
import { CheckoutSessionSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Extract client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'

    // Apply rate limiting
    const rateLimit = await publicApiLimiter.check(20, clientIp)
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter: rateLimit.reset,
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.reset) } }
      )
    }

    const body = await req.json()

    // Validate request body
    const validation = CheckoutSessionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const {
      priceId,
      productSlug,
      successUrl,
      cancelUrl,
      customerEmail,
    } = validation.data

    const supabase = createServiceSupabaseClient()

    // Fetch product by slug to verify it exists and is published
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, user_id, stripe_price_id, title, status')
      .eq('slug', productSlug)
      .eq('status', 'published')
      .single()

    if (productError || !product) {
      logger.warn('Product not found or not published', { slug: productSlug })
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }

    // Verify the price ID matches the product
    if (product.stripe_price_id !== priceId) {
      logger.warn('Price ID mismatch', {
        productId: product.id,
        requestPriceId: priceId,
        productPriceId: product.stripe_price_id,
      })
      return NextResponse.json(
        { error: 'Configuration invalide' },
        { status: 400 }
      )
    }

    try {
      // Create Stripe checkout session
      const { sessionId, url } = await stripeService.createCheckoutSession({
        priceId,
        successUrl,
        cancelUrl,
        customerEmail,
        metadata: {
          productId: product.id,
          productSlug,
          therapistId: product.user_id,
        },
        allowPromotionCodes: true,
      })

      logger.info('Checkout session created', {
        sessionId,
        productId: product.id,
        productSlug,
      })

      return NextResponse.json({
        success: true,
        sessionId,
        checkoutUrl: url,
      })
    } catch (stripeErr) {
      logger.error('Stripe error', { error: stripeErr })
      return NextResponse.json(
        { error: 'Erreur lors de la création de la session de paiement' },
        { status: 500 }
      )
    }
  } catch (err) {
    logger.error('Checkout request error', { error: err })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
