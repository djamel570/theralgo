import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { createConversionsClient } from '@/lib/meta-conversions'
import { stripeService } from '@/lib/stripe-service'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Lazy initialization to avoid build-time crash when env var is missing
let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const payload = await req.text()
    event = getStripe().webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.warn('Webhook signature verification failed', { error: message })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    const supabase = createServiceSupabaseClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, supabase, req)
        break
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeSucceeded(charge, supabase)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        logger.info('Subscription created', { subscriptionId: subscription.id })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabase)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, supabase)
        break
      }

      default:
        logger.debug(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Webhook processing error', { error })
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  req: NextRequest
) {
  try {
    if (!session.metadata?.productId || !session.customer_email) {
      logger.warn('Checkout session missing required metadata', {
        sessionId: session.id,
      })
      return
    }

    // Get product details
    const { data: product } = await supabase
      .from('products')
      .select('*, therapist:user_id(id, email, name)')
      .eq('id', session.metadata.productId)
      .single()

    if (!product) {
      logger.error('Product not found', { productId: session.metadata.productId })
      return
    }

    // Get session amount
    const amount = session.amount_total ? session.amount_total / 100 : 0

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: product.user_id,
        product_id: session.metadata.productId,
        stripe_session_id: session.id,
        customer_email: session.customer_email,
        amount_paid: amount,
        status: 'completed',
        metadata: {
          customerName: session.customer_details?.name || null,
          country: session.customer_details?.address?.country || null,
        },
      })
      .select()
      .single()

    if (purchaseError) {
      logger.error('Failed to create purchase record', { error: purchaseError })
      return
    }

    logger.info('Purchase created', {
      purchaseId: purchase.id,
      productId: product.id,
      amount,
    })

    // Send delivery email (placeholder - implement as needed)
    try {
      await sendDeliveryEmail({
        customerEmail: session.customer_email,
        customerName: session.customer_details?.name || 'Client',
        productTitle: product.title,
        productId: product.id,
        purchaseId: purchase.id,
      })
    } catch (emailErr) {
      logger.warn('Failed to send delivery email', { error: emailErr })
    }

    // Track purchase event via Meta CAPI
    try {
      const pixelId = product.metadata?.meta_pixel_id || process.env.META_DEFAULT_PIXEL_ID

      if (pixelId && process.env.META_ACCESS_TOKEN) {
        const capiClient = createConversionsClient(pixelId)

        const userData = await capiClient.prepareUserData({
          email: session.customer_email,
          firstName: session.customer_details?.name?.split(' ')[0],
        })

        await capiClient.sendEvent({
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: purchase.id,
          event_source_url: req.headers.get('referer') || undefined,
          action_source: 'website',
          user_data: userData,
          custom_data: {
            value: amount,
            currency: 'EUR',
            content_name: product.title,
            content_category: 'product',
          },
        })

        logger.info('Purchase event sent to Meta', { purchaseId: purchase.id })
      }
    } catch (capiErr) {
      logger.warn('Failed to send Meta CAPI event', { error: capiErr })
    }

    // Update product revenue metrics
    try {
      await supabase
        .from('product_metrics')
        .insert({
          product_id: product.id,
          total_purchases: 1,
          total_revenue: amount,
          recorded_at: new Date().toISOString(),
        })
    } catch (metricsErr) {
      logger.warn('Failed to update metrics', { error: metricsErr })
    }
  } catch (error) {
    logger.error('Error handling checkout completion', { error })
  }
}

async function handleChargeSucceeded(
  charge: Stripe.Charge,
  supabase: ReturnType<typeof createServiceSupabaseClient>
) {
  try {
    logger.info('Charge succeeded', {
      chargeId: charge.id,
      amount: charge.amount / 100,
    })
  } catch (error) {
    logger.error('Error handling charge success', { error })
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createServiceSupabaseClient>
) {
  try {
    logger.info('Subscription cancelled', { subscriptionId: subscription.id })

    // Update subscription status in DB if needed
    // await supabase
    //   .from('subscriptions')
    //   .update({ status: 'cancelled' })
    //   .eq('stripe_subscription_id', subscription.id)
  } catch (error) {
    logger.error('Error handling subscription deletion', { error })
  }
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof createServiceSupabaseClient>
) {
  try {
    logger.warn('Payment failed', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
    })

    // Could send alert to therapist
  } catch (error) {
    logger.error('Error handling payment failure', { error })
  }
}

async function sendDeliveryEmail(params: {
  customerEmail: string
  customerName: string
  productTitle: string
  productId: string
  purchaseId: string
}) {
  // Placeholder for email delivery
  // In a real implementation, this would call your email service
  // (SendGrid, Resend, etc.)

  try {
    // Example structure:
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'noreply@theralgo.fr',
    //     to: params.customerEmail,
    //     subject: `Votre accès à "${params.productTitle}" est prêt`,
    //     html: `<p>Bonjour ${params.customerName},</p><p>Merci pour votre achat...</p>`,
    //   }),
    // })

    logger.info('Delivery email placeholder', {
      email: params.customerEmail,
      product: params.productTitle,
    })
  } catch (error) {
    logger.error('Error sending delivery email', { error })
    throw error
  }
}

