import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import AdminClient from './AdminClient'

// Simple admin check - in production, use roles/claims
const ADMIN_EMAILS = ['admin@theralgo.fr', process.env.ADMIN_EMAIL || '']

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard')
  }

  const supabaseAdmin = createServiceSupabaseClient()

  const [usersRes, campaignsRes, leadsRes] = await Promise.all([
    supabaseAdmin.from('therapist_profiles').select('*, subscriptions(status)'),
    supabaseAdmin.from('campaigns').select('*, campaign_metrics(*), therapist_profiles(name, specialty, city)').order('created_at', { ascending: false }),
    supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel — THERALGO</h1>
          <p className="text-slate-500 mt-1">Vue d&apos;ensemble de la plateforme</p>
        </div>
        <AdminClient
          users={usersRes.data || []}
          campaigns={campaignsRes.data || []}
          leads={leadsRes.data || []}
        />
      </div>
    </div>
  )
}
