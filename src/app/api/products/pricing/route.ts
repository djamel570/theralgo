import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ProductBuilder } from '@/lib/product-builder'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const PricingSchema = z.object({
  productType: z.enum(['audio_program', 'mini_course', 'live_workshop', 'subscription']),
  specialty: z.string().min(1),
  modulesCount: z.number().min(1),
  totalDuration: z.string().min(1),
  city: z.string().min(1),
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
    const validation = PricingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { productType, specialty, modulesCount, totalDuration, city } = validation.data

    // Get pricing suggestion
    const builder = new ProductBuilder()
    const pricing = await builder.suggestPricing({
      productType,
      specialty,
      modulesCount,
      totalDuration,
      city,
    })

    return NextResponse.json({
      success: true,
      pricing,
    })
  } catch (err: unknown) {
    console.error('Pricing suggestion error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
