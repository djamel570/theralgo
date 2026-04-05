import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ProductBuilder, DigitalProduct } from '@/lib/product-builder'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const GenerateScriptsSchema = z.object({
  product: z.record(z.unknown()),
  moduleIndices: z.array(z.number()).min(1),
  therapistVoice: z.string().optional(),
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
    const validation = GenerateScriptsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { product, moduleIndices, therapistVoice } = validation.data

    // Generate scripts
    const builder = new ProductBuilder()
    const scripts = await builder.generateModuleScripts({
      product: product as DigitalProduct,
      moduleIndices,
      therapistVoice,
    })

    return NextResponse.json({
      success: true,
      scripts,
    })
  } catch (err: unknown) {
    console.error('Generate scripts error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
