import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ProductBuilder } from '@/lib/product-builder'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const OutlineProductSchema = z.object({
  specialty: z.string().min(1),
  productType: z.enum(['audio_program', 'mini_course', 'live_workshop', 'subscription']),
  topic: z.string().min(1),
  duration: z.string().optional(),
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
    const validation = OutlineProductSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { specialty, productType, topic, duration } = validation.data

    // Generate outline
    const builder = new ProductBuilder()
    const outline = await builder.generateProductOutline({
      specialty,
      productType,
      topic,
      duration,
    })

    return NextResponse.json({
      success: true,
      outline,
    })
  } catch (err: unknown) {
    console.error('Generate outline error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
