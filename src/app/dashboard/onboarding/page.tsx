import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isOnboardingComplete } from '@/lib/onboarding'
import OnboardingWizard from './OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if onboarding is already completed
  const completed = await isOnboardingComplete(user.id, supabase)
  if (completed) {
    redirect('/dashboard')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('therapist_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const userName = user.user_metadata?.name || user.email || 'Thérapeute'
  const userEmail = user.email || ''

  return (
    <OnboardingWizard
      userId={user.id}
      userName={userName}
      userEmail={userEmail}
      initialProfile={profile}
    />
  )
}
