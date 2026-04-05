import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export interface CreateProductParams {
  name: string
  description: string
  price: number // in EUR
  type: 'one_time' | 'recurring'
  recurringInterval?: 'month' | 'year'
  metadata?: Record<string, string>
}

export interface CreateCheckoutSessionParams {
  priceId: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  metadata?: Record<string, string>
  allowPromotionCodes?: boolean
}

export interface CreateConnectAccountParams {
  email: string
  therapistName: string
  country: string
}

export interface CreateTransferParams {
  amount: number
  destinationAccountId: string
  transferGroup: string
}

export interface WebhookEventResult {
  type: string
  data: Record<string, unknown>
}

export interface PaymentStatus {
  status: 'paid' | 'pending' | 'failed'
  customerEmail?: string
  amount: number
}

export class StripeService {
  async createProduct(params: CreateProductParams): Promise<{
    productId: string
    priceId: string
  }> {
    try {
      // Create Stripe product
      const product = await stripe.products.create({
        name: params.name,
        description: params.description,
        metadata: params.metadata || {},
      })

      // Create price for the product
      const priceData: Stripe.PriceCreateParams = {
        product: product.id,
        currency: 'eur',
        unit_amount: Math.round(params.price * 100), // Convert to cents
        metadata: params.metadata || {},
      }

      if (params.type === 'recurring' && params.recurringInterval) {
        priceData.recurring = {
          interval: params.recurringInterval as 'month' | 'year',
          usage_type: 'licensed',
        }
      }

      const price = await stripe.prices.create(priceData)

      return {
        productId: product.id,
        priceId: price.id,
      }
    } catch (error) {
      console.error('Failed to create Stripe product:', error)
      throw error
    }
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{
    sessionId: string
    url: string
  }> {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: params.customerEmail,
        metadata: params.metadata || {},
        allow_promotion_codes: params.allowPromotionCodes ?? true,
        locale: 'fr',
      })

      return {
        sessionId: session.id,
        url: session.url || '',
      }
    } catch (error) {
      console.error('Failed to create Stripe checkout session:', error)
      throw error
    }
  }

  async handleWebhookEvent(
    payload: string,
    signature: string
  ): Promise<WebhookEventResult> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

      return {
        type: event.type,
        data: event.data as Record<string, unknown>,
      }
    } catch (error) {
      console.error('Failed to handle webhook event:', error)
      throw error
    }
  }

  async createConnectAccount(params: CreateConnectAccountParams): Promise<{
    accountId: string
    onboardingUrl: string
  }> {
    try {
      // Create Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        email: params.email,
        business_profile: {
          name: params.therapistName,
          url: 'https://theralgo.fr',
        },
        country: params.country,
      })

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        type: 'account_onboarding',
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?reauth=true`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`,
      })

      return {
        accountId: account.id,
        onboardingUrl: accountLink.url,
      }
    } catch (error) {
      console.error('Failed to create Stripe Connect account:', error)
      throw error
    }
  }

  async createTransfer(params: CreateTransferParams): Promise<{
    transferId: string
  }> {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: 'eur',
        destination: params.destinationAccountId,
        transfer_group: params.transferGroup,
        metadata: {
          type: 'product_sale_payout',
          transfer_group: params.transferGroup,
        },
      })

      return {
        transferId: transfer.id,
      }
    } catch (error) {
      console.error('Failed to create transfer:', error)
      throw error
    }
  }

  async getPaymentStatus(sessionId: string): Promise<PaymentStatus> {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent'],
      })

      const paymentIntent = session.payment_intent as Stripe.PaymentIntent | undefined

      let status: 'paid' | 'pending' | 'failed' = 'pending'
      if (session.payment_status === 'paid') {
        status = 'paid'
      } else if (paymentIntent?.status === 'requires_payment_method') {
        status = 'failed'
      }

      return {
        status,
        customerEmail: session.customer_email || undefined,
        amount: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
      }
    } catch (error) {
      console.error('Failed to get payment status:', error)
      throw error
    }
  }

  async getCheckoutSessionMetadata(
    sessionId: string
  ): Promise<Record<string, unknown> | null> {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      return session.metadata || null
    } catch (error) {
      console.error('Failed to get checkout session metadata:', error)
      throw error
    }
  }
}

export const stripeService = new StripeService()
