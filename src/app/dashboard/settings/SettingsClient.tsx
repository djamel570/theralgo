'use client'

import { useState } from 'react'
import { CheckCircle, CreditCard, AlertTriangle } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase'

interface Props {
  user: { id: string; email: string; name?: string }
  subscription: Record<string, unknown> | null
}

export default function SettingsClient({ user, subscription }: Props) {
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwSaved, setPwSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const supabase = createClient()

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.next !== pw.confirm) { setPwError('Les mots de passe ne correspondent pas.'); return }
    if (pw.next.length < 8) { setPwError('Minimum 8 caractères.'); return }
    setLoading(true)
    setPwError('')
    const { error } = await supabase.auth.updateUser({ password: pw.next })
    setLoading(false)
    if (error) { setPwError(error.message) }
    else { setPwSaved(true); setPw({ current: '', next: '', confirm: '' }) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-500 mt-1">Gérez votre compte et votre abonnement.</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader><h2 className="font-semibold text-slate-900">Informations du compte</h2></CardHeader>
        <CardBody className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-1">Nom</p>
              <p className="font-medium text-slate-800">{user.name || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Email</p>
              <p className="font-medium text-slate-800">{user.email}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader><h2 className="font-semibold text-slate-900">Changer le mot de passe</h2></CardHeader>
        <CardBody>
          <form onSubmit={changePassword} className="space-y-4">
            <Input
              label="Nouveau mot de passe"
              type="password"
              placeholder="••••••••"
              value={pw.next}
              onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              placeholder="••••••••"
              value={pw.confirm}
              onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
            />
            {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
            {pwSaved && (
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <CheckCircle className="w-4 h-4" />Mot de passe mis à jour !
              </div>
            )}
            <Button type="submit" loading={loading} size="sm">Mettre à jour</Button>
          </form>
        </CardBody>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Abonnement & Facturation</h2>
            <Badge variant={subscription?.status === 'active' ? 'active' : 'inactive'}>
              {subscription?.status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {subscription?.status === 'active' ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Plan</p>
                  <p className="font-medium">Starter — 97€/mois</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Prochain renouvellement</p>
                  <p className="font-medium">
                    {subscription.current_period_end
                      ? new Date(subscription.current_period_end as string).toLocaleDateString('fr-FR')
                      : '—'}
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                <CreditCard className="w-4 h-4" />
                Gérer la facturation
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-500 text-sm mb-4">Aucun abonnement actif.</p>
              <Button size="sm" variant="green">
                Activer mon abonnement — 97€/mois
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-100">
        <CardHeader className="border-red-100">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="font-semibold">Zone de danger</h2>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-slate-500 text-sm mb-4">
            La suppression de votre compte est irréversible. Toutes vos données seront effacées.
          </p>
          <Button variant="danger" size="sm">
            Supprimer mon compte
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
