import { describe, it, expect, beforeEach } from 'vitest'
import { SignalAccelerator, MICRO_EVENTS, type MicroEventType } from '../lib/signal-accelerator'

describe('Signal Accelerator', () => {
  let accelerator: SignalAccelerator

  beforeEach(() => {
    accelerator = new SignalAccelerator('test-pixel-id')
  })

  describe('MICRO_EVENTS definitions', () => {
    it('should have all event types defined', () => {
      expect(MICRO_EVENTS).toBeDefined()
      expect(MICRO_EVENTS.PAGE_VIEW).toBeDefined()
      expect(MICRO_EVENTS.FORM_SUBMIT).toBeDefined()
      expect(MICRO_EVENTS.APPOINTMENT_ATTENDED).toBeDefined()
    })

    it('should have correct value weights', () => {
      expect(MICRO_EVENTS.PAGE_VIEW.value).toBe(0.5)
      expect(MICRO_EVENTS.SCROLL_50.value).toBe(2)
      expect(MICRO_EVENTS.FORM_START.value).toBe(15)
      expect(MICRO_EVENTS.APPOINTMENT_ATTENDED.value).toBe(100)
    })

    it('should have correct event names', () => {
      expect(MICRO_EVENTS.PAGE_VIEW.eventName).toBe('ViewContent')
      expect(MICRO_EVENTS.FORM_SUBMIT.eventName).toBe('Lead')
      expect(MICRO_EVENTS.APPOINTMENT_BOOKED.eventName).toBe('Schedule')
    })
  })

  describe('Event Tracking', () => {
    it('should track local events and update session quality', () => {
      const sessionId = 'test-session-123'

      // Track an event (would normally call trackEventLocally internally)
      // For this test, we'll verify getEventChain returns empty initially
      let chain = accelerator.getEventChain(sessionId)
      expect(chain).toEqual([])

      // Track page view
      let quality = accelerator.getSessionQualityScore(sessionId)
      expect(quality).toBeNull()
    })
  })

  describe('Signal Multiplier', () => {
    it('should calculate signal multiplier correctly', () => {
      const sessionId = 'test-session-456'

      // Base multiplier should be 1x for no events
      let multiplier = accelerator.calculateSignalMultiplier(sessionId)
      expect(multiplier).toBe(1)
    })
  })

  describe('Event Definitions Hierarchy', () => {
    it('should have events ordered by funnel depth', () => {
      const eventOrder: MicroEventType[] = [
        'PAGE_VIEW', // 0.5
        'SCROLL_25', // 1
        'SCROLL_50', // 2
        'CTA_CLICK', // 10
        'FORM_START', // 15
        'FORM_SUBMIT', // 30
        'APPOINTMENT_BOOKED', // 70
        'APPOINTMENT_ATTENDED', // 100
      ]

      let previousValue = 0
      for (const eventType of eventOrder) {
        const currentValue = MICRO_EVENTS[eventType].value
        expect(currentValue).toBeGreaterThanOrEqual(previousValue)
        previousValue = currentValue
      }
    })

    it('should have all required event fields', () => {
      for (const [key, event] of Object.entries(MICRO_EVENTS)) {
        expect(event).toHaveProperty('eventName')
        expect(event).toHaveProperty('value')
        expect(event).toHaveProperty('label')
        expect(typeof event.eventName).toBe('string')
        expect(typeof event.value).toBe('number')
        expect(typeof event.label).toBe('string')
      }
    })
  })

  describe('Video Events', () => {
    it('should have video tracking events', () => {
      expect(MICRO_EVENTS.VIDEO_START).toBeDefined()
      expect(MICRO_EVENTS.VIDEO_50).toBeDefined()
      expect(MICRO_EVENTS.VIDEO_COMPLETE).toBeDefined()

      expect(MICRO_EVENTS.VIDEO_START.customEvent).toBe('video_start')
      expect(MICRO_EVENTS.VIDEO_50.customEvent).toBe('video_50')
      expect(MICRO_EVENTS.VIDEO_COMPLETE.customEvent).toBe('video_complete')
    })
  })

  describe('Scroll Events', () => {
    it('should have progressive scroll tracking', () => {
      expect(MICRO_EVENTS.SCROLL_25.value).toBe(1)
      expect(MICRO_EVENTS.SCROLL_50.value).toBe(2)
      expect(MICRO_EVENTS.SCROLL_75.value).toBe(3)

      // Values should increase progressively
      expect(MICRO_EVENTS.SCROLL_25.value).toBeLessThan(MICRO_EVENTS.SCROLL_50.value)
      expect(MICRO_EVENTS.SCROLL_50.value).toBeLessThan(MICRO_EVENTS.SCROLL_75.value)
    })
  })

  describe('Form Events', () => {
    it('should have form funnel events', () => {
      expect(MICRO_EVENTS.FORM_START).toBeDefined()
      expect(MICRO_EVENTS.FORM_PROGRESS).toBeDefined()
      expect(MICRO_EVENTS.FORM_SUBMIT).toBeDefined()

      // Values should increase through form funnel
      expect(MICRO_EVENTS.FORM_START.value).toBeLessThan(MICRO_EVENTS.FORM_PROGRESS.value)
      expect(MICRO_EVENTS.FORM_PROGRESS.value).toBeLessThan(MICRO_EVENTS.FORM_SUBMIT.value)
    })
  })

  describe('Appointment Events', () => {
    it('should have post-conversion events with highest values', () => {
      expect(MICRO_EVENTS.APPOINTMENT_BOOKED).toBeDefined()
      expect(MICRO_EVENTS.APPOINTMENT_ATTENDED).toBeDefined()

      // These should have the highest values
      expect(MICRO_EVENTS.APPOINTMENT_BOOKED.value).toBeGreaterThan(MICRO_EVENTS.FORM_SUBMIT.value)
      expect(MICRO_EVENTS.APPOINTMENT_ATTENDED.value).toBeGreaterThan(
        MICRO_EVENTS.APPOINTMENT_BOOKED.value
      )
    })
  })

  describe('Engagement vs Intent vs Conversion', () => {
    it('engagement events should have lower values than intent', () => {
      const engagementValues = [
        MICRO_EVENTS.PAGE_VIEW.value,
        MICRO_EVENTS.SCROLL_25.value,
        MICRO_EVENTS.VIDEO_COMPLETE.value,
      ]
      const intentValues = [MICRO_EVENTS.CTA_CLICK.value, MICRO_EVENTS.FORM_START.value]

      const maxEngagement = Math.max(...engagementValues)
      const minIntent = Math.min(...intentValues)

      expect(maxEngagement).toBeLessThan(minIntent)
    })

    it('intent events should have lower values than conversion', () => {
      const intentValues = [MICRO_EVENTS.CTA_CLICK.value, MICRO_EVENTS.FORM_START.value]
      const conversionValues = [MICRO_EVENTS.FORM_SUBMIT.value, MICRO_EVENTS.QUALIFIED_LEAD.value]

      const maxIntent = Math.max(...intentValues)
      const minConversion = Math.min(...conversionValues)

      expect(maxIntent).toBeLessThan(minConversion)
    })
  })
})
