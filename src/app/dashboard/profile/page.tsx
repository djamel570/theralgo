import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProfileForm from '@/components/dashboard/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('therapist_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div style={{ maxWidth: 740 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8ED462' }} />
          <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#6B7280', letterSpacing: '.09em', textTransform: 'uppercase' }}>Branding thérapeute</span>
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#1A1A1A', letterSpacing: '-.04em', marginBottom: 8 }}>
          Therapist Signature
        </h1>
        <p style={{ color: '#6B7280', fontSize: '.88rem', lineHeight: 1.75, maxWidth: 560 }}>
          Répondez aux 10 questions ci-dessous. Notre IA analysera vos réponses pour générer votre signature de thérapeute unique — l'ADN de votre landing page personnalisée.
        </p>
      </div>
      <ProfileForm userId={user.id} initialData={profile || undefined} />
    </div>
  )
}
