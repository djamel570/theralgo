'use client'

import { useEffect, useCallback, useState } from 'react'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const GN = '#5DB847'   // green accent
const T = '#1A1A1A'    // text dark
const M = '#6B7280'    // muted
const C = '#F7F4EE'    // cream bg
const W = '#FFFFFF'    // white

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  created_at: string
  qualification_data?: {
    score?: number
    temperature?: 'hot' | 'warm' | 'cold'
  }
}

interface CampaignMetric {
  id: string
  impressions: number
  clicks: number
  leads: number
  appointments: number
  ctr: number
  cpl: number
  spend: number
  recorded_at: string
}

interface TargetingPlan {
  id: string
  name: string
  leads_count?: number
  cpl?: number
}

interface Props {
  campaign: Record<string, unknown> | null
  leads: Lead[]
  metricsHistory?: CampaignMetric[]
  targetingPlans?: TargetingPlan[]
}

const statusLabel: Record<string, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  booked: 'RDV pris',
  lost: 'Perdu',
}

const temperatureColors = {
  hot: GN,
  warm: '#F59E0B',
  cold: '#9CA3AF',
}

const temperatureLabel = {
  hot: 'Chaud',
  warm: 'Tiède',
  cold: 'Froid',
}

function OverviewCard({ label, value, trend, icon: Icon }: { label: string; value: string | number; trend?: number; icon?: React.ReactNode }) {
  return (
    <div style={{
      background: W,
      borderRadius: 20,
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,.05)',
      border: `1px solid rgba(0,0,0,.06)`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: M, fontWeight: 500 }}>{label}</span>
        {trend !== undefined && trend !== 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: trend > 0 ? GN : '#EF4444', fontWeight: 600 }}>
            {trend > 0 ? <TrendingUp style={{ width: 14, height: 14 }} /> : <TrendingDown style={{ width: 14, height: 14 }} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: T, margin: 0 }}>{value}</p>
    </div>
  )
}

function LeadScoreBadge({ score, temperature }: { score?: number; temperature?: string }) {
  if (!score || !temperature) return null

  const bgColor = temperatureColors[temperature as keyof typeof temperatureColors] || '#9CA3AF'
  const textColor = temperature === 'hot' ? W : (temperature === 'warm' ? T : M)

  return (
    <div style={{
      display: 'inline-block',
      background: bgColor,
      color: textColor,
      padding: '0.4rem 0.8rem',
      borderRadius: 999,
      fontSize: '0.8rem',
      fontWeight: 600,
    }}>
      {temperatureLabel[temperature as keyof typeof temperatureLabel]} ({score})
    </div>
  )
}

