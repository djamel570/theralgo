import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { adaptiveFunnelEngine, FunnelVariant } from '@/lib/adaptive-funnel'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ['admin@theralgo.fr', process.env.ADMIN_EMAIL || '']

/**
 * GET /api/funnel/variant?profileId=...&segmentKey=...
 *
 * Fetch a specific variant by profileId + segmentKey.
 * Public endpoint (landing pages need this).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profileId = searchParams.get('profileId')
    const segmentKey = searchParams.get('segmentKey')

    if (!profileId || !segmentKey) {
      return NextResponse.json(
        { error: 'Missing profileId or segmentKey' },
        { status: 400 }
      )
    }

    const variant = await adaptiveFunnelEngine.getVariant(profileId, segmentKey)

    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(variant)
  } catch (err) {
    console.error('Variant fetch error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * POST /api/funnel/variant
 *
 * Save or update a variant.
 * Admin only.
 *
 * Request body:
 * {
 *   profileId: string
 *   variant: FunnelVariant
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check - admin only
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const supabase = createServiceSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { profileId, variant } = body

    if (!profileId || !variant) {
      return NextResponse.json(
        { error: 'Missing profileId or variant' },
        { status: 400 }
      )
    }

    const saved = await adaptiveFunnelEngine.saveVariant(profileId, variant as FunnelVariant)

    if (!saved) {
      return NextResponse.json({ error: 'Failed to save variant' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      variant: saved,
    })
  } catch (err) {
    console.error('Variant save error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
