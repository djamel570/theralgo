import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import ProductBuilder from './ProductBuilder'

// Simple admin check
const ADMIN_EMAILS = ['admin@theralgo.fr', process.env.ADMIN_EMAIL || '']

export const metadata = {
  title: 'Product Builder — Theralgo',
  description: 'Create digital products with AI',
}

export default async function ProductsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard')
  }

  const supabaseAdmin = createServiceSupabaseClient()

  // Fetch therapist profiles for the admin user (or all if they're super admin)
  const { data: profiles } = await supabaseAdmin
    .from('therapist_profiles')
    .select('id, user_id, name, specialty, approach, main_problem, techniques, city')
    .order('created_at', { ascending: false })

  if (!profiles || profiles.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9f7f4', padding: '2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              Générateur de Produits Numériques
            </h1>
            <p style={{ fontSize: '1rem', color: '#666', marginTop: '0.5rem' }}>
              Créez des produits digitaux complets avec l'IA Claude
            </p>
          </div>

          <div style={{
            padding: '3rem 2rem',
            background: 'white',
            borderRadius: '16px',
            border: '2px dashed #ddd',
            textAlign: 'center',
            color: '#666',
          }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>
              Aucun profil de thérapeute trouvé. Veuillez d'abord créer un profil.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // For now, use the first profile
  const profile = profiles[0]

  return (
    <div style={{ minHeight: '100vh', background: '#f9f7f4', paddingBottom: '4rem' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e0e0e0', padding: '1.5rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            Générateur de Produits Numériques
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#666', margin: '0.5rem 0 0' }}>
            Créez des programmes audio, mini-cours, ateliers et abonnements complets avec l'IA
          </p>
        </div>
      </div>

      <ProductBuilder
        therapistName={profile.name || 'Thérapeute'}
        therapistProfile={{
          id: profile.id,
          specialty: profile.specialty || '',
          approach: profile.approach || '',
          mainProblem: profile.main_problem || '',
          techniques: profile.techniques || '',
          city: profile.city || '',
        }}
      />
    </div>
  )
}
