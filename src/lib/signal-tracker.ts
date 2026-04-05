'use client'

/**
 * Client-side Signal Tracker
 *
 * Tracks user behavior on landing page and sends micro-events to both
 * Meta Pixel (client-side) and our API endpoint (server-side via CAPI).
 * Uses sendBeacon for fire-and-forget reliability.
 */

import type { MicroEventType } from './signal-accelerator'
import { MICRO_EVENTS } from './signal-accelerator'

export interface SignalTrackerConfig {
  campaignId: string
  pixelId: string
  sessionId?: string
}

export class SignalTracker {
  private sessionId: string
  private campaignId: string
  private pixelId: string
  private firedEvents: Set<string> = new Set()
  private startTime: number = Date.now()
  private scrollListener: ((e: Event) => void) | null = null
  private videoListeners: Map<HTMLVideoElement, (e: Event) => void> = new Map()

  constructor(config: SignalTrackerConfig) {
    this.campaignId = config.campaignId
    this.pixelId = config.pixelId
    this.sessionId = config.sessionId || this.generateSessionId()

    // Track initial page view
    this.trackPageView()
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('theralgo_session_id') : null

    if (stored) {
      return stored
    }

    const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('theralgo_session_id', newId)
    }
    return newId
  }

  /**
   * Track page view
   */
  trackPageView(): void {
    this.sendEvent('PAGE_VIEW')
  }

  /**
   * Track scroll events (fires at 25%, 50%, 75%)
   */
  trackScroll(percentage: number): void {
    if (percentage >= 75 && !this.firedEvents.has('SCROLL_75')) {
      this.sendEvent('SCROLL_75', { scrollPercentage: percentage })
    } else if (percentage >= 50 && !this.firedEvents.has('SCROLL_50')) {
      this.sendEvent('SCROLL_50', { scrollPercentage: percentage })
    } else if (percentage >= 25 && !this.firedEvents.has('SCROLL_25')) {
      this.sendEvent('SCROLL_25', { scrollPercentage: percentage })
    }
  }

  /**
   * Track video watch progress
   */
  trackVideoWatch(percentage: number): void {
    if (percentage > 0 && !this.firedEvents.has('VIDEO_START')) {
      this.sendEvent('VIDEO_START', { videoPercentage: 0 })
    }

    if (percentage >= 50 && !this.firedEvents.has('VIDEO_50')) {
      this.sendEvent('VIDEO_50', { videoPercentage: percentage })
    }

    if (percentage >= 100 && !this.firedEvents.has('VIDEO_COMPLETE')) {
      this.sendEvent('VIDEO_COMPLETE', { videoPercentage: 100 })
    }
  }

  /**
   * Track CTA click
   */
  trackCtaClick(): void {
    this.sendEvent('CTA_CLICK')
  }

  /**
   * Track form start
   */
  trackFormStart(): void {
    this.sendEvent('FORM_START')
  }

  /**
   * Track form progress
   */
  trackFormProgress(step: number, totalSteps: number): void {
    const progressKey = `FORM_PROGRESS_${step}`
    if (!this.firedEvents.has(progressKey)) {
      this.sendEvent('FORM_PROGRESS', {
        formStep: step,
        formTotalSteps: totalSteps,
      })
      this.firedEvents.add(progressKey)
    }
  }

  /**
   * Track form submission
   */
  trackFormSubmit(leadData: { email: string; name: string }): void {
    this.sendEvent('FORM_SUBMIT', {
      timeOnPage: Date.now() - this.startTime,
      formSubmittedAt: new Date().toISOString(),
    })
  }

  /**
   * Setup automatic scroll tracking
   */
  setupScrollTracking(): () => void {
    if (typeof window === 'undefined') return () => {}

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      this.trackScroll(scrollPercent)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }

  /**
   * Setup automatic video tracking
   */
  setupVideoTracking(videoElement: HTMLVideoElement): () => void {
    const handleTimeUpdate = () => {
      const percentage = videoElement.duration > 0
        ? (videoElement.currentTime / videoElement.duration) * 100
        : 0
      this.trackVideoWatch(percentage)
    }

    videoElement.addEventListener('timeupdate', handleTimeUpdate)

    // Store cleanup function
    this.videoListeners.set(videoElement, handleTimeUpdate)

    // Return cleanup function
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      this.videoListeners.delete(videoElement)
    }
  }

  /**
   * Send event (internal)
   */
  private sendEvent(type: MicroEventType, metadata?: Record<string, unknown>): void {
    // Deduplicate
    if (this.firedEvents.has(type)) {
      return
    }

    this.firedEvents.add(type)

    // Fire pixel event
    this.firePixelEvent(MICRO_EVENTS[type].eventName, {
      content_name: MICRO_EVENTS[type].label,
      ...(MICRO_EVENTS[type].customEvent && { custom_event: MICRO_EVENTS[type].customEvent }),
      ...metadata,
    })

    // Send to API (fire-and-forget via sendBeacon)
    this.sendToApi(type, metadata)
  }

  /**
   * Fire Meta Pixel event
   */
  private firePixelEvent(eventName: string, params: Record<string, unknown>): void {
    if (typeof window === 'undefined') return

    const fbq = (window as any).fbq
    if (fbq) {
      try {
        fbq('track', eventName, params)
      } catch (e) {
        console.warn('Failed to fire pixel event:', e)
      }
    }
  }

  /**
   * Send event to our API via sendBeacon
   */
  private sendToApi(type: MicroEventType, metadata?: Record<string, unknown>): void {
    if (typeof window === 'undefined') return

    const payload = JSON.stringify({
      sessionId: this.sessionId,
      campaignId: this.campaignId,
      eventType: type,
      metadata: metadata || {},
      timestamp: Date.now(),
    })

    // Use sendBeacon for fire-and-forget reliability
    if (navigator.sendBeacon) {
      try {
        navigator.sendBeacon('/api/signals/track', payload)
      } catch (e) {
        console.warn('sendBeacon failed, falling back to fetch:', e)
        // Fallback to fetch
        fetch('/api/signals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(err => console.warn('API signal send failed:', err))
      }
    } else {
      // Fallback for older browsers
      fetch('/api/signals/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(err => console.warn('API signal send failed:', err))
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    if (this.scrollListener && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.scrollListener)
    }

    for (const [videoElement, listener] of this.videoListeners.entries()) {
      videoElement.removeEventListener('timeupdate', listener)
    }

    this.videoListeners.clear()
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Get fired events count
   */
  getFiredEventsCount(): number {
    return this.firedEvents.size
  }
}
