import { Metadata } from 'next'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { adaptiveFunnelEngine, FunnelVariant } from '@/lib/adaptive-funnel'
import TherapistLanding from './TherapistLanding'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceSupabaseClient()

  const { data } = await supabase
    .from('therapist_profiles')
    .select('name, specialty, city, signature_content')
    .eq('landing_slug', slug)
    .single()

  if (!data) {
    return { title: 'Theralgo' }
  }

  const sig = data.signature_content as { headline?: string } | null

  return {
    title: `${data.name} — ${data.specialty} à ${data.city} | Theralgo`,
    description: sig?.headline || `${data.specialty} à ${data.city}`,
    openGraph: {
      title: `${data.name} — ${data.specialty} à ${data.city}`,
      description: sig?.headline || `Trouvez un ${data.specialty} à ${data.city}`,
      type: 'website',
      locale: 'fr_FR',
    },
  }
}

export default async function TherapistPage({ params, searchParams }: Props) {
  const { slug } = await params
  const queryParams = await searchParams
  const supabase = createServiceSupabaseClient()

  const { data: profile } = await supabase
    .from('therapist_profiles')
    .select('*')
    .eq('landing_slug', slug)
    .single()

  if (!profile) notFound()

  const { data: media } = await supabase
    .from('media_uploads')
    .select('*')
    .eq('user_id', profile.user_id)
    .order('upload_date', { ascending: false })
    .limit(1)
    .single()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('user_id', profile.user_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const pixelId =
    ((profile.meta_config as Record<string, unknown>)?.pixel_id as string) ||
    process.env.META_DEFAULT_PIXEL_ID ||
    ''

  // Detect and fetch funnel variant if segment is provided
  let funnelVariant: FunnelVariant | null = null
  const segmentKey = adaptiveFunnelEngine.detectSegment(queryParams as Record<string, string | string[] | undefined>)

  if (segmentKey) {
    funnelVariant = await adaptiveFunnelEngine.getVariant(profile.id, segmentKey)
  }

  return (
    <>
      {/* Meta Pixel */}
      {pixelId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
          }}
        />
      )}
      <TherapistLanding
        profile={profile}
        media={media}
        campaignId={campaign?.id || null}
        pixelId={pixelId}
        funnelVariant={funnelVariant}
      />
    </>
  )
}
