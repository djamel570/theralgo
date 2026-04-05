import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import LeadsManager from './LeadsManager'

export default async function LeadsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch initial leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('therapist_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <LeadsManager
      initialLeads={(leads || []).map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        date: lead.created_at,
        source: lead.source || 'Campagne interne',
        status: lead.status || 'new',
        qualification_score: lead.qualification_score || 0,
        qualification_answers: lead.qualification_answers,
        notes: lead.notes
      }))}
      userId={user.id}
    />
  )
}
