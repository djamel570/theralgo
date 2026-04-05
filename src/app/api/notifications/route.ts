/**
 * GET /api/notifications
 * Get notifications for authenticated user
 * Query params: unread (boolean), limit, offset
 *
 * POST /api/notifications
 * Create a new notification (internal use)
 * Body: { type, title, message, actionUrl? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const notificationsLogger = logger.child({ component: 'NotificationsAPI' })

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Get query parameters
    const url = new URL(req.url)
    const unread = url.searchParams.get('unread') === 'true'
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // 3. Build query
    const supabase = createServiceSupabaseClient()
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)

    if (unread) {
      query = query.eq('read', false)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: notifications, error } = await query

    if (error) {
      throw error
    }

    notificationsLogger.info('Notifications fetched', {
      userId: user.id,
      count: notifications?.length || 0,
      unread
    })

    return NextResponse.json({
      success: true,
      notifications: (notifications || []).map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        actionUrl: n.action_url,
        read: n.read,
        createdAt: n.created_at
      }))
    })
  } catch (error) {
    notificationsLogger.error('Erreur lors de la récupération des notifications', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await req.json()
    const { type, title, message, actionUrl } = body

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'type, title et message requis' },
        { status: 400 }
      )
    }

    // 3. Create notification
    const supabase = createServiceSupabaseClient()
    const notificationId = crypto.randomUUID()

    const { error } = await supabase.from('notifications').insert({
      id: notificationId,
      user_id: user.id,
      type,
      title,
      message,
      action_url: actionUrl,
      read: false,
      created_at: new Date().toISOString()
    })

    if (error) {
      throw error
    }

    notificationsLogger.info('Notification created', {
      userId: user.id,
      notificationId,
      type
    })

    return NextResponse.json({
      success: true,
      notification: {
        id: notificationId,
        userId: user.id,
        type,
        title,
        message,
        actionUrl,
        read: false,
        createdAt: new Date().toISOString()
      }
    })
  } catch (error) {
    notificationsLogger.error('Erreur lors de la création de la notification', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
