'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import Link from 'next/link'

/* ── Design tokens ──────────────────────────────────────── */
const G = '#72C15F'
const GN = '#5DB847'
const T = '#1A1A1A'
const M = '#6B7280'
const C = '#F7F4EE'
const W = '#FFFFFF'

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

interface NotificationBellProps {
  userId: string
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<TheralgoNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?unread=true`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter((n: TheralgoNotification) => !n.read).length || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [userId])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })

      if (res.ok) {
        setNotifications(notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch(`/api/notifications/mark-all-read`, {
        method: 'PATCH'
      })

      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getNotificationIcon = (type: TheralgoNotification['type']) => {
    switch (type) {
      case 'new_lead':
        return '👤'
      case 'product_sale':
        return '💰'
      case 'campaign_alert':
        return '📢'
      case 'optimization':
        return '⚡'
      case 'video_analyzed':
        return '🎬'
      default:
        return '📬'
    }
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'à l\'instant'
    if (minutes < 60) return `il y a ${minutes}m`
    if (hours < 24) return `il y a ${hours}h`
    return `il y a ${days}j`
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          position: 'relative',
          padding: '.5rem',
          borderRadius: 8,
          transition: 'all 0.2s',
          color: T,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        title="Notifications"
      >
        <Bell style={{ width: 20, height: 20 }} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-.2rem',
            right: '-.2rem',
            background: '#EF4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '.7rem',
            fontWeight: 700,
            border: `2px solid white`
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '.5rem',
          background: W,
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,.15)',
          zIndex: 1000,
          minWidth: '360px',
          maxHeight: '500px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: `1px solid rgba(0,0,0,.07)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '.95rem', fontWeight: 700, color: T }}>
              Notifications
            </h3>
            <button
              onClick={() => setShowDropdown(false)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: M,
                fontSize: '1.25rem'
              }}
            >
              ×
            </button>
          </div>

          {/* Notifications list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '380px'
          }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '2rem 1.5rem',
                textAlign: 'center',
                color: M
              }}>
                <p style={{ fontSize: '.9rem' }}>Aucune notification pour le moment</p>
              </div>
            ) : (
              notifications.map(notification => (
                <Link
                  key={notification.id}
                  href={notification.actionUrl || '#'}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                    setShowDropdown(false)
                  }}
                  style={{
                    display: 'flex',
                    padding: '1rem 1.5rem',
                    borderBottom: `1px solid rgba(0,0,0,.07)`,
                    textDecoration: 'none',
                    color: T,
                    background: notification.read ? 'transparent' : C,
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = C
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = notification.read ? 'transparent' : C
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    fontSize: '1.5rem',
                    marginRight: '1rem',
                    flexShrink: 0
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '.9rem',
                      fontWeight: notification.read ? 500 : 600,
                      color: T,
                      marginBottom: '.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {notification.title}
                    </p>
                    <p style={{
                      fontSize: '.8rem',
                      color: M,
                      marginBottom: '.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {notification.message}
                    </p>
                    <p style={{
                      fontSize: '.75rem',
                      color: M
                    }}>
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: GN,
                      flexShrink: 0,
                      marginLeft: '.75rem'
                    }} />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: `1px solid rgba(0,0,0,.07)`,
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={markAllAsRead}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: GN,
                  fontSize: '.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '.5rem 0',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = GN }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = M }}
              >
                Tout marquer comme lu
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop click */}
      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}
