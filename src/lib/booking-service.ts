/**
 * Booking Service pour Theralgo
 *
 * Gère: Disponibilités, réservations, synchronisation avec calendriers externes
 * Intégrations: Calendly, Doctolib, autres systèmes
 */

import { createServiceSupabaseClient } from './supabase-server'
import { logger } from './logger'
import { emailService } from './email-service'

export interface BookingSlot {
  date: string // ISO date
  startTime: string // "09:00"
  endTime: string // "10:00"
  available: boolean
}

export interface Booking {
  id: string
  leadId: string | null
  therapistUserId: string
  date: string
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'attended' | 'no_show' | 'cancelled'
  type: 'first_session' | 'follow_up'
  price: number
  notes?: string
  source: 'theralgo' | 'calendly' | 'doctolib' | 'other'
  externalId?: string
  createdAt: string
  updatedAt: string
}

export interface TherapistAvailability {
  userId: string
  weeklySchedule: {
    [day: string]: { start: string; end: string; slotDuration: number }[] // day = 'monday', etc.
  }
  blockedDates: string[] // ISO dates
  bufferMinutes: number // time between appointments
  timezone: string
}

export interface BookingStats {
  totalBookings: number
  attended: number
  noShow: number
  showRate: number
  revenue: number
  averageValue: number
}

class BookingService {
  private logger: typeof logger

  constructor() {
    this.logger = logger.child({ component: 'BookingService' })
  }

