'use client'

/**
 * Availability Editor Component
 * Configure weekly schedule, slot duration, buffer time, and blocked dates
 */

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface DaySchedule {
  [day: string]: { start: string; end: string; slotDuration: number }[]
}

interface AvailabilityEditorProps {
  onSave?: (data: { weeklySchedule: DaySchedule; bufferMinutes: number; timezone: string; blockedDates: string[] }) => void
  onCancel?: () => void
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY_LABELS: { [key: string]: string } = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
}

export default function AvailabilityEditor({ onSave, onCancel }: AvailabilityEditorProps) {
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule>({
    monday: [{ start: '08:00', end: '18:00', slotDuration: 60 }],
    tuesday: [{ start: '08:00', end: '18:00', slotDuration: 60 }],
    wednesday: [{ start: '08:00', end: '18:00', slotDuration: 60 }],
    thursday: [{ start: '08:00', end: '18:00', slotDuration: 60 }],
    friday: [{ start: '08:00', end: '18:00', slotDuration: 60 }],
    saturday: [],
  })
  const [slotDuration, setSlotDuration] = useState(60)
  const [bufferMinutes, setBufferMinutes] = useState(15)
  const [timezone, setTimezone] = useState('Europe/Paris')
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load availability on mount
  useEffect(() => {
    loadAvailability()
  }, [])

  const loadAvailability = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/bookings/availability?therapistUserId=current')
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setWeeklySchedule(data.weeklySchedule || weeklySchedule)
          setBufferMinutes(data.bufferMinutes || 15)
          setTimezone(data.timezone || 'Europe/Paris')
          setBlockedDates(data.blockedDates || [])
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la disponibilité', error)
    } finally {
      setLoading(false)
    }
  }

  const updateDaySchedule = (day: string, index: number, field: string, value: string) => {
    setWeeklySchedule((prev) => {
      const updated = { ...prev }
      if (updated[day] && updated[day][index]) {
        updated[day][index] = { ...updated[day][index], [field]: value }
      }
      return updated
    })
  }

  const toggleDay = (day: string) => {
    setWeeklySchedule((prev) => {
      const updated = { ...prev }
      if (updated[day] && updated[day].length > 0) {
        updated[day] = []
      } else {
        updated[day] = [{ start: '08:00', end: '18:00', slotDuration }]
      }
      return updated
    })
  }

  const addDayBlock = (day: string) => {
    setWeeklySchedule((prev) => {
      const updated = { ...prev }
      if (!updated[day]) {
        updated[day] = []
      }
      updated[day] = [...updated[day], { start: '12:00', end: '14:00', slotDuration }]
      return updated
    })
  }

  const removeDayBlock = (day: string, index: number) => {
    setWeeklySchedule((prev) => {
      const updated = { ...prev }
      updated[day] = updated[day].filter((_, i) => i !== index)
      return updated
    })
  }

  const addBlockedDate = (dateStr: string) => {
    if (dateStr && !blockedDates.includes(dateStr)) {
      setBlockedDates([...blockedDates, dateStr])
    }
  }

  const removeBlockedDate = (dateStr: string) => {
    setBlockedDates(blockedDates.filter((d) => d !== dateStr))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/bookings/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklySchedule,
          bufferMinutes,
          timezone,
          blockedDates,
        }),
      })

      if (response.ok) {
        if (onSave) {
          onSave({ weeklySchedule, bufferMinutes, timezone, blockedDates })
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
        Chargement de votre disponibilité...
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#F7F4EE', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '24px' }}>
        Configurer mes disponibilités
      </h2>

      {/* Settings */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '16px' }}>Paramètres</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Durée des créneaux
            </label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Tampon entre les RDV
            </label>
            <select
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value={0}>Aucun</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Fuseau horaire
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="Europe/Berlin">Europe/Berlin (UTC+1)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '16px' }}>Horaires hebdomadaires</h3>

        {DAYS.map((day) => (
          <div key={day} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                checked={weeklySchedule[day]?.length > 0}
                onChange={() => toggleDay(day)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A', flex: 1 }}>
                {DAY_LABELS[day]}
              </label>
            </div>

            {weeklySchedule[day]?.length > 0 && (
              <div style={{ marginLeft: '30px' }}>
                {weeklySchedule[day].map((block, index) => (
                  <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                    <input
                      type="time"
                      value={block.start}
                      onChange={(e) => updateDaySchedule(day, index, 'start', e.target.value)}
                      style={{
                        padding: '8px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                    <span style={{ color: '#6B7280' }}>à</span>
                    <input
                      type="time"
                      value={block.end}
                      onChange={(e) => updateDaySchedule(day, index, 'end', e.target.value)}
                      style={{
                        padding: '8px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                    {index > 0 && (
                      <button
                        onClick={() => removeDayBlock(day, index)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#FEE2E2',
                          border: '1px solid #FECACA',
                          borderRadius: '6px',
                          color: '#DC2626',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                        }}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => addDayBlock(day)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#DBEAFE',
                    border: '1px solid #BFDBFE',
                    borderRadius: '6px',
                    color: '#1D4ED8',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                >
                  + Ajouter un créneau
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Blocked Dates */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #E5E7EB' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '16px' }}>Dates indisponibles</h3>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input
            type="date"
            id="blockedDateInput"
            style={{
              padding: '8px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
              flex: 1,
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('blockedDateInput') as HTMLInputElement
              if (input && input.value) {
                addBlockedDate(input.value)
                input.value = ''
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#72C15F',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Ajouter
          </button>
        </div>

        {blockedDates.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {blockedDates.map((date) => (
              <div
                key={date}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#FEE2E2',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <span>{format(new Date(date), 'dd/MM/yyyy')}</span>
                <button
                  onClick={() => removeBlockedDate(date)}
                  style={{
                    padding: '0 4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#DC2626',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            color: '#1A1A1A',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 20px',
            backgroundColor: '#72C15F',
            border: 'none',
            borderRadius: '6px',
            color: '#FFFFFF',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
