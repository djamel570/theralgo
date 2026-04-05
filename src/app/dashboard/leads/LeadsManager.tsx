'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Search, Calendar, Phone, Mail, MessageCircle, AlertCircle } from 'lucide-react'

/* ── Design tokens ──────────────────────────────────────── */
const G = '#72C15F'
const GN = '#5DB847'
const T = '#1A1A1A'
const M = '#6B7280'
const C = '#F7F4EE'
const W = '#FFFFFF'

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  date: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  qualification_score: number
  qualification_answers?: Record<string, string>
  notes?: string
}

interface LeadsManagerProps {
  initialLeads?: Lead[]
  userId: string
}

export default function LeadsManager({ initialLeads = [], userId }: LeadsManagerProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(initialLeads)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [notes, setNotes] = useState('')

  // Fetch leads
  const fetchLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/dashboard/leads?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    // Apply client-side filtering
    let filtered = leads

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term)
      )
    }

    setFilteredLeads(filtered)
  }, [leads, statusFilter, searchTerm])

  // Update lead status
  const updateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const res = await fetch(`/api/dashboard/leads`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status: newStatus })
      })

      if (res.ok) {
        setLeads(leads.map(lead =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ))
        if (selectedLead?.id === leadId) {
          setSelectedLead({ ...selectedLead, status: newStatus })
        }
      }
    } catch (error) {
      console.error('Failed to update lead:', error)
    }
  }

  // Update lead notes
  const updateLeadNotes = async (leadId: string) => {
    try {
      const res = await fetch(`/api/dashboard/leads`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, notes })
      })

      if (res.ok) {
        setLeads(leads.map(lead =>
          lead.id === leadId ? { ...lead, notes } : lead
        ))
      }
    } catch (error) {
      console.error('Failed to update notes:', error)
    }
  }

  const statusColors: Record<Lead['status'], string> = {
    new: '#93C5FD',
    contacted: '#FCD34D',
    qualified: GN,
    converted: G,
    lost: '#F87171'
  }

  const statusLabels: Record<Lead['status'], string> = {
    new: 'Nouveau',
    contacted: 'Contacté',
    qualified: 'Qualifié',
    converted: 'Converti',
    lost: 'Perdu'
  }

  const totalLeads = leads.length
  const convertedLeads = leads.filter(l => l.status === 'converted').length
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0
  const avgScore = totalLeads > 0 ? Math.round(leads.reduce((sum, l) => sum + l.qualification_score, 0) / totalLeads) : 0

  const openDrawer = (lead: Lead) => {
    setSelectedLead(lead)
    setNotes(lead.notes || '')
    setShowDrawer(true)
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: T, marginBottom: '.5rem' }}>
          Mes Leads
        </h1>
        <p style={{ fontSize: '.95rem', color: M }}>
          Gérez vos leads et suivez votre conversion en temps réel
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: W, padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(0,0,0,.07)` }}>
          <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Total de leads</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: T }}>{totalLeads}</p>
        </div>
        <div style={{ background: W, padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(0,0,0,.07)` }}>
          <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Taux de conversion</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: GN }}>{conversionRate}%</p>
        </div>
        <div style={{ background: W, padding: '1.5rem', borderRadius: '12px', border: `1px solid rgba(0,0,0,.07)` }}>
          <p style={{ fontSize: '.85rem', color: M, marginBottom: '.5rem' }}>Score de qualification moyen</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: T }}>{avgScore}/100</p>
        </div>
      </div>

      {/* Filters Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Status Filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '.75rem 1rem',
              paddingRight: '2.5rem',
              borderRadius: '8px',
              border: `1px solid rgba(0,0,0,.12)`,
              background: W,
              fontSize: '.9rem',
              color: T,
              fontWeight: 500,
              cursor: 'pointer',
              appearance: 'none'
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="contacted">Contacté</option>
            <option value="qualified">Qualifié</option>
            <option value="converted">Converti</option>
            <option value="lost">Perdu</option>
          </select>
          <ChevronDown style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
            pointerEvents: 'none',
            color: M
          }} />
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 18,
            height: 18,
            color: M
          }} />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '.75rem 1rem .75rem 2.75rem',
              borderRadius: '8px',
              border: `1px solid rgba(0,0,0,.12)`,
              background: W,
              fontSize: '.9rem',
              color: T
            }}
          />
        </div>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div style={{
          background: W,
          padding: '3rem 2rem',
          borderRadius: '12px',
          textAlign: 'center',
          color: M
        }}>
          Chargement des leads...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div style={{
          background: W,
          padding: '3rem 2rem',
          borderRadius: '12px',
          textAlign: 'center',
          color: M,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <AlertCircle style={{ width: 32, height: 32, opacity: 0.5 }} />
          <p>Aucun lead trouvé</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: W,
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ borderBottom: `1px solid rgba(0,0,0,.07)`, background: C }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '.85rem', color: M }}>Nom</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '.85rem', color: M }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '.85rem', color: M }}>Téléphone</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '.85rem', color: M }}>Source</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '.85rem', color: M }}>Statut</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '.85rem', color: M }}>Score</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '.85rem', color: M }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, idx) => (
                <tr key={lead.id} style={{
                  borderBottom: `1px solid rgba(0,0,0,.07)`,
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = W }}
                >
                  <td style={{ padding: '1rem', fontSize: '.9rem', fontWeight: 600, color: T }}>{lead.name}</td>
                  <td style={{ padding: '1rem', fontSize: '.9rem', color: M }}>{lead.email}</td>
                  <td style={{ padding: '1rem', fontSize: '.9rem', color: M }}>{lead.phone || '-'}</td>
                  <td style={{ padding: '1rem', fontSize: '.85rem', color: M }}>{lead.source}</td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => updateLeadStatus(lead.id, lead.status)}
                      style={{
                        padding: '.4rem .8rem',
                        borderRadius: '20px',
                        border: 'none',
                        background: statusColors[lead.status],
                        color: T,
                        fontSize: '.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                    >
                      {statusLabels[lead.status]}
                    </button>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '.9rem', fontWeight: 600, color: T }}>
                    {lead.qualification_score}/100
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => openDrawer(lead)}
                      style={{
                        padding: '.4rem .8rem',
                        borderRadius: '6px',
                        border: `1px solid ${GN}`,
                        background: 'transparent',
                        color: GN,
                        fontSize: '.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = GN;
                        (e.currentTarget as HTMLElement).style.color = W
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = GN
                      }}
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail Drawer */}
      {showDrawer && selectedLead && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          display: 'flex',
          background: 'rgba(0,0,0,.25)',
          backdropFilter: 'blur(4px)'
        }}
          onClick={() => setShowDrawer(false)}
        >
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '450px',
            background: W,
            boxShadow: '-4px 0 24px rgba(0,0,0,.12)',
            overflow: 'auto',
            animation: 'slideIn 0.3s ease-out'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid rgba(0,0,0,.07)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: T }}>Détails du lead</h2>
              <button
                onClick={() => setShowDrawer(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: M
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              {/* Lead Info */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: T, marginBottom: '1rem' }}>
                  {selectedLead.name}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Mail style={{ width: 18, height: 18, color: M }} />
                    <a href={`mailto:${selectedLead.email}`} style={{
                      color: GN,
                      textDecoration: 'none',
                      fontSize: '.9rem'
                    }}>
                      {selectedLead.email}
                    </a>
                  </div>
                  {selectedLead.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Phone style={{ width: 18, height: 18, color: M }} />
                      <a href={`tel:${selectedLead.phone}`} style={{
                        color: GN,
                        textDecoration: 'none',
                        fontSize: '.9rem'
                      }}>
                        {selectedLead.phone}
                      </a>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Calendar style={{ width: 18, height: 18, color: M }} />
                    <span style={{ fontSize: '.9rem', color: M }}>
                      {new Date(selectedLead.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '.75rem',
                marginBottom: '2rem'
              }}>
                <a href={`tel:${selectedLead.phone}`} style={{
                  padding: '.75rem',
                  borderRadius: '8px',
                  border: `1px solid ${GN}`,
                  background: GN,
                  color: W,
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontSize: '.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  Appeler
                </a>
                <a href={`mailto:${selectedLead.email}`} style={{
                  padding: '.75rem',
                  borderRadius: '8px',
                  border: `1px solid ${G}`,
                  background: G,
                  color: W,
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontSize: '.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  Email
                </a>
              </div>

              {/* Status Update */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: M, marginBottom: '.5rem' }}>
                  Statut
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value as Lead['status'])}
                    style={{
                      width: '100%',
                      padding: '.75rem 1rem',
                      paddingRight: '2.5rem',
                      borderRadius: '8px',
                      border: `1px solid rgba(0,0,0,.12)`,
                      background: W,
                      fontSize: '.9rem',
                      color: T,
                      fontWeight: 500,
                      cursor: 'pointer',
                      appearance: 'none'
                    }}
                  >
                    <option value="new">Nouveau</option>
                    <option value="contacted">Contacté</option>
                    <option value="qualified">Qualifié</option>
                    <option value="converted">Converti</option>
                    <option value="lost">Perdu</option>
                  </select>
                  <ChevronDown style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 16,
                    height: 16,
                    pointerEvents: 'none',
                    color: M
                  }} />
                </div>
              </div>

              {/* Score */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: M, marginBottom: '.5rem' }}>
                  Score de qualification
                </label>
                <div style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,.1)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${selectedLead.qualification_score}%`,
                    height: '100%',
                    background: GN,
                    transition: 'width 0.3s'
                  }} />
                </div>
                <p style={{ fontSize: '.8rem', color: M, marginTop: '.5rem' }}>
                  {selectedLead.qualification_score}/100
                </p>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: M, marginBottom: '.5rem' }}>
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => updateLeadNotes(selectedLead.id)}
                  placeholder="Ajouter des notes..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '.75rem 1rem',
                    borderRadius: '8px',
                    border: `1px solid rgba(0,0,0,.12)`,
                    background: W,
                    fontSize: '.9rem',
                    color: T,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
