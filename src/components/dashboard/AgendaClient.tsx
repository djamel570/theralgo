'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, User, CheckCircle, AlertCircle, XCircle, Calendar, RefreshCw } from 'lucide-react'

const GN = '#8ED462'
const T  = '#1A1A1A'
const M  = '#6B7280'
const C  = '#F7F4EE'
const W  = '#FFFFFF'
const LV = '#C4B5FD'
const YL = '#FBD24D'
const RD = '#FF6B6B'

type Status = 'confirmé' | 'en_attente' | 'annulé'
interface Appointment {
  id: string
  patient: string
  date: string   // YYYY-MM-DD
  time: string   // HH:mm
  type: 'séance' | 'bilan' | 'suivi'
  duration: number // minutes
  status: Status
  notes?: string
}

/* ── Mock data — current month ────────────────────────── */
function getMockAppointments(): Appointment[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return [
    { id: '1', patient: 'Marie Lecomte',   date: `${y}-${m}-03`, time: '09:00', type: 'séance',  duration: 60,  status: 'confirmé',   notes: 'Suivi stress chronique' },
    { id: '2', patient: 'Thomas Renard',   date: `${y}-${m}-07`, time: '11:00', type: 'bilan',   duration: 90,  status: 'confirmé' },
    { id: '3', patient: 'Sophie Vidal',    date: `${y}-${m}-12`, time: '14:30', type: 'suivi',   duration: 45,  status: 'en_attente' },
    { id: '4', patient: 'Karim Bouali',    date: `${y}-${m}-18`, time: '10:00', type: 'séance',  duration: 60,  status: 'confirmé',   notes: 'Gestion de l\'anxiété' },
    { id: '5', patient: 'Julie Martins',   date: `${y}-${m}-21`, time: '16:00', type: 'bilan',   duration: 75,  status: 'en_attente' },
    { id: '6', patient: 'Paul Desprez',    date: `${y}-${m}-25`, time: '09:30', type: 'séance',  duration: 60,  status: 'annulé' },
    { id: '7', patient: 'Nadia Okafor',    date: `${y}-${m}-28`, time: '15:00', type: 'suivi',   duration: 45,  status: 'confirmé' },
  ]
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  confirmé:   { label: 'Confirmé',   color: '#2D6B1A', bg: `${GN}18`, icon: CheckCircle },
  en_attente: { label: 'En attente', color: '#856A00', bg: `${YL}28`, icon: AlertCircle },
  annulé:     { label: 'Annulé',     color: '#C0392B', bg: `${RD}18`, icon: XCircle },
}