  /**
   * Get available slots for a therapist within a date range
   */
  async getAvailableSlots(params: {
    therapistUserId: string
    dateFrom: string
    dateTo: string
  }): Promise<BookingSlot[]> {
    try {
      const supabase = createServiceSupabaseClient()

      // Get therapist availability settings
      const { data: availability, error: availError } = await supabase
        .from('therapist_availability')
        .select('*')
        .eq('user_id', params.therapistUserId)
        .maybeSingle()

      if (availError) {
        this.logger.error('Erreur lors de la récupération de la disponibilité', { error: availError })
        return []
      }

      if (!availability) {
        this.logger.info('Aucune disponibilité configurée pour le thérapeute', {
          userId: params.therapistUserId,
        })
        return []
      }

      // Get existing bookings
      const { data: existingBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('therapist_user_id', params.therapistUserId)
        .gte('date', params.dateFrom)
        .lte('date', params.dateTo)
        .in('status', ['pending', 'confirmed'])

      if (bookingError) {
        this.logger.error('Erreur lors de la récupération des réservations', { error: bookingError })
        return []
      }

      const slots: BookingSlot[] = []
      const weeklySchedule = availability.weekly_schedule || {}
      const blockedDates = availability.blocked_dates || []
      const bufferMinutes = availability.buffer_minutes || 15
      const slotDuration = availability.slot_duration || 60

      // Generate slots for each day in range
      const currentDate = new Date(params.dateFrom)
      const endDate = new Date(params.dateTo)

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayName = this.getDayName(currentDate.getDay())

        // Skip blocked dates
        if (blockedDates.includes(dateStr)) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }

        const daySchedule = weeklySchedule[dayName]

        if (!daySchedule || daySchedule.length === 0) {
          currentDate.setDate(currentDate.getDate() + 1)
          continue
        }

        // Generate slots for each time block
        for (const block of daySchedule) {
          const startTime = this.parseTime(block.start)
          const endTime = this.parseTime(block.end)

          let slotStart = new Date(startTime)
          const blockEnd = new Date(endTime)

          while (slotStart.getTime() + slotDuration * 60000 <= blockEnd.getTime()) {
            const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000)

            // Check if slot is available (no conflicting bookings)
            const isAvailable = !(existingBookings || []).some((booking) => {
              const bookingStart = new Date(`${booking.date}T${booking.start_time}`)
              const bookingEnd = new Date(`${booking.date}T${booking.end_time}`)

              return (
                slotStart < new Date(bookingEnd.getTime() + bufferMinutes * 60000) &&
                slotEnd > new Date(bookingStart.getTime() - bufferMinutes * 60000)
              )
            })

            if (isAvailable) {
              slots.push({
                date: dateStr,
                startTime: this.formatTime(slotStart),
                endTime: this.formatTime(slotEnd),
                available: true,
              })
            }

            slotStart = new Date(slotStart.getTime() + slotDuration * 60000)
          }
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      return slots
    } catch (error) {
      this.logger.error('Erreur lors de la génération des créneaux', { error })
      return []
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(params: {
    leadId?: string
    therapistUserId: string
    date: string
    startTime: string
    endTime: string
    type: 'first_session' | 'follow_up'
    price: number
    source?: string
    notes?: string
  }): Promise<Booking | null> {
    try {
      const supabase = createServiceSupabaseClient()

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([
          {
            lead_id: params.leadId || null,
            therapist_user_id: params.therapistUserId,
            date: params.date,
            start_time: params.startTime,
            end_time: params.endTime,
            status: 'pending',
            type: params.type,
            price: params.price,
            source: params.source || 'theralgo',
            notes: params.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        this.logger.error('Erreur lors de la création de la réservation', { error })
        return null
      }

      this.logger.info('Réservation créée avec succès', { bookingId: booking.id })

      // Send confirmation email
      await this.sendBookingConfirmationEmail(booking)

      return this.mapDatabaseBooking(booking)
    } catch (error) {
      this.logger.error('Erreur lors de la création de la réservation', { error })
      return null
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: Booking['status'],
    updateData?: { notes?: string }
  ): Promise<boolean> {
    try {
      const supabase = createServiceSupabaseClient()

      const { data: booking, error } = await supabase
        .from('bookings')
        .update({
          status,
          notes: updateData?.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) {
        this.logger.error('Erreur lors de la mise à jour du statut de la réservation', { error })
        return false
      }

      this.logger.info('Statut de la réservation mis à jour', { bookingId, status })

      // If attended, send CAPI event and update lead
      if (status === 'attended') {
        await this.handleAttendedBooking(booking)
      }

      return true
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du statut', { error })
      return false
    }
  }

  /**
   * Handle attended booking (send CAPI event, update lead)
   */
  private async handleAttendedBooking(booking: any): Promise<void> {
    try {
      const supabase = createServiceSupabaseClient()

      // Update lead status
      if (booking.lead_id) {
        await supabase
          .from('leads')
          .update({ status: 'converted' })
          .eq('id', booking.lead_id)
      }

      // Create notification
      await supabase.from('notifications').insert([
        {
          user_id: booking.therapist_user_id,
          type: 'booking_attended',
          title: 'Consultation complétée',
          message: `Une consultation du ${booking.date} à ${booking.start_time} a été marquée comme complétée.`,
          action_url: `/dashboard/bookings/${booking.id}`,
          read: false,
          created_at: new Date().toISOString(),
        },
      ])

      // Log for CAPI (would be sent to Meta API in production)
      this.logger.info('Consultation marquée comme complétée', {
        bookingId: booking.id,
        price: booking.price,
      })
    } catch (error) {
      this.logger.error('Erreur lors du traitement de la consultation complétée', { error })
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(
    therapistUserId: string,
    period: '7d' | '30d' | '90d'
  ): Promise<BookingStats> {
    try {
      const supabase = createServiceSupabaseClient()

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      startDate.setDate(startDate.getDate() - days)

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('therapist_user_id', therapistUserId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      if (error) {
        this.logger.error('Erreur lors de la récupération des statistiques', { error })
        return {
          totalBookings: 0,
          attended: 0,
          noShow: 0,
          showRate: 0,
          revenue: 0,
          averageValue: 0,
        }
      }

      const total = bookings?.length || 0
      const attended = bookings?.filter((b) => b.status === 'attended').length || 0
      const noShow = bookings?.filter((b) => b.status === 'no_show').length || 0
      const revenue = bookings?.reduce((sum, b) => sum + (b.price || 0), 0) || 0

      return {
        totalBookings: total,
        attended,
        noShow,
        showRate: total > 0 ? Math.round((attended / total) * 100) : 0,
        revenue,
        averageValue: total > 0 ? revenue / total : 0,
      }
    } catch (error) {
      this.logger.error('Erreur lors du calcul des statistiques', { error })
      return {
        totalBookings: 0,
        attended: 0,
        noShow: 0,
        showRate: 0,
        revenue: 0,
        averageValue: 0,
      }
    }
  }

  /**
   * Handle Calendly webhook
   */
  async handleCalendlyWebhook(payload: any): Promise<void> {
    try {
      // Match webhook event to booking
      if (payload.event === 'invitee.created') {
        const email = payload.payload?.email
        const eventName = payload.payload?.event_name
        const scheduledTime = payload.payload?.scheduled_time

        if (!email || !scheduledTime) {
          this.logger.warn('Données Calendly incomplètes', { payload })
          return
        }

        const supabase = createServiceSupabaseClient()

        // Find therapist by email
        const { data: therapist } = await supabase
          .from('therapist_profiles')
          .select('user_id')
          .eq('user_id', payload.payload?.organizer_id)
          .maybeSingle()

        if (!therapist) {
          this.logger.warn('Thérapeute non trouvé', { organizerId: payload.payload?.organizer_id })
          return
        }

        // Find lead by email
        const { data: lead } = await supabase
          .from('leads')
          .select('id')
          .eq('email', email)
          .order('created_at', { ascending: false })
          .maybeSingle()

        // Parse time
        const bookingDate = new Date(scheduledTime)
        const dateStr = bookingDate.toISOString().split('T')[0]
        const timeStr = `${String(bookingDate.getHours()).padStart(2, '0')}:${String(
          bookingDate.getMinutes()
        ).padStart(2, '0')}`

        // Create booking
        await this.createBooking({
          leadId: lead?.id,
          therapistUserId: therapist.user_id,
          date: dateStr,
          startTime: timeStr,
          endTime: new Date(bookingDate.getTime() + 60 * 60000).toISOString().split('T')[1].slice(0, 5),
          type: 'first_session',
          price: 0,
          source: 'calendly',
          notes: eventName,
        })
      }

      if (payload.event === 'invitee.canceled') {
        const externalId = payload.payload?.uuid

        const supabase = createServiceSupabaseClient()
        await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('external_id', externalId)
      }
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook Calendly', { error })
    }
  }

  /**
   * Save or update therapist availability
   */
  async updateTherapistAvailability(
    therapistUserId: string,
    availability: Partial<TherapistAvailability>
  ): Promise<boolean> {
    try {
      const supabase = createServiceSupabaseClient()

      const { error } = await supabase.from('therapist_availability').upsert(
        {
          user_id: therapistUserId,
          weekly_schedule: availability.weeklySchedule,
          blocked_dates: availability.blockedDates,
          buffer_minutes: availability.bufferMinutes,
          slot_duration: availability.weeklySchedule ? 60 : undefined,
          timezone: availability.timezone || 'Europe/Paris',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

      if (error) {
        this.logger.error('Erreur lors de la mise à jour de la disponibilité', { error })
        return false
      }

      this.logger.info('Disponibilité mise à jour avec succès', { userId: therapistUserId })
      return true
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour de la disponibilité', { error })
      return false
    }
  }

  /**
   * Get therapist availability settings
   */
  async getTherapistAvailability(therapistUserId: string): Promise<TherapistAvailability | null> {
    try {
      const supabase = createServiceSupabaseClient()

      const { data, error } = await supabase
        .from('therapist_availability')
        .select('*')
        .eq('user_id', therapistUserId)
        .maybeSingle()

      if (error) {
        this.logger.error('Erreur lors de la récupération de la disponibilité', { error })
        return null
      }

      if (!data) {
        return null
      }

      return {
        userId: data.user_id,
        weeklySchedule: data.weekly_schedule || {},
        blockedDates: data.blocked_dates || [],
        bufferMinutes: data.buffer_minutes || 15,
        timezone: data.timezone || 'Europe/Paris',
      }
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la disponibilité', { error })
      return null
    }
  }

  /**
   * Private helper methods
   */

  private getDayName(dayIndex: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[dayIndex]
  }

  private parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  private formatTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  private mapDatabaseBooking(dbBooking: any): Booking {
    return {
      id: dbBooking.id,
      leadId: dbBooking.lead_id,
      therapistUserId: dbBooking.therapist_user_id,
      date: dbBooking.date,
      startTime: dbBooking.start_time,
      endTime: dbBooking.end_time,
      status: dbBooking.status,
      type: dbBooking.type,
      price: dbBooking.price,
      notes: dbBooking.notes,
      source: dbBooking.source,
      externalId: dbBooking.external_id,
      createdAt: dbBooking.created_at,
      updatedAt: dbBooking.updated_at,
    }
  }

  private async sendBookingConfirmationEmail(booking: any): Promise<void> {
    try {
      const supabase = createServiceSupabaseClient()

      // Get therapist email
      const { data: therapist } = await supabase
        .from('therapist_profiles')
        .select('*')
        .eq('user_id', booking.therapist_user_id)
        .maybeSingle()

      if (!therapist) {
        return
      }

      // Get lead email if exists
      let leadEmail = ''
      if (booking.lead_id) {
        const { data: lead } = await supabase.from('leads').select('email').eq('id', booking.lead_id).maybeSingle()
        leadEmail = lead?.email || ''
      }

      // Send confirmation email
      if (leadEmail) {
        await emailService.send({
          to: leadEmail,
          subject: 'Confirmation de votre rendez-vous',
          html: `
            <h2>Votre rendez-vous est confirmé</h2>
            <p>Rendez-vous avec ${therapist.name}</p>
            <p>Date: ${booking.date}</p>
            <p>Heure: ${booking.start_time}</p>
            <p>Durée: 60 minutes</p>
            <p>Prix: ${booking.price}€</p>
          `,
        })
      }
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi de l\'email de confirmation', { error })
    }
  }
}

export const bookingService = new BookingService()
