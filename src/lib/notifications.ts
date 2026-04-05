import { createServiceSupabaseClient } from './supabase-server'

export interface TheralgoNotification {
  id: string
  userId: string
  type: 'new_lead' | 'product_sale' | 'campaign_alert' | 'optimization' | 'video_analyzed'
  title: string
  message: string
  actionUrl?: string
  read: boolean
  createdAt: string
}

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  async createNotification(params: Omit<TheralgoNotification, 'id' | 'read' | 'createdAt'>): Promise<void> {
    const supabase = createServiceSupabaseClient()

    const { error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl,
      read: false,
      created_at: new Date().toISOString()
    })

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`)
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnread(userId: string): Promise<TheralgoNotification[]> {
    const supabase = createServiceSupabaseClient()

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      actionUrl: row.action_url,
      read: row.read,
      createdAt: row.created_at
    }))
  }

  /**
   * Get all notifications for a user with pagination
   */
  async getAll(userId: string, limit = 20, offset = 0): Promise<TheralgoNotification[]> {
    const supabase = createServiceSupabaseClient()

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      actionUrl: row.action_url,
      read: row.read,
      createdAt: row.created_at
    }))
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const supabase = createServiceSupabaseClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const supabase = createServiceSupabaseClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`)
    }
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string): Promise<void> {
    const supabase = createServiceSupabaseClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`)
    }
  }
}

export const notificationService = new NotificationService()
