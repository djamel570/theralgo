import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { publicApiLimiter } from '@/lib/rate-limit'
import { createSignalAccelerator } from '@/lib/signal-accelerator'
import type { MicroEventType } from '@/lib/signal-accelerator'

export const dynamic = 'force-dynamic'

/**
 * Validation schema for micro-event tracking
 */
const TrackSignalSchema = z.object({
  sessionId: z.string().min(1, 'sessionId required'),
  campaignId: z.string().min(1, 'campaignId required'),
  eventType: z.string().min(1, 'eventType required'),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.number().positive().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Extract client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'

    // Apply rate limiting (allow 50 signal events per minute per IP)
    const rateLimit = await publicApiLimiter.check(50, clientIp)
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimit.reset,
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.reset) } }
      )
    }

    const body = await req.json()

    // Validate request body
    const validation = TrackSignalSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { sessionId, campaignId, eventType, metadata, timestamp } = validation.data

    const supabase = createServiceSupabaseClient()

    // Verify campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id, generated_content')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Store the micro-event in database
    const { error: insertError } = await supabase.from('micro_events').insert({
      session_id: sessionId,
      campaign_id: campaignId,
      event_type: eventType as MicroEventType,
      metadata: metadata || {},
      created_at: new Date(timestamp || Date.now()).toISOString(),
    })

    if (insertError) {
      console.error('Failed to insert micro-event:', insertError)
      // Don't fail the request for DB errors
    }

    // Send to Meta CAPI if this is a significant event
    const significantEvents = [
      'CTA_CLICK',
      'FORM_START',
      'FORM_SUBMIT',
      'QUALIFIED_LEAD',
      'APPOINTMENT_BOOKED',
      'APPOINTMENT_ATTENDED',
    ]

    if (significantEvents.includes(eventType)) {
      const pixelId = campaign.generated_content?.meta_ids?.pixel_id || process.env.META_DEFAULT_PIXEL_ID

      if (pixelId && process.env.META_ACCESS_TOKEN) {
        try {
          const accelerator = createSignalAccelerator(pixelId)

          // Extract user data from request headers/cookies if available
          const cookies = req.headers.get('cookie') || ''
          const fbcMatch = cookies.match(/_fbc=([^;]+)/)
          const fbpMatch = cookies.match(/_fbp=([^;]+)/)

          // Send the micro-event to CAPI
          await accelerator.sendMicroEvent(
            eventType as MicroEventType,
            sessionId,
            {
              ipAddress: clientIp,
              userAgent: req.headers.get('user-agent') || undefined,
              fbc: fbcMatch ? fbcMatch[1] : undefined,
              fbp: fbpMatch ? fbpMatch[1] : undefined,
            },
            metadata
          )
        } catch (capiError) {
          // Log but don't fail the request
          console.warn('Failed to send micro-event to CAPI:', capiError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      sessionId,
      eventType,
      stored: !insertError,
    })
  } catch (err) {
    console.error('Signal tracking error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