const TYPE_COLOR: Record<string, string> = {
  séance: GN,
  bilan:  LV,
  suivi:  YL,
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

/* ── Calendar grid ─────────────────────────────────────── */
function CalendarGrid({ year, month, appointments, selected, onSelect }: {
  year: number; month: number; appointments: Appointment[]
  selected: string | null; onSelect: (d: string) => void
}) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7   // Monday-first
  const totalDays = lastDay.getDate()
  const today = new Date()

  const apptByDay: Record<string, Appointment[]> = {}
  appointments.forEach(a => {
    if (!apptByDay[a.date]) apptByDay[a.date] = []
    apptByDay[a.date].push(a)
  })

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
        {DAYS_FR.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '.65rem', fontWeight: 700, color: M, padding: '.4rem 0', letterSpacing: '.05em' }}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayAppts = apptByDay[dateStr] || []
          const isToday   = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
          const isSel     = selected === dateStr
          const hasAppts  = dayAppts.length > 0
          return (
            <div key={day} onClick={() => onSelect(dateStr)} style={{
              minHeight: 52, borderRadius: 12, padding: '6px 4px',
              background: isSel ? T : isToday ? `${GN}18` : hasAppts ? W : C,
              border: `1.5px solid ${isSel ? T : isToday ? GN : hasAppts ? 'rgba(0,0,0,.08)' : 'transparent'}`,
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              transition: 'all .15s',
            }}>
              <span style={{ fontSize: '.8rem', fontWeight: isToday || isSel ? 800 : 500, color: isSel ? 'white' : isToday ? '#2D6B1A' : T, lineHeight: 1 }}>{day}</span>
              {dayAppts.length > 0 && (
                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {dayAppts.slice(0, 3).map(a => (
                    <div key={a.id} style={{ width: 6, height: 6, borderRadius: '50%', background: isSel ? 'white' : TYPE_COLOR[a.type] || GN }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Appointment card ──────────────────────────────────── */
function ApptCard({ appt, compact }: { appt: Appointment; compact?: boolean }) {
  const sc = STATUS_CONFIG[appt.status]
  const Icon = sc.icon
  return (
    <div style={{
      background: W, borderRadius: compact ? 16 : 20,
      border: '1px solid rgba(0,0,0,.07)',
      padding: compact ? '1rem 1.1rem' : '1.25rem 1.4rem',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 99, background: TYPE_COLOR[appt.type] || GN, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <p style={{ fontWeight: 700, fontSize: compact ? '.84rem' : '.9rem', color: T }}>{appt.patient}</p>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.65rem', fontWeight: 700, color: sc.color, background: sc.bg, padding: '.18rem .55rem', borderRadius: 999, flexShrink: 0 }}>
            <Icon size={10} /> {sc.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.72rem', color: M }}>
            <Clock size={11} /> {appt.time}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.72rem', color: M }}>
            <User size={11} /> {appt.duration} min
          </span>
          <span style={{ fontSize: '.68rem', fontWeight: 700, color: TYPE_COLOR[appt.type], background: `${TYPE_COLOR[appt.type]}18`, padding: '.15rem .5rem', borderRadius: 99 }}>{appt.type}</span>
        </div>
        {appt.notes && <p style={{ fontSize: '.72rem', color: M, marginTop: 5, fontStyle: 'italic' }}>{appt.notes}</p>}
      </div>
    </div>
  )
}

/* ── Integration button ─────────────────────────────────── */
function IntegrationBtn({ name, icon, onConnect }: { name: string; icon: React.ReactNode; onConnect: () => void }) {
  return (
    <button onClick={onConnect} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '.875rem 1.25rem', borderRadius: 16,
      background: W, border: '1.5px solid rgba(0,0,0,.1)',
      cursor: 'pointer', width: '100%', textAlign: 'left' as const,
      transition: 'all .2s', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = GN; (e.currentTarget as HTMLElement).style.background = `${GN}06` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,.1)'; (e.currentTarget as HTMLElement).style.background = W }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: C, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontWeight: 600, fontSize: '.86rem', color: T }}>{name}</span>
      <span style={{ fontSize: '.72rem', fontWeight: 700, color: GN }}>Connecter →</span>
    </button>
  )
}

/* ── Main ──────────────────────────────────────────────── */
export default function AgendaClient() {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)
  const [toast,    setToast]    = useState(false)
  const appointments = getMockAppointments()

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else { setMonth(m => m - 1) } }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else { setMonth(m => m + 1) } }

  const selectedAppts = selected
    ? appointments.filter(a => a.date === selected)
    : appointments.filter(a => a.date >= today.toISOString().slice(0, 10)).slice(0, 5)

  const showToast = () => {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  const monthStr = String(month + 1).padStart(2, '0')
  const monthAppts = appointments.filter(a => a.date.startsWith(`${year}-${monthStr}`))

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: T, color: 'white', padding: '.75rem 1.5rem', borderRadius: 14, fontSize: '.85rem', fontWeight: 600, zIndex: 1000, boxShadow: '0 8px 30px rgba(0,0,0,.2)', whiteSpace: 'nowrap' }}>
          🔗 Intégration disponible prochainement
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: T, letterSpacing: '-.04em', lineHeight: 1 }}>Mon Agenda</h1>
          <p style={{ color: M, fontSize: '.86rem', marginTop: 4 }}>{monthAppts.length} rendez-vous ce mois</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '.6rem 1.1rem', borderRadius: 999, border: '1px solid rgba(0,0,0,.1)', background: W, fontSize: '.78rem', fontWeight: 600, color: T, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Synchroniser
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 12, marginBottom: '1.75rem' }}>
        {[
          { label: 'Ce mois', value: monthAppts.length, color: GN },
          { label: 'Confirmés', value: monthAppts.filter(a => a.status === 'confirmé').length, color: GN },
          { label: 'En attente', value: monthAppts.filter(a => a.status === 'en_attente').length, color: YL },
          { label: 'Annulés', value: monthAppts.filter(a => a.status === 'annulé').length, color: RD },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: W, borderRadius: 18, padding: '1.1rem', border: '1px solid rgba(0,0,0,.07)', textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: '1.6rem', color: T, letterSpacing: '-.04em', lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: '.7rem', color: M, marginTop: 4 }}>{label}</p>
            <div style={{ width: 20, height: 3, borderRadius: 99, background: color, margin: '6px auto 0' }} />
          </div>
        ))}
      </div>

      {/* Calendar + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>

        {/* Calendar card */}
        <div style={{ background: W, borderRadius: 24, border: '1px solid rgba(0,0,0,.07)', boxShadow: '0 2px 12px rgba(0,0,0,.04)', padding: '1.5rem', overflow: 'hidden' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(0,0,0,.1)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: T, letterSpacing: '-.02em' }}>
              {MONTHS_FR[month]} {year}
            </h2>
            <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(0,0,0,.1)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={16} />
            </button>
          </div>
          <CalendarGrid year={year} month={month} appointments={appointments} selected={selected} onSelect={d => setSelected(sel => sel === d ? null : d)} />
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Appointments list */}
          <div style={{ background: W, borderRadius: 24, border: '1px solid rgba(0,0,0,.07)', boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.4rem', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '.95rem', color: T }}>
                {selected ? `Rendez-vous du ${selected.split('-').reverse().join('/')}` : 'Prochains rendez-vous'}
              </h3>
              {selected && selectedAppts.length === 0 && (
                <p style={{ fontSize: '.78rem', color: M, marginTop: 4 }}>Aucun RDV ce jour</p>
              )}
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {selectedAppts.length === 0 && !selected && (
                <p style={{ fontSize: '.82rem', color: M, padding: '.5rem', textAlign: 'center' }}>Aucun prochain rendez-vous</p>
              )}
              {selectedAppts.map(a => <ApptCard key={a.id} appt={a} compact />)}
            </div>
          </div>

          {/* Connect agendas */}
          <div style={{ background: W, borderRadius: 24, border: '1px solid rgba(0,0,0,.07)', boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.4rem', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '.95rem', color: T }}>Connecter mon agenda</h3>
              <p style={{ fontSize: '.75rem', color: M, marginTop: 3 }}>Synchronisez vos RDV Theralgo avec votre agenda habituel</p>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <IntegrationBtn name="Google Calendar" onConnect={showToast} icon={
                <svg width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="#4285F4"/><path d="M3 9h18" stroke="white" strokeWidth="1.5"/><path d="M8 4v5M16 4v5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              } />
              <IntegrationBtn name="Apple Calendar" onConnect={showToast} icon={
                <svg width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="#FF3B30"/><path d="M3 9h18" stroke="white" strokeWidth="1.5"/><text x="12" y="18" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">{new Date().getDate()}</text></svg>
              } />
              <IntegrationBtn name="Outlook / Office 365" onConnect={showToast} icon={
                <svg width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="#0078D4"/><path d="M3 9h18" stroke="white" strokeWidth="1.5"/><text x="12" y="18" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">O</text></svg>
              } />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: stack calendar above list */}
      <style>{`
        @media (max-width: 768px) {
          .agenda-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
