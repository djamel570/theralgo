import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { AlertListQuerySchema, AlertUpdateSchema } from '@/lib/validations'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceSupabaseClient()

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)
    const level = searchParams.get('level') // Filter by level: 'info', 'warning', 'critical'
    const isRead = searchParams.get('is_read') // Filter by read status: 'true', 'false'
    const source = searchParams.get('source') // Filter by source

    // Build query
    let query = supabase.from('alerts').select('*', { count: 'exact' })

    if (level) {
      query = query.eq('level', level)
    }

    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true')
    }

    if (source) {
      query = query.eq('source', source)
    }

    // Order by created_at descending and apply pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: alerts, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      alerts: alerts || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0),
    })
  } catch (err) {
    console.error('[alerts/list] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}

// Mark alerts as read
export async function PATCH(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate request body
    const validation = AlertUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { alert_ids, is_read } = validation.data

    const supabase = createServiceSupabaseClient()

    const { error } = await supabase
      .from('alerts')
      .update({ is_read })
      .in('id', alert_ids)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `${alert_ids.length} alerte(s) mise(s) à jour`,
      updated_count: alert_ids.length,
    })
  } catch (err) {
    console.error('[alerts/list] PATCH Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
