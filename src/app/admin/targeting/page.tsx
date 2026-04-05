import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import TargetingClient from './TargetingClient'

const ADMIN_EMAILS = ['admin@theralgo.fr', process.env.ADMIN_EMAIL || '']

export default async function TargetingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard')
  }

  const supabaseAdmin = createServiceSupabaseClient()

  const [profilesRes, plansRes] = await Promise.all([
    supabaseAdmin.from('therapist_profiles').select('*').order('name'),
    supabaseAdmin.from('targeting_plans').select('*').eq('plan_type', 'complete').order('created_at', { ascending: false }).limit(20),
  ])

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4EE', padding: '2rem 1.5rem', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <a href="/admin" style={{ fontSize: '.9rem', color: '#6B7280', textDecoration: 'none', marginBottom: '.5rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </a>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1A1A1A', margin: '.5rem 0 0', lineHeight: 1.2 }}>
            Outil de ciblage algorithmique
          </h1>
          <p style={{ fontSize: '.95rem', color: '#6B7280', margin: '.5rem 0 0' }}>
            Générez des plans d'acquisition pour vos thérapeutes
          </p>
        </div>

        <TargetingClient profiles={profilesRes.data || []} existingPlans={plansRes.data || []} />
      </div>
    </div>
  )
}
