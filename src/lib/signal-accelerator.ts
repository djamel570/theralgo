/**
 * Signal Accelerator Engine
 *
 * Core engine for micro-event pipeline that multiplies signals sent to Meta by 8x.
 * Teaches Meta's algorithm what a quality visitor looks like BEFORE form submission.
 */

import { MetaConversionsAPI, ConversionEvent } from './meta-conversions'
import { createServiceSupabaseClient } from './supabase-server'

/**
 * Micro-event hierarchy with weighted values
 * Each event teaches Meta's algorithm about user engagement
 */
export const MICRO_EVENTS = {
  // Engagement signals (low value, high volume)
  PAGE_VIEW: {
    eventName: 'ViewContent' as const,
    value: 0.5,
    label: 'Page Visit',
  },
  SCROLL_25: {
    eventName: 'ViewContent' as const,
    value: 1,
    label: 'Scroll 25%',
    customEvent: 'scroll_25',
  },
  SCROLL_50: {
    eventName: 'ViewContent' as const,
    value: 2,
    label: 'Scroll 50%',
    customEvent: 'scroll_50',
  },
  SCROLL_75: {
    eventName: 'ViewContent' as const,
    value: 3,
    label: 'Scroll 75%',
    customEvent: 'scroll_75',
  },
  VIDEO_START: {
    eventName: 'ViewContent' as const,
    value: 3,
    label: 'Video Start',
    customEvent: 'video_start',
  },
  VIDEO_50: {
    eventName: 'ViewContent' as const,
    value: 5,
    label: 'Video 50%',
    customEvent: 'video_50',
  },
  VIDEO_COMPLETE: {
    eventName: 'ViewContent' as const,
    value: 8,
    label: 'Video Complete',
    customEvent: 'video_complete',
  },

  // Intent signals (medium value)
  CTA_CLICK: {
    eventName: 'InitiateCheckout' as const,
    value: 10,
    label: 'CTA Click',
  },
  FORM_START: {
    eventName: 'AddToCart' as const,
    value: 15,
    label: 'Form Started',
  },
  FORM_PROGRESS: {
    eventName: 'AddToCart' as const,
    value: 20,
    label: 'Form Progress',
    customEvent: 'form_progress',
  },

  // Conversion signals (high value)
  FORM_SUBMIT: {
    eventName: 'Lead' as const,
    value: 30,
    label: 'Form Submitted',
  },
  QUALIFIED_LEAD: {
    eventName: 'CompleteRegistration' as const,
    value: 50,
    label: 'Qualified Lead',
  },

  // Post-conversion signals (highest value)
  APPOINTMENT_BOOKED: {
    eventName: 'Schedule' as const,
    value: 70,
    label: 'Appointment Booked',
  },
  APPOINTMENT_ATTENDED: {
    eventName: 'Purchase' as const,
    value: 100,
    label: 'Appointment Attended',
  },
} as const

export type MicroEventType = keyof typeof MICRO_EVENTS

interface EventRecord {
  sessionId: string
  type: MicroEventType
  timestamp: number
  value: number
}

interface SessionQuality {
  sessionId: string
  totalValue: number
  eventCount: number
  score: number // 0-100
  lastEventAt: number
}

export class SignalAccelerator extends MetaConversionsAPI {
  private eventCache = new Map<string, EventRecord[]>()
  private sessionQuality = new Map<string, SessionQuality>()
  private pixelId: string

  constructor(pixelId: string) {
    super(pixelId)
    this.pixelId = pixelId
  }

  /**
   * Send a micro-event to Meta CAPI with proper value weighting
   */
  async sendMicroEvent(
    type: MicroEventType,
    sessionId: string,
    userData?: {
      email?: string
      phone?: string
      firstName?: string
      lastName?: string
      city?: string
      ipAddress?: string
      userAgent?: string
      fbc?: string
      fbp?: string
    },
    metadata?: Record<string, unknown>
  ): Promise<{ events_received: number; fbtrace_id: string }> {
    const eventDef = MICRO_EVENTS[type]
    const now = Math.floor(Date.now() / 1000)
    const eventId = `micro_${type}_${sessionId}_${now}_${Math.random().toString(36).slice(2, 8)}`

    // Prepare user data
    const preparedUserData = userData ? await this.prepareUserData(userData) : {}

    // Create CAPI event
    const event: ConversionEvent = {
      event_name: eventDef.eventName,
      event_time: now,
      event_id: eventId,
      action_source: 'website',
      user_data: preparedUserData,
      custom_data: {
        value: eventDef.value,
        currency: 'EUR',
        content_name: eventDef.label,
        ...(eventDef.customEvent && { custom_event: eventDef.customEvent }),
        ...metadata,
      },
    }

    // Track locally
    this.trackEventLocally(sessionId, type, eventDef.value)

    // Send to Meta CAPI
    return this.sendEvent(event)
  }

