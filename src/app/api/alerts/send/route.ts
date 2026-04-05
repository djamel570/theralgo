import { NextRequest, NextResponse } from 'next/server'
import { alertService, AlertPayload, AlertChannel } from '@/lib/alerts'
import { AlertSendSchema } from '@/lib/validations'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body
    const validation = AlertSendSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Get authenticated user (optional for internal alerts, but good to verify)
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validatedData = validation.data

    const payload: AlertPayload = {
      level: validatedData.level,
      title: validatedData.title,
      message: validatedData.message,
      details: validatedData.details,
      source: validatedData.source,
      campaign_id: validatedData.campaign_id,
      therapist_name: validatedData.therapist_name,
    }

    const channels: AlertChannel[] = validatedData.channels || ['webhook', 'database']

    // Send alert (non-blocking, wrapped in try-catch)
    await alertService.send(payload, channels).catch((err) => {
      console.error('[alerts/send] Alert send failed:', err)
    })

    return NextResponse.json({
      success: true,
      message: 'Alerte envoyée',
      payload,
    })
  } catch (err) {
    console.error('[alerts/send] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
