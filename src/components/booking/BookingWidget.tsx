'use client'

/**
 * Booking Widget Component
 * Embeddable booking component for therapist landing pages
 */

import { useState, useEffect } from 'react'
import { format, parse } from 'date-fns'
import { fr } from 'date-fns/locale'

interface BookingWidgetProps {
  therapistUserId: string
  therapistName?: string
  consultationPrice?: number
  minHeight?: string
}

interface BookingSlot {
  date: string
  startTime: string
  endTime: string
  available: boolean
}

export default function BookingWidget({
  therapistUserId,
  therapistName = 'Thérapeute',
  consultationPrice = 0,
  minHeight = '400px',
}: BookingWidgetProps) {
  const [step, setStep] = useState<'calendar' | 'times' | 'contact' | 'confirmation'>('calendar')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [slots, setSlots] = useState<BookingSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [contact, setContact] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  // Generate available dates
  const [availableDates, setAvailableDates] = useState<string[]>([])

  useEffect(() => {
    const dates: string[] = []
    for (let i = 1; i <= 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      // Skip Sundays
      if (date.getDay() !== 0) {
        dates.push(date.toISOString().split('T')[0])
      }
    }
    setAvailableDates(dates)
  }, [])

  // Fetch slots when date selected
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedDate])

  const fetchAvailableSlots = async () => {
    setLoading(true)
    try {
      const nextDay = new Date(selectedDate)
      nextDay.setDate(nextDay.getDate() + 1)
      const dateTo = nextDay.toISOString().split('T')[0]

      const res = await fetch(
        `/api/bookings/availability?therapistUserId=${therapistUserId}&dateFrom=${selectedDate}&dateTo=${dateTo}`
      )
      if (res.ok) {
        const data = await res.json()
        setSlots(data || [])
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des créneaux', error)
    } finally {
      setLoading(false)
    }
  }

  const getAvailableTimesForDate = (): string[] => {
    return slots
      .filter((s) => s.date === selectedDate && s.available)
      .map((s) => s.startTime)
      .filter((time, index, arr) => arr.indexOf(time) === index)
      .sort()
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime('')
    setStep('times')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep('contact')
  }

  const handleContactChange = (field: string, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Create lead
      const leadRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          message: contact.message,
        }),
      })

      if (!leadRes.ok) throw new Error('Erreur création du prospect')
      const lead = await leadRes.json()

      // Create booking
      const endTime = new Date(`2000-01-01T${selectedTime}`)
      endTime.setHours(endTime.getHours() + 1)

      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          therapistUserId,
          date: selectedDate,
          startTime: selectedTime,
          endTime: format(endTime, 'HH:mm'),
          type: 'first_session',
          price: consultationPrice || 0,
        }),
      })

      if (!bookingRes.ok) throw new Error('Erreur création de la réservation')

      setStep('confirmation')
    } catch (error) {
      console.error('Erreur lors de la soumission', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep('calendar')
    setSelectedDate('')
    setSelectedTime('')
    setContact({ name: '', email: '', phone: '', message: '' })
  }

  const times = getAvailableTimesForDate()

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        padding: '32px',
        maxWidth: '500px',
        minHeight,
        margin: '0 auto',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      {step === 'calendar' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '8px' }}>
            Prendre rendez-vous
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
            avec {therapistName}
          </p>

          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' }}>
            Sélectionnez une date
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
            {availableDates.map((date) => (
              <button
                key={date}
                onClick={() => handleDateSelect(date)}
                style={{
                  padding: '12px 8px',
                  backgroundColor: selectedDate === date ? '#72C15F' : '#F3F4F6',
                  border: selectedDate === date ? '2px solid #5DB847' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  color: selectedDate === date ? '#FFFFFF' : '#1A1A1A',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
              >
                <div>{format(new Date(date), 'd MMM', { locale: fr })}</div>
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                  {format(new Date(date), 'EEE', { locale: fr })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'times' && (
        <div>
          <button
            onClick={() => setStep('calendar')}
            style={{
              background: 'none',
              border: 'none',
              color: '#72C15F',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '16px',
              fontWeight: '500',
            }}
          >
            ← Retour
          </button>

          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '8px' }}>
            Horaires disponibles
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
            {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
              Chargement des créneaux...
            </div>
          ) : times.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
              Aucun créneau disponible pour cette date
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '24px' }}>
              {times.map((time) => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  style={{
                    padding: '12px',
                    backgroundColor: selectedTime === time ? '#72C15F' : '#F3F4F6',
                    border: selectedTime === time ? '2px solid #5DB847' : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: selectedTime === time ? '#FFFFFF' : '#1A1A1A',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'contact' && (
        <div>
          <button
            onClick={() => setStep('times')}
            style={{
              background: 'none',
              border: 'none',
              color: '#72C15F',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '16px',
              fontWeight: '500',
            }}
          >
            ← Retour
          </button>

          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '24px' }}>
            Confirmez votre rendez-vous
          </h2>

          <div style={{ backgroundColor: '#F0FDF4', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #DCFCE7' }}>
            <p style={{ fontSize: '14px', color: '#1A1A1A', marginBottom: '4px' }}>
              <strong>Date:</strong> {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
            <p style={{ fontSize: '14px', color: '#1A1A1A', marginBottom: '4px' }}>
              <strong>Heure:</strong> {selectedTime}
            </p>
            {consultationPrice > 0 && (
              <p style={{ fontSize: '14px', color: '#1A1A1A' }}>
                <strong>Tarif:</strong> {consultationPrice}€
              </p>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '6px' }}>
              Nom complet *
            </label>
            <input
              type="text"
              value={contact.name}
              onChange={(e) => handleContactChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="Votre nom"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '6px' }}>
              Email *
            </label>
            <input
              type="email"
              value={contact.email}
              onChange={(e) => handleContactChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="votre@email.com"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '6px' }}>
              Téléphone
            </label>
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="06 12 34 56 78"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '6px' }}>
              Message
            </label>
            <textarea
              value={contact.message}
              onChange={(e) => handleContactChange('message', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                minHeight: '100px',
                fontFamily: 'inherit',
              }}
              placeholder="Parlez-moi de vos besoins..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !contact.name || !contact.email}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#72C15F',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submitting || !contact.name || !contact.email ? 'not-allowed' : 'pointer',
              opacity: submitting || !contact.name || !contact.email ? 0.7 : 1,
            }}
          >
            {submitting ? 'Confirmation en cours...' : 'Confirmer mon rendez-vous'}
          </button>
        </div>
      )}

      {step === 'confirmation' && (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#D1FAE5',
              borderRadius: '50%',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            ✓
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '8px' }}>
            Rendez-vous confirmé!
          </h2>

          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
            Un email de confirmation a été envoyé à {contact.email}
          </p>

          <div style={{ backgroundColor: '#F0FDF4', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #DCFCE7', textAlign: 'left' }}>
            <p style={{ fontSize: '14px', color: '#1A1A1A', marginBottom: '4px' }}>
              <strong>Date:</strong> {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
            <p style={{ fontSize: '14px', color: '#1A1A1A' }}>
              <strong>Heure:</strong> {selectedTime}
            </p>
          </div>

          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px' }}>
            À bientôt! Si vous avez besoin d'annuler ou de reprogrammer, contactez-nous avant 24h.
          </p>

          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#F3F4F6',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              color: '#1A1A1A',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Prendre un autre rendez-vous
          </button>
        </div>
      )}
    </div>
  )
}