  /**
   * Send multiple events in a single CAPI batch (up to 1000 events)
   */
  async sendEventBatch(
    events: Array<{
      type: MicroEventType
      sessionId: string
      userData?: Record<string, unknown>
      metadata?: Record<string, unknown>
    }>
  ): Promise<{ events_received: number; fbtrace_id: string }> {
    const now = Math.floor(Date.now() / 1000)
    const batchEvents: ConversionEvent[] = []

    for (const event of events) {
      const eventDef = MICRO_EVENTS[event.type]
      const eventId = `micro_${event.type}_${event.sessionId}_${now}_${Math.random().toString(36).slice(2, 8)}`

      const preparedUserData = event.userData ? await this.prepareUserData(event.userData as any) : {}

      const capiEvent: ConversionEvent = {
        event_name: eventDef.eventName,
        event_time: now,
        event_id: eventId,
        action_source: 'website',
        user_data: preparedUserData,
        custom_data: {
          value: eventDef.value,
          currency: 'EUR',
          content_name: eventDef.label,
          ...(eventDef.customEvent && { custom_event: eventDef.customEvent }),
          ...event.metadata,
        },
      }

      batchEvents.push(capiEvent)
      this.trackEventLocally(event.sessionId, event.type, eventDef.value)
    }

    // Send batch to Meta
    const url = `https://graph.facebook.com/v21.0/${this.pixelId}/events`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: batchEvents,
        access_token: process.env.META_ACCESS_TOKEN,
      }),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      throw new Error(`CAPI Batch Error: ${data.error?.message || 'Unknown error'}`)
    }

    return data
  }

  /**
   * Track event locally for deduplication and session quality
   */
  private trackEventLocally(sessionId: string, type: MicroEventType, value: number): void {
    const eventDef = MICRO_EVENTS[type]

    // Get or create session events
    if (!this.eventCache.has(sessionId)) {
      this.eventCache.set(sessionId, [])
    }

    const sessionEvents = this.eventCache.get(sessionId)!

    // Check for duplicates (same event type in last 5 seconds)
    const recentDuplicate = sessionEvents.some(
      (e) => e.type === type && Date.now() - e.timestamp * 1000 < 5000
    )

    if (recentDuplicate) {
      return
    }

    // Add event
    sessionEvents.push({
      sessionId,
      type,
      timestamp: Math.floor(Date.now() / 1000),
      value,
    })

    // Update session quality
    this.updateSessionQuality(sessionId)
  }

  /**
   * Update session quality score
   */
  private updateSessionQuality(sessionId: string): void {
    const events = this.eventCache.get(sessionId) || []
    const totalValue = events.reduce((sum, e) => sum + e.value, 0)

    // Score: weighted average with diminishing returns
    const score = Math.min(100, (totalValue / 300) * 100)

    this.sessionQuality.set(sessionId, {
      sessionId,
      totalValue,
      eventCount: events.length,
      score,
      lastEventAt: Math.floor(Date.now() / 1000),
    })
  }

  /**
   * Get all events for a session (for debugging/analytics)
   */
  getEventChain(sessionId: string): EventRecord[] {
    return this.eventCache.get(sessionId) || []
  }

  /**
   * Get session quality score (0-100)
   */
  getSessionQualityScore(sessionId: string): SessionQuality | null {
    return this.sessionQuality.get(sessionId) || null
  }

  /**
   * Store events to database for analytics
   */
  async storeEventToDB(
    eventType: MicroEventType,
    sessionId: string,
    campaignId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const supabase = createServiceSupabaseClient()
      const eventDef = MICRO_EVENTS[eventType]

      await supabase.from('micro_events').insert({
        session_id: sessionId,
        campaign_id: campaignId,
        event_type: eventType,
        event_name: eventDef.eventName,
        value_weight: eventDef.value,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      // Log but don't fail
      console.warn('Failed to store micro-event to DB:', error)
    }
  }

  /**
   * Calculate signal multiplier (how many micro-events vs traditional setup)
   */
  calculateSignalMultiplier(sessionId: string): number {
    const quality = this.getSessionQualityScore(sessionId)
    if (!quality) return 1

    // 8x multiplier comes from ~8 micro-events per session vs 1 traditional lead event
    return Math.ceil(quality.eventCount / 1)
  }
}

export function createSignalAccelerator(pixelId: string): SignalAccelerator {
  return new SignalAccelerator(pixelId)
}
