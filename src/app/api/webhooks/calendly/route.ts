/**
 * Calendly Webhook Handler
 * Processes Calendly webhook events (invitee.created, invitee.canceled)
 */

import { NextRequest, NextResponse } from 'next/server'
import { bookingService } from '@/lib/booking-service'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/webhooks/calendly
 * Handle Calendly webhook events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Verify webhook signature (if configured)
    const signature = req.headers.get('x-calendly-signature')
    if (signature) {
      // TODO: Implement signature verification
      // const isValid = verifyCalendlySignature(body, signature)
      // if (!isValid) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      // }
    }

    logger.info('Webhook Calendly reçu', { event: body.event })

    // Handle webhook event
    await bookingService.handleCalendlyWebhook(body)

    return NextResponse.json({ success: true, message: 'Événement traité avec succès' })
  } catch (error) {
    logger.error('Erreur lors du traitement du webhook Calendly', { error })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
