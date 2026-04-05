import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import MediaPageClient from './MediaPageClient'

export default async function MediaPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: media } = await supabase
    .from('media_uploads')
    .select('*')
    .eq('user_id', user.id)
    .order('upload_date', { ascending: false })
    .limit(1)
    .single()

  return <MediaPageClient userId={user.id} existingMedia={media} />
}
