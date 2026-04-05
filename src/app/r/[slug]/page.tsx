import { createClient } from '@/lib/supabase'
import ReferralLanding from './ReferralLanding'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface ReferralPageParams {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const supabase = createClient()

  const { data: referralLink } = await supabase
    .from('referral_links')
    .select('*, profiles(*)')
    .eq('slug', params.slug)
    .single()

  if (!referralLink) {
    return {
      title: 'Referral Not Found',
    }
  }

  const referrerName = referralLink.profiles?.name || 'A therapist'
  const therapistName = referralLink.therapist_name || 'Our service'

  return {
    title: `Recommended by ${referrerName} — ${therapistName}`,
    description:
      referralLink.description ||
      'Join this recommended therapeutic service and get specialized care from a trusted therapist.',
    openGraph: {
      title: `Recommended by ${referrerName} — ${therapistName}`,
      description: referralLink.description || 'Join a recommended therapeutic service.',
      type: 'website',
      ...(referralLink.og_image && { images: [{ url: referralLink.og_image }] }),
    },
  }
}

export default async function ReferralPage({
  params,
  searchParams,
}: ReferralPageParams) {
  const supabase = createClient()
  const { slug } = params

  // Fetch referral link data
  const { data: referralLink, error } = await supabase
    .from('referral_links')
    .select('*, profiles(*)')
    .eq('slug', slug)
    .single()

  if (error || !referralLink) {
    notFound()
  }

  // Check if link is expired
  if (referralLink.expires_at && new Date(referralLink.expires_at) < new Date()) {
    notFound()
  }

  // Track the click
  const clientIp = 'unknown'
  const userAgent = 'server-side'

  await supabase.from('referral_clicks').insert({
    referral_link_id: referralLink.id,
    clicked_at: new Date().toISOString(),
    client_ip: clientIp,
    user_agent: userAgent,
    utm_source: searchParams.utm_source,
    utm_medium: searchParams.utm_medium,
    utm_campaign: searchParams.utm_campaign,
  })

  return (
    <ReferralLanding
      referralLink={referralLink}
      therapist={referralLink.profiles}
    />
  )
}