function ResultsClientContent({ campaign, leads, metricsHistory = [], targetingPlans = [] }: Props) {
  const [refreshing, setRefreshing] = useState(false)
  const [editingLead, setEditingLead] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const metrics = campaign?.campaign_metrics as CampaignMetric[] | undefined
  const latest = metrics?.[metrics.length - 1]

  // Prepare chart data from history
  const chartData = (metricsHistory || [])
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map(m => ({
      date: new Date(m.recorded_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      leads: m.leads,
      cpl: m.cpl,
    }))

  // Segment data for comparison
  const segmentData = (targetingPlans || []).map(plan => ({
    name: plan.name,
    leads: plan.leads_count || 0,
    cpl: plan.cpl || 0,
  }))

  // Calculate metrics
  const totalLeads = latest?.leads || leads.length
  const conversionRate = latest && latest.clicks > 0
    ? Math.round((totalLeads / latest.clicks) * 100)
    : 0
  const totalSpend = latest?.spend || 0
  const appointmentsBooked = latest?.appointments || 0

  // Calculate trend (simple: last vs previous)
  const previousMetric = metrics?.[metrics.length - 2]
  const leadsTrend = previousMetric
    ? Math.round(((totalLeads - previousMetric.leads) / Math.max(previousMetric.leads, 1)) * 100)
    : 0
  const cplTrend = previousMetric && previousMetric.cpl > 0
    ? Math.round(((latest?.cpl || 0 - previousMetric.cpl) / previousMetric.cpl) * 100)
    : 0

  const refreshMetrics = useCallback(async () => {
    if (!campaign || (campaign.status as string) !== 'active') return
    setRefreshing(true)
    try {
      const response = await fetch('/api/campaigns/monitor', { method: 'POST' })
      if (response.ok) {
        // Trigger re-render without page reload
        setRefreshTrigger(prev => prev + 1)
      } else {
        console.error('Failed to refresh metrics:', response.statusText)
      }
    } catch (err) {
      console.error('Error refreshing metrics:', err)
    } finally {
      setRefreshing(false)
    }
  }, [campaign])

  useEffect(() => {
    if ((campaign?.status as string) !== 'active') return
    const interval = setInterval(refreshMetrics, 60000)
    return () => clearInterval(interval)
  }, [campaign?.status, refreshMetrics])

  const handleStatusChange = useCallback(async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        setEditingLead(null)
        // Trigger re-render to update UI
        setRefreshTrigger(prev => prev + 1)
      } else {
        console.error('Failed to update lead status:', response.statusText)
      }
    } catch (err) {
      console.error('Failed to update lead status:', err)
    }
  }, [])

  // Used for refresh trigger tracking
  if (!campaign) {
    return (
      <div style={{ maxWidth: 800 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: T, marginBottom: '1.5rem' }}>Résultats</h1>
        <div style={{
          background: W,
          borderRadius: 20,
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,.05)',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: C,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={M} strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: T, marginBottom: '0.5rem' }}>Aucune campagne active</h2>
          <p style={{ fontSize: '0.9rem', color: M }}>Activez votre moteur depuis le tableau de bord pour voir vos résultats.</p>
        </div>
      </div>
    )
  }

  // Access refreshTrigger to ensure re-render happens
  const key = `results-${refreshTrigger}`

  return (
    <div style={{ maxWidth: 1200, space: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: T, margin: 0, marginBottom: '0.5rem' }}>Résultats de campagne</h1>
          <p style={{ fontSize: '0.95rem', color: M, margin: 0 }}>Performances de votre moteur d'acquisition</p>
        </div>
        {(campaign.status as string) === 'active' && (
          <Button size="sm" variant="ghost" onClick={refreshMetrics} loading={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw style={{ width: 16, height: 16 }} />
            Actualiser
          </Button>
        )}
      </div>

      {/* Section 1: Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: '2rem' }}>
        <OverviewCard label="Leads générés" value={totalLeads} trend={leadsTrend} />
        <OverviewCard label="Coût par lead" value={`${(latest?.cpl || 0).toFixed(2)}€`} trend={cplTrend} />
        <OverviewCard label="Dépense totale" value={`${totalSpend.toFixed(2)}€`} />
        <OverviewCard label="Taux de conversion" value={`${conversionRate}%`} />
        <OverviewCard label="RDV réservés" value={appointmentsBooked} />
      </div>

      {/* Section 2: Performance Chart */}
      {chartData.length > 0 && (
        <div style={{
          background: W,
          borderRadius: 20,
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,.05)',
          border: `1px solid rgba(0,0,0,.06)`,
        }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: T, margin: '0 0 1.5rem 0' }}>Évolution des performances (30 derniers jours)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: M }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: M }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: M }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid rgba(0,0,0,.1)`, fontSize: 12, background: W }} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="leads"
                stroke={GN}
                strokeWidth={2.5}
                dot={false}
                name="Leads"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cpl"
                stroke={T}
                strokeWidth={2}
                dot={false}
                name="CPL (€)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Section 3: Segment Comparison */}
      {segmentData.length > 0 && (
        <div style={{
          background: W,
          borderRadius: 20,
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,.05)',
          border: `1px solid rgba(0,0,0,.06)`,
        }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: T, margin: '0 0 1.5rem 0' }}>Comparaison par segment</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={segmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: M }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: M }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: M }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid rgba(0,0,0,.1)`, fontSize: 12, background: W }} />
              <Legend />
              <Bar yAxisId="left" dataKey="leads" fill={GN} name="Leads" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="right" dataKey="cpl" fill={T} name="CPL (€)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Section 4: Leads Table */}
      <div style={{
        background: W,
        borderRadius: 20,
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,.05)',
        border: `1px solid rgba(0,0,0,.06)`,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1.5rem', borderBottom: `1px solid rgba(0,0,0,.06)` }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: T, margin: 0 }}>Leads reçus</h2>
        </div>
        {leads.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: M, fontSize: '0.95rem' }}>
            Les leads apparaîtront ici dès que votre campagne sera active.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.95rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid rgba(0,0,0,.06)`, background: C }}>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: M, fontWeight: 500, fontSize: '0.85rem' }}>Nom</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: M, fontWeight: 500, fontSize: '0.85rem' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: M, fontWeight: 500, fontSize: '0.85rem' }}>Téléphone</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: M, fontWeight: 500, fontSize: '0.85rem' }}>Score</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: M, fontWeight: 500, fontSize: '0.85rem' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: M, fontWeight: 500, fontSize: '0.85rem' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: `1px solid rgba(0,0,0,.03)`, ':hover': { background: C } }}>
                    <td style={{ padding: '1rem 1.5rem', color: T, fontWeight: 500 }}>{lead.name || '—'}</td>
                    <td style={{ padding: '1rem 1.5rem', color: M, fontSize: '0.9rem' }}>{lead.email || '—'}</td>
                    <td style={{ padding: '1rem 1.5rem', color: M, fontSize: '0.9rem' }}>{lead.phone || '—'}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <LeadScoreBadge
                        score={lead.qualification_data?.score}
                        temperature={lead.qualification_data?.temperature}
                      />
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: M, fontSize: '0.9rem' }}>
                      {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {editingLead === lead.id ? (
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          onBlur={() => {
                            if (newStatus && newStatus !== lead.status) {
                              handleStatusChange(lead.id, newStatus)
                            } else {
                              setEditingLead(null)
                            }
                          }}
                          autoFocus
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 999,
                            border: `1px solid ${GN}`,
                            background: 'transparent',
                            color: T,
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="">Sélectionner...</option>
                          {Object.entries(statusLabel).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingLead(lead.id)
                            setNewStatus(lead.status)
                          }}
                          style={{
                            display: 'inline-block',
                            background: lead.status === 'booked' ? GN : (lead.status === 'contacted' ? '#F59E0B' : (lead.status === 'new' ? '#E5E7EB' : '#D1D5DB')),
                            color: lead.status === 'booked' ? W : T,
                            padding: '0.4rem 0.8rem',
                            borderRadius: 999,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                        >
                          {statusLabel[lead.status] || lead.status}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 5: Monthly Summary */}
      {latest && (
        <div style={{
          background: `linear-gradient(135deg, ${GN} 0%, rgba(93, 184, 71, 0.9) 100%)`,
          borderRadius: 20,
          padding: '2rem',
          color: W,
          marginBottom: '2rem',
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.75rem 0' }}>Résumé du mois</h3>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            Ce mois-ci, votre campagne a généré <strong>{totalLeads} leads qualifiés</strong> pour un coût moyen de <strong>{(latest.cpl || 0).toFixed(2)}€ par lead</strong>. Vous avez dépensé un total de <strong>{totalSpend.toFixed(2)}€</strong> avec un taux de conversion de <strong>{conversionRate}%</strong>. {appointmentsBooked > 0 && `${appointmentsBooked} rendez-vous ont déjà été réservés.`}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ResultsClient(props: Props) {
  return (
    <ErrorBoundary>
      <ResultsClientContent {...props} />
    </ErrorBoundary>
  )
}
