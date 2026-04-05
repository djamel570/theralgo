'use client'

/**
 * Booking Calendar Component
 * Weekly view with hourly slots, color-coded bookings
 */

import { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Booking {
  id: string
  date: string
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'attended' | 'no_show' | 'cancelled'
  type: 'first_session' | 'follow_up'
  price: number
  notes?: string
}

interface BookingStats {
  totalBookings: number
  attended: number
  noShow: number
  showRate: number
  revenue: number
  averageValue: number
}

interface BookingCalendarProps {
  onCreateBooking?: (slot: { date: string; startTime: string; endTime: string }) => void
  onEditBooking?: (booking: Booking) => void
  onConfigureAvailability?: () => void
}

export default function BookingCalendar({
  onCreateBooking,
  onEditBooking,
  onConfigureAvailability,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; startTime: string } | null>(null)

  // Fetch bookings and stats
  useEffect(() => {
    fetchData()
  }, [currentDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const weekStart = startOfWeek(currentDate, { locale: fr })
      const weekEnd = addDays(weekStart, 6)

      const dateFrom = format(weekStart, 'yyyy-MM-dd')
      const dateTo = format(weekEnd, 'yyyy-MM-dd')

      // Fetch bookings
      const bookingsRes = await fetch(`/api/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setBookings(data || [])
      }

      // Fetch stats
      const statsRes = await fetch('/api/bookings/stats?period=30d')
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeekDays = () => {
    const weekStart = startOfWeek(currentDate, { locale: fr })
    return Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)) // Monday to Saturday
  }

  const hours = Array.from({ length: 11 }, (_, i) => i + 8) // 8:00 to 18:00

  const getBookingForSlot = (date: string, hour: number) => {
    return bookings.find((b) => {
      const bookingDate = b.date
      const startHour = parseInt(b.startTime.split(':')[0])
      return bookingDate === date && startHour === hour
    })
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return '#72C15F' // Green
      case 'pending':
        return '#3B82F6' // Blue
      case 'no_show':
        return '#EF4444' // Red
      case 'cancelled':
        return '#9CA3AF' // Grey
      case 'attended':
        return '#72C15F' // Green
      default:
        return '#6B7280' // Muted
    }
  }

  const handlePreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7))
  }

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleSlotClick = (date: string, hour: number) => {
    const startTime = `${String(hour).padStart(2, '0')}:00`
    const endTime = `${String(hour + 1).padStart(2, '0')}:00`

    const booking = getBookingForSlot(date, hour)
    if (booking && onEditBooking) {
      onEditBooking(booking)
    } else if (!booking && onCreateBooking) {
      onCreateBooking({ date, startTime, endTime })
    }
  }

  const weekStart = startOfWeek(currentDate, { locale: fr })

  return (
    <div style={{ padding: '24px', backgroundColor: '#F7F4EE', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '16px' }}>
          Calendrier des rendez-vous
        </h1>

        {/* Stats Bar */}
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>Rendez-vous cette semaine</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A1A1A' }}>{stats.totalBookings}</p>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>Taux de présence</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#72C15F' }}>{stats.showRate}%</p>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>Revenu ce mois</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A1A1A' }}>{Math.round(stats.revenue)}€</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <button
          onClick={handlePreviousWeek}
          style={{
            padding: '8px 12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#1A1A1A',
          }}
        >
          ← Semaine précédente
        </button>

        <div style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', minWidth: '200px', textAlign: 'center' }}>
          {format(weekStart, 'd MMMM', { locale: fr })} - {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: fr })}
        </div>

        <button
          onClick={handleToday}
          style={{
            padding: '8px 12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #72C15F',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#72C15F',
          }}
        >
          Aujourd'hui
        </button>

        <button
          onClick={handleNextWeek}
          style={{
            padding: '8px 12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#1A1A1A',
          }}
        >
          Semaine suivante →
        </button>

        <button
          onClick={onConfigureAvailability}
          style={{
            padding: '8px 12px',
            backgroundColor: '#72C15F',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#FFFFFF',
          }}
        >
          Configurer mes disponibilités
        </button>
      </div>

      {/* Calendar */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Chargement...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280', width: '60px' }}>
                    Heure
                  </th>
                  {getWeekDays().map((day) => (
                    <th
                      key={format(day, 'yyyy-MM-dd')}
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6B7280',
                        minWidth: '120px',
                        borderLeft: '1px solid #E5E7EB',
                      }}
                    >
                      <div>{format(day, 'EEE', { locale: fr }).toUpperCase()}</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1A1A1A' }}>
                        {format(day, 'd MMM', { locale: fr })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => (
                  <tr key={hour} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px', fontSize: '12px', fontWeight: '500', color: '#6B7280' }}>
                      {String(hour).padStart(2, '0')}:00
                    </td>
                    {getWeekDays().map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const booking = getBookingForSlot(dateStr, hour)

                      return (
                        <td
                          key={dateStr}
                          onClick={() => handleSlotClick(dateStr, hour)}
                          style={{
                            padding: '8px',
                            borderLeft: '1px solid #E5E7EB',
                            cursor: 'pointer',
                            minHeight: '80px',
                            backgroundColor: booking ? getStatusColor(booking.status) : isSameDay(day, new Date()) ? '#F0FDF4' : '#FFFFFF',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (!booking) {
                              (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!booking) {
                              (e.currentTarget as HTMLElement).style.backgroundColor = isSameDay(day, new Date()) ? '#F0FDF4' : '#FFFFFF'
                            }
                          }}
                        >
                          {booking && (
                            <div style={{ fontSize: '11px', color: '#FFFFFF', fontWeight: '600' }}>
                              <div>{booking.startTime}</div>
                              <div style={{ fontSize: '10px', opacity: 0.9 }}>{booking.price}€</div>
                              <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '4px' }}>
                                {booking.status === 'attended' ? 'Complétée' : booking.status === 'confirmed' ? 'Confirmée' : booking.status === 'pending' ? 'En attente' : booking.status === 'no_show' ? 'Absent' : 'Annulée'}
                              </div>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
