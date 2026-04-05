import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function Layout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <DashboardLayout user={{ id: user.id, name: user.user_metadata?.name, email: user.email }}>
      {children}
    </DashboardLayout>
  )
}
