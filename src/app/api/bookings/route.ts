/**
 * Bookings API Routes
 * GET: List bookings for authenticated therapist
 * POST: Create a new booking
 * PATCH: Update booking status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { bookingService } from '@/lib/booking-service'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings
 * List bookings for authenticated therapist
 * Query params: dateFrom, dateTo, status
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const dateTo = searchParams.get('dateTo') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const status = searchParams.get('status')

    const supabase = createServiceSupabaseClient()

    let query = supabase
      .from('bookings')
      .select('*')
      .eq('therapist_user_id', user.id)
      .gte('date', dateFrom)
      .lte('date', dateTo)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: bookings, error } = await query.order('date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des réservations' }, { status: 500 })
    }

    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/bookings
 * Create a new booking
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { date, startTime, endTime, type, price, leadId, notes } = body

    // Validation
    if (!date || !startTime || !endTime || !type || price === undefined) {
      return NextResponse.json(
        { error: 'Champs requis manquants: date, startTime, endTime, type, price' },
        { status: 400 }
      )
    }

    const booking = await bookingService.createBooking({
      leadId,
      therapistUserId: user.id,
      date,
      startTime,
      endTime,
      type,
      price,
      source: 'theralgo',
      notes,
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation' },
        { status: 500 }
      )
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * PATCH /api/bookings
 * Update booking status
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId, status, notes } = body

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'Champs requis manquants: bookingId, status' },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabaseClient()

    // Verify ownership
    const { data: booking } = await supabase
      .from('bookings')
      .select('therapist_user_id')
      .eq('id', bookingId)
      .maybeSingle()

    if (!booking || booking.therapist_user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const success = await bookingService.updateBookingStatus(bookingId, status, { notes })

    if (!success) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du statut' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
