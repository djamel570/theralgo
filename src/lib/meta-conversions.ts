/**
 * Meta Conversions API (CAPI) Service
 *
 * Sends server-side events to Meta for better attribution and
 * optimization signal. Used when a lead submits the contact form.
 */

export interface ConversionEvent {
  event_name: 'Lead' | 'CompleteRegistration' | 'Schedule' | 'Contact' | 'ViewContent' | 'Purchase'
  event_time: number // Unix timestamp
  event_id?: string // Deduplication ID
  event_source_url?: string
  action_source: 'website' | 'app' | 'phone_call' | 'chat' | 'email' | 'other'
  user_data: {
    em?: string[] // SHA256 hashed email
    ph?: string[] // SHA256 hashed phone
    fn?: string[] // SHA256 hashed first name
    ln?: string[] // SHA256 hashed last name
    ct?: string[] // SHA256 hashed city
    client_ip_address?: string
    client_user_agent?: string
    fbc?: string // Facebook click ID (from _fbc cookie)
    fbp?: string // Facebook browser ID (from _fbp cookie)
  }
  custom_data?: {
    value?: number
    currency?: string
    content_name?: string
    content_category?: string
    lead_event_source?: string
    [key: string]: unknown
  }
}

export class MetaConversionsAPI {
  private pixelId: string
  private accessToken: string

  constructor(pixelId: string, accessToken?: string) {
    this.pixelId = pixelId
    this.accessToken = accessToken || process.env.META_ACCESS_TOKEN || ''
  }

  // Hash a value with SHA256 for user data matching
  private async hashValue(value: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(value.toLowerCase().trim())
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Prepare user data with proper hashing
  async prepareUserData(userData: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    city?: string
    ipAddress?: string
    userAgent?: string
    fbc?: string
    fbp?: string
  }): Promise<ConversionEvent['user_data']> {
    const prepared: ConversionEvent['user_data'] = {}

    if (userData.email) prepared.em = [await this.hashValue(userData.email)]
    if (userData.phone) prepared.ph = [await this.hashValue(userData.phone.replace(/\D/g, ''))]
    if (userData.firstName) prepared.fn = [await this.hashValue(userData.firstName)]
    if (userData.lastName) prepared.ln = [await this.hashValue(userData.lastName)]
    if (userData.city) prepared.ct = [await this.hashValue(userData.city)]
    if (userData.ipAddress) prepared.client_ip_address = userData.ipAddress
    if (userData.userAgent) prepared.client_user_agent = userData.userAgent
    if (userData.fbc) prepared.fbc = userData.fbc
    if (userData.fbp) prepared.fbp = userData.fbp

    return prepared
  }

  // Send an event to Meta CAPI
  async sendEvent(event: ConversionEvent): Promise<{ events_received: number; fbtrace_id: string }> {
    const url = `https://graph.facebook.com/v21.0/${this.pixelId}/events`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [event],
        access_token: this.accessToken,
      }),
    })

    const data = await res.json()
    if (!res.ok || data.error) {
      throw new Error(`CAPI Error: ${data.error?.message || 'Unknown error'}`)
    }

    return data
  }

  // Convenience: Send a Lead event
  async sendLeadEvent(params: {
    email: string
    phone?: string
    firstName?: string
    city?: string
    sourceUrl?: string
    ipAddress?: string
    userAgent?: string
    fbc?: string
    fbp?: string
    eventId?: string
    contentName?: string
  }): Promise<{ events_received: number; fbtrace_id: string }> {
    const userData = await this.prepareUserData({
      email: params.email,
      phone: params.phone,
      firstName: params.firstName,
      city: params.city,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    })

    return this.sendEvent({
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: params.eventId || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      event_source_url: params.sourceUrl,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        content_name: params.contentName || 'Contact Form',
        lead_event_source: 'theralgo_platform',
      },
    })
  }

  // Convenience: Send an Appointment/Schedule event
  async sendAppointmentEvent(params: {
    email: string
    phone?: string
    firstName?: string
    value?: number
    currency?: string
    sourceUrl?: string
    ipAddress?: string
    userAgent?: string
    fbc?: string
    fbp?: string
  }): Promise<{ events_received: number; fbtrace_id: string }> {
    const userData = await this.prepareUserData({
      email: params.email,
      phone: params.phone,
      firstName: params.firstName,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    })

    return this.sendEvent({
      event_name: 'Schedule',
      event_time: Math.floor(Date.now() / 1000),
      event_id: `schedule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      event_source_url: params.sourceUrl,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        value: params.value,
        currency: params.currency || 'EUR',
        content_name: 'Appointment Booking',
      },
    })
  }
}

// Factory
export function createConversionsClient(pixelId: string): MetaConversionsAPI {
  return new MetaConversionsAPI(pixelId)
}
