/**
 * PATCH /api/notifications/mark-all-read
 * Mark all unread notifications as read for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const notificationsLogger = logger.child({ component: 'NotificationsMarkAllReadAPI' })

export async function PATCH(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // 2. Mark all as read
    const supabase = createServiceSupabaseClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      throw error
    }

    notificationsLogger.info('All notifications marked as read', {
      userId: user.id
    })

    return NextResponse.json({
      success: true,
      message: 'Toutes les notifications marquées comme lues'
    })
  } catch (error) {
    notificationsLogger.error('Erreur lors du marquage des notifications', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
