import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isOnboardingComplete } from '@/lib/onboarding'
import DashboardHome from './DashboardHome'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if onboarding is complete
  const onboardingComplete = await isOnboardingComplete(user.id, supabase)
  if (!onboardingComplete) {
    redirect('/dashboard/onboarding')
  }

  const [profileRes, mediaRes, campaignRes] = await Promise.all([
    supabase.from('therapist_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('media_uploads').select('*').eq('user_id', user.id).order('upload_date', { ascending: false }).limit(1).single(),
    supabase.from('campaigns').select('*, campaign_metrics(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
  ])

  return (
    <DashboardHome
      user={{ id: user.id, name: user.user_metadata?.name, email: user.email }}
      profile={profileRes.data}
      media={mediaRes.data}
      campaign={campaignRes.data}
    />
  )
}
