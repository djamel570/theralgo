/**
 * PATCH /api/notifications/[id]
 * Update a notification (mark as read, etc.)
 * Body: { read? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const notificationsLogger = logger.child({ component: 'NotificationDetailAPI' })

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const notificationId = params.id

    // 2. Parse request body
    const body = await req.json()
    const { read } = body

    if (read === undefined) {
      return NextResponse.json(
        { error: 'read requis' },
        { status: 400 }
      )
    }

    // 3. Verify notification belongs to user
    const supabase = createServiceSupabaseClient()
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json(
        { error: 'Notification non trouvée' },
        { status: 404 }
      )
    }

    // 4. Update notification
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read })
      .eq('id', notificationId)

    if (updateError) {
      throw updateError
    }

    notificationsLogger.info('Notification updated', {
      userId: user.id,
      notificationId,
      read
    })

    return NextResponse.json({
      success: true,
      notification: {
        id: notificationId,
        read
      }
    })
  } catch (error) {
    notificationsLogger.error('Erreur lors de la mise à jour de la notification', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
