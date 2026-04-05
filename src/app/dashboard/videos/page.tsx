import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import VideoLibrary from './VideoLibrary'

export default async function VideosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch initial videos
  const { data: videos } = await supabase
    .from('media_uploads')
    .select('*')
    .eq('user_id', user.id)
    .eq('media_type', 'video')
    .order('upload_date', { ascending: false })

  return (
    <VideoLibrary
      initialVideos={(videos || []).map(video => ({
        id: video.id,
        title: video.filename || 'Sans titre',
        filename: video.filename,
        url: video.media_url,
        duration: video.duration,
        thumbnail_url: video.thumbnail_url,
        creative_score: video.creative_score,
        analyzed_at: video.analyzed_at,
        uploaded_at: video.upload_date
      }))}
      userId={user.id}
    />
  )
}
