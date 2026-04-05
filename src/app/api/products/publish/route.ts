import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { stripeService } from '@/lib/stripe-service'
import { ProductPublishSchema } from '@/lib/validations'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Helper to generate a URL-safe slug from product title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 50)
}

// Helper to ensure slug uniqueness
async function ensureUniqueSlug(
  baseSlug: string,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  excludeProductId?: string
): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const query = supabase
      .from('products')
      .select('id')
      .eq('slug', slug)

    if (excludeProductId) {
      query.neq('id', excludeProductId)
    }

    const { data: existing } = await query.limit(1)

    if (!existing || existing.length === 0) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user (admin only)
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()

    // Validate request body
    const validation = ProductPublishSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { productId } = validation.data

    // Fetch the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      logger.warn('Product not found or not owned by user', {
        productId,
        userId: user.id,
      })
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }

    if (product.status === 'published') {
      logger.warn('Product already published', { productId })
      return NextResponse.json(
        { error: 'Ce produit est déjà publié' },
        { status: 400 }
      )
    }

    if (!product.price || product.price <= 0) {
      return NextResponse.json(
        { error: 'Veuillez définir un prix valide' },
        { status: 400 }
      )
    }

    if (!product.title) {
      return NextResponse.json(
        { error: 'Veuillez définir un titre' },
        { status: 400 }
      )
    }

    try {
      // Create Stripe product and price
      const { productId: stripeProductId, priceId } =
        await stripeService.createProduct({
          name: product.title,
          description: product.description || '',
          price: product.price,
          type: 'one_time',
          metadata: {
            productId: product.id,
            therapistId: user.id,
          },
        })

      // Generate unique slug
      const baseSlug = generateSlug(product.title)
      const slug = await ensureUniqueSlug(baseSlug, supabase, productId)

      // Update product with Stripe IDs and publish
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({
          status: 'published',
          stripe_product_id: stripeProductId,
          stripe_price_id: priceId,
          slug,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .select()
        .single()

      if (updateError) {
        logger.error('Failed to update product', { error: updateError })
        return NextResponse.json(
          { error: 'Erreur lors de la publication' },
          { status: 500 }
        )
      }

      logger.info('Product published', {
        productId,
        slug,
        stripeProductId,
        priceId,
      })

      return NextResponse.json({
        success: true,
        product: updatedProduct,
        slug,
        salesPageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/p/${slug}`,
      })
    } catch (stripeErr) {
      logger.error('Stripe error during product publish', { error: stripeErr })
      return NextResponse.json(
        { error: 'Erreur Stripe - veuillez réessayer' },
        { status: 500 }
      )
    }
  } catch (err) {
    logger.error('Product publish error', { error: err })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
