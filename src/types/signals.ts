/**
 * Signal Accelerator Type Definitions
 */

import type { MicroEventType } from '@/lib/signal-accelerator'

/**
 * Configuration for SignalTracker initialization
 */
export interface SignalTrackerConfig {
  campaignId: string
  pixelId: string
  sessionId?: string
}

/**
 * Metadata that can be attached to events
 */
export interface SignalEventMetadata {
  scrollPercentage?: number
  videoPercentage?: number
  formStep?: number
  formTotalSteps?: number
  timeOnPage?: number
  deviceType?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  intentionSegment?: string
  [key: string]: unknown
}

/**
 * Request body for tracking micro-events
 */
export interface TrackSignalRequest {
  sessionId: string
  campaignId: string
  eventType: MicroEventType
  metadata?: SignalEventMetadata
  timestamp?: number
}

/**
 * Response from signal tracking endpoint
 */
export interface TrackSignalResponse {
  success: boolean
  sessionId: string
  eventType: string
  stored: boolean
}

/**
 * Funnel stage in analytics
 */
export interface FunnelStage {
  stage: string
  count: number
  percentage: number
}

/**
 * Complete analytics response
 */
export interface SignalAnalyticsResponse {
  campaignId: string
  totalSessions: number
  totalEvents: number
  funnel: FunnelStage[]
  averageSessionQuality: number
  signalMultiplier: number
  conversionRate: number
  conversionMetrics: {
    totalFiredEvents: number
    eventTypes: Record<string, number>
    eventValues: Record<string, number>
  }
  timeTrends: Array<{
    date: string
    eventCount: number
    sessionCount: number
  }>
}

/**
 * Session quality score details
 */
export interface SessionQualityScore {
  sessionId: string
  totalValue: number
  eventCount: number
  score: number // 0-100
  lastEventAt: number
}

/**
 * Event record for local tracking
 */
export interface EventRecord {
  sessionId: string
  type: MicroEventType
  timestamp: number
  value: number
}

/**
 * User data that can be sent to Meta CAPI
 */
export interface UserDataForCAPI {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  ipAddress?: string
  userAgent?: string
  fbc?: string
  fbp?: string
}
