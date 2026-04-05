import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { LandingGenerateSlugSchema } from '@/lib/validations'
import { getAuthenticatedUser, verifyResourceOwnership, forbidden } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

/**
 * Remove accents and special characters from a string
 */
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug for a therapist
 * Format: name-specialty-city (e.g., sophie-martin-hypnose-paris)
 */
async function generateUniqueSlug(
  name: string,
  specialty: string,
  city: string,
  supabase: ReturnType<typeof createServiceSupabaseClient>
): Promise<string> {
  const baseSlug = `${removeAccents(name)}-${removeAccents(specialty)}-${removeAccents(city)}`

  // Check if slug exists
  const { data: existing } = await supabase
    .from('therapist_profiles')
    .select('landing_slug')
    .eq('landing_slug', baseSlug)
    .maybeSingle()

  if (!existing) {
    return baseSlug
  }

  // If exists, append number
  let counter = 2
  let uniqueSlug = `${baseSlug}-${counter}`

  while (true) {
    const { data: check } = await supabase
      .from('therapist_profiles')
      .select('landing_slug')
      .eq('landing_slug', uniqueSlug)
      .maybeSingle()

    if (!check) {
      return uniqueSlug
    }

    counter++
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body
    const validation = LandingGenerateSlugSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, specialty, city } = validation.data

    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns their profile
    const supabaseForCheck = createServiceSupabaseClient()
    const { data: profile } = await supabaseForCheck
      .from('therapist_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return forbidden('You do not have a therapist profile')
    }

    const supabase = createServiceSupabaseClient()

    // Generate unique slug
    const slug = await generateUniqueSlug(name, specialty, city, supabase)

    // Update therapist profile with landing slug
    const { error } = await supabase
      .from('therapist_profiles')
      .update({ landing_slug: slug })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating therapist profile:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      slug,
      url: `/t/${slug}`,
    })
  } catch (err) {
    console.error('Generate slug error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
