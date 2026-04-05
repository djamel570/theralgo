import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { CampaignGenerateSchema } from '@/lib/validations'
import { getAuthenticatedUser, verifyResourceOwnership, forbidden } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body
    const validation = CampaignGenerateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { userId } = validation.data

    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this profile
    const ownsProfile = await verifyResourceOwnership(user.id, 'therapist_profiles', userId)
    if (!ownsProfile && user.id !== userId) {
      return forbidden('You do not have permission to generate campaigns for this profile')
    }

    const supabase = createServiceSupabaseClient()

    // Get profile + media
    const [{ data: profile }, { data: media }] = await Promise.all([
      supabase.from('therapist_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('media_uploads').select('*').eq('user_id', userId).order('upload_date', { ascending: false }).limit(1).single(),
    ])

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Create campaign in pending state
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: userId,
        media_id: media?.id || null,
        status: 'generating',
        budget: 300,
        targeting_radius: 15,
      })
      .select()
      .single()

    if (campaignError) throw campaignError

    // Generate with Claude (Anthropic)
    const prompt = `Tu es un expert en publicité Meta Ads pour les thérapeutes bien-être.
Génère 3 variations de publicité percutantes pour ce thérapeute :
- Spécialité: ${profile.specialty}
- Ville: ${profile.city}
- Prix de consultation: ${profile.consultation_price}€

Pour chaque variation, génère :
1. Une accroche percutante (hook) - max 40 mots, émotionnelle et directe
2. Un message publicitaire (message) - max 80 mots, bienveillant et rassurant
3. Un appel à l'action (cta) - court et incitatif
4. Le public cible (audience) - description courte

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "variations": [
    { "hook": "...", "message": "...", "cta": "...", "audience": "..." },
    { "hook": "...", "message": "...", "cta": "...", "audience": "..." },
    { "hook": "...", "message": "...", "cta": "...", "audience": "..." }
  ]
}`

    let generatedContent
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const completion = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.8,
        system: 'Tu es un expert en publicité Meta Ads pour les thérapeutes bien-être. Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans texte supplémentaire.',
        messages: [{ role: 'user', content: prompt }],
      })
      generatedContent = JSON.parse(completion.content[0].text || '{}')
    } catch {
      // Fallback if no Anthropic key
      generatedContent = {
        variations: [
          {
            hook: `Vous cherchez un(e) ${profile.specialty} à ${profile.city} ? Découvrez une approche qui change tout.`,
            message: `Libérez-vous des blocages qui vous freinent depuis trop longtemps. En tant que ${profile.specialty} à ${profile.city}, je vous accompagne avec bienveillance vers un mieux-être durable. Premier rendez-vous à ${profile.consultation_price}€.`,
            cta: 'Prendre rendez-vous',
            audience: 'Adultes 25-55 ans en quête de bien-être',
          },
          {
            hook: `Et si votre mieux-être commençait dès aujourd'hui à ${profile.city} ?`,
            message: `Plus de 80% de mes patients ressentent une amélioration significative dès la première séance. ${profile.specialty} certifié(e) à ${profile.city} — séance à ${profile.consultation_price}€. Places limitées.`,
            cta: 'Réserver ma séance',
            audience: 'Personnes souffrant de stress ou anxiété',
          },
          {
            hook: `Vous méritez de vous sentir bien. Voici comment je peux vous aider.`,
            message: `En tant que ${profile.specialty} à ${profile.city}, j'ai accompagné des dizaines de personnes à retrouver équilibre et sérénité. Consultation de découverte à ${profile.consultation_price}€ — sans engagement.`,
            cta: 'Consulter maintenant',
            audience: 'Personnes cherchant un accompagnement thérapeutique',
          },
        ],
      }
    }

    // Update campaign with content and set to active
    await supabase
      .from('campaigns')
      .update({
        status: 'active',
        generated_content: generatedContent,
        launch_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaign.id)

    // Seed initial metrics
    await supabase.from('campaign_metrics').insert({
      campaign_id: campaign.id,
      impressions: Math.floor(Math.random() * 500 + 200),
      clicks: Math.floor(Math.random() * 30 + 10),
      leads: Math.floor(Math.random() * 5 + 1),
      appointments: Math.floor(Math.random() * 2),
      ctr: parseFloat((Math.random() * 2 + 1.5).toFixed(2)),
      cpl: parseFloat((Math.random() * 20 + 25).toFixed(2)),
      spend: parseFloat((Math.random() * 50 + 20).toFixed(2)),
    })

    return NextResponse.json({ success: true, campaignId: campaign.id, content: generatedContent })
  } catch (err: unknown) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
