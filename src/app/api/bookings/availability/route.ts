/**
 * Availability API Routes
 * GET: Get available slots for a therapist
 * POST: Update therapist's weekly schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { bookingService } from '@/lib/booking-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/availability
 * Get available slots for a therapist
 * Query params: therapistUserId, dateFrom, dateTo
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const therapistUserId = searchParams.get('therapistUserId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Validation
    if (!therapistUserId || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Paramètres requis manquants: therapistUserId, dateFrom, dateTo' },
        { status: 400 }
      )
    }

    const slots = await bookingService.getAvailableSlots({
      therapistUserId,
      dateFrom,
      dateTo,
    })

    return NextResponse.json(slots)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/bookings/availability
 * Update therapist's weekly schedule
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { weeklySchedule, blockedDates, bufferMinutes, timezone } = body

    // Validation
    if (!weeklySchedule) {
      return NextResponse.json(
        { error: 'Champ requis manquant: weeklySchedule' },
        { status: 400 }
      )
    }

    const success = await bookingService.updateTherapistAvailability(user.id, {
      weeklySchedule,
      blockedDates: blockedDates || [],
      bufferMinutes: bufferMinutes || 15,
      timezone: timezone || 'Europe/Paris',
    })

    if (!success) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la disponibilité' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Disponibilité mise à jour avec succès' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
