/**
 * Booking Stats API Routes
 * GET: Booking statistics for authenticated therapist
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { bookingService } from '@/lib/booking-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/stats
 * Get booking statistics
 * Query params: period (7d, 30d, 90d)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = (searchParams.get('period') || '30d') as '7d' | '30d' | '90d'

    if (!['7d', '30d', '90d'].includes(period)) {
      return NextResponse.json(
        { error: 'Période invalide. Doit être: 7d, 30d ou 90d' },
        { status: 400 }
      )
    }

    const stats = await bookingService.getBookingStats(user.id, period)

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
