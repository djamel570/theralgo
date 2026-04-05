import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ProductBuilder } from '@/lib/product-builder'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const GenerateProductSchema = z.object({
  profileId: z.string().optional(),
  therapistName: z.string().min(1),
  specialty: z.string().min(1),
  approach: z.string().min(1),
  mainProblem: z.string().min(1),
  techniques: z.string().min(1),
  city: z.string().min(1),
  productType: z.enum(['audio_program', 'mini_course', 'live_workshop', 'subscription']),
  topic: z.string().min(1),
  targetSegment: z.string().optional(),
  priceRange: z.enum(['low', 'medium', 'high']).optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate request body
    const validation = GenerateProductSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const {
      profileId,
      therapistName,
      specialty,
      approach,
      mainProblem,
      techniques,
      city,
      productType,
      topic,
      targetSegment,
      priceRange,
    } = validation.data

    // Verify user owns this profile if provided
    if (profileId) {
      const supabaseForCheck = createServiceSupabaseClient()
      const { data: profile } = await supabaseForCheck
        .from('therapist_profiles')
        .select('user_id')
        .eq('id', profileId)
        .single()

      if (!profile || profile.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Generate product
    const builder = new ProductBuilder()
    const product = await builder.generateProduct({
      therapistName,
      specialty,
      approach,
      mainProblem,
      techniques,
      city,
      productType,
      topic,
      targetSegment,
      priceRange: (priceRange as 'low' | 'medium' | 'high' | undefined) || 'medium',
    })

    // Optionally save to database
    if (profileId) {
      const supabase = createServiceSupabaseClient()
      await supabase.from('digital_products').insert({
        profile_id: profileId,
        user_id: user.id,
        type: productType,
        title: product.title,
        data: product,
        status: 'draft',
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (err: unknown) {
    console.error('Generate product error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
