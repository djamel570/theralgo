'use client'

import { useState } from 'react'
import { Users, Zap, TrendingUp, Video } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import MetricsCard from '@/components/dashboard/MetricsCard'

interface Props {
  users: Record<string, unknown>[]
  campaigns: Record<string, unknown>[]
  leads: Record<string, unknown>[]
}

export default function AdminClient({ users, campaigns, leads }: Props) {
  const [tab, setTab] = useState<'users' | 'campaigns' | 'leads'>('users')

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const activeUsers = users.filter(u => {
    const subs = u.subscriptions as Record<string, unknown>[] | undefined
    return subs?.some(s => s.status === 'active')
  }).length

  return (
    <div className="space-y-6">
      {/* Targeting tool banner */}
      <div style={{ marginBottom: 24, padding: '1rem 1.25rem', background: '#5DB847', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: '.95rem', margin: 0 }}>Outil de ciblage algorithmique</h3>
          <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '.8rem', margin: '4px 0 0' }}>Générer des plans d'acquisition pour vos thérapeutes</p>
        </div>
        <a href="/admin/targeting" style={{ background: 'white', color: '#1A1A1A', padding: '.5rem 1.25rem', borderRadius: 999, fontWeight: 700, fontSize: '.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Ouvrir l'outil →
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard label="Thérapeutes inscrits" value={users.length} icon={Users} color="blue" />
        <MetricsCard label="Campagnes actives" value={activeCampaigns} icon={Zap} color="green" />
        <MetricsCard label="Leads totaux" value={leads.length} icon={TrendingUp} color="amber" />
        <MetricsCard label="Abonnés actifs" value={activeUsers} icon={Video} color="purple" />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['users', 'campaigns', 'leads'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {{ users: 'Utilisateurs', campaigns: 'Campagnes', leads: 'Leads' }[t]}
          </button>
        ))}
      </div>

      {/* Users */}
      {tab === 'users' && (
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-900">Tous les thérapeutes</h2></CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Nom', 'Spécialité', 'Ville', 'Prix', 'Abonnement'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-slate-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const subs = u.subscriptions as Record<string, unknown>[] | undefined
                    const subStatus = subs?.[0]?.status as string || 'inactive'
                    return (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{u.name as string || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{u.specialty as string || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{u.city as string || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{u.consultation_price ? `${u.consultation_price}€` : '—'}</td>
                        <td className="px-5 py-3">
                          <Badge variant={subStatus === 'active' ? 'active' : 'inactive'}>
                            {subStatus === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Aucun utilisateur</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Campaigns */}
      {tab === 'campaigns' && (
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-900">Toutes les campagnes</h2></CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Thérapeute', 'Spécialité', 'Ville', 'Budget', 'Statut', 'Lancée le', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-slate-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const profile = c.therapist_profiles as Record<string, unknown> | undefined
                    const status = c.status as string
                    return (
                      <tr key={c.id as string} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{profile?.name as string || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{profile?.specialty as string || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{profile?.city as string || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{c.budget as number}€</td>
                        <td className="px-5 py-3">
                          <Badge variant={
                            status === 'active' ? 'active' :
                            status === 'paused' ? 'paused' :
                            status === 'generating' ? 'generating' : 'pending'
                          }>
                            {status === 'active' ? 'Active' :
                             status === 'paused' ? 'En pause' :
                             status === 'generating' ? 'Génération' : 'En attente'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {c.launch_date ? new Date(c.launch_date as string).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <Button
                            size="sm"
                            variant={status === 'active' ? 'danger' : 'green'}
                            className="text-xs py-1"
                            onClick={async () => {
                              const action = status === 'active' ? 'pause' : 'activate'
                              try {
                                const res = await fetch('/api/admin/campaigns', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ campaignId: c.id, action }),
                                })
                                if (res.ok) window.location.reload()
                              } catch (err) {
                                console.error('Erreur:', err)
                              }
                            }}
                          >
                            {status === 'active' ? 'Mettre en pause' : 'Activer'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {campaigns.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Aucune campagne</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Leads */}
      {tab === 'leads' && (
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-900">Derniers leads</h2></CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Nom', 'Email', 'Statut', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-slate-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id as string} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{l.name as string || '—'}</td>
                      <td className="px-5 py-3 text-slate-500">{l.email as string || '—'}</td>
                      <td className="px-5 py-3">
                        <Badge variant={l.status === 'booked' ? 'active' : l.status === 'new' ? 'new' : 'pending'}>
                          {l.status as string}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {new Date(l.created_at as string).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Aucun lead</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
