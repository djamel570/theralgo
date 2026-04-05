import { logger } from './logger'

export type AlertLevel = 'info' | 'warning' | 'critical'
export type AlertChannel = 'webhook' | 'email' | 'database'

export interface AlertPayload {
  level: AlertLevel
  title: string
  message: string
  details?: unknown
  source: string // e.g. 'optimization_agent', 'token_refresh', 'campaign_deploy'
  campaign_id?: string
  therapist_name?: string
}

export class AlertService {
  private alertLogger = logger.child({ component: 'AlertService' })

  // Send to Slack/Discord webhook
  private async sendWebhook(payload: AlertPayload): Promise<void> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL
    if (!webhookUrl) {
      this.alertLogger.debug('Webhook URL not configured, skipping webhook send')
      return
    }

    const emoji = { info: 'ℹ️', warning: '⚠️', critical: '🚨' }[payload.level]

    try {
      this.alertLogger.debug('Sending alert to webhook', { source: payload.source, level: payload.level })
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${emoji} *${payload.title}*\n${payload.message}${payload.therapist_name ? `\nThérapeute: ${payload.therapist_name}` : ''}`,
          // Slack-compatible format:
          blocks: [
            { type: 'header', text: { type: 'plain_text', text: `${emoji} ${payload.title}` } },
            { type: 'section', text: { type: 'mrkdwn', text: payload.message } },
            ...(payload.details
              ? [
                  {
                    type: 'section',
                    text: {
                      type: 'mrkdwn',
                      text: '```' + JSON.stringify(payload.details, null, 2).substring(0, 2000) + '```',
                    },
                  },
                ]
              : []),
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `_Source: ${payload.source} • ${new Date().toISOString()}_`,
                },
              ],
            },
          ],
        }),
      })
      this.alertLogger.debug('Alert sent to webhook successfully')
    } catch (e) {
      this.alertLogger.error('Webhook send failed', e)
    }
  }

  // Save to Supabase for dashboard display
  private async saveToDatabase(payload: AlertPayload): Promise<void> {
    try {
      this.alertLogger.debug('Saving alert to database', { source: payload.source, level: payload.level })
      const { createServiceSupabaseClient } = await import('./supabase-server')
      const supabase = createServiceSupabaseClient()
      await supabase.from('alerts').insert({
        level: payload.level,
        title: payload.title,
        message: payload.message,
        details: payload.details,
        source: payload.source,
        campaign_id: payload.campaign_id,
        therapist_name: payload.therapist_name,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      this.alertLogger.debug('Alert saved to database successfully')
    } catch (e) {
      this.alertLogger.error('DB save failed', e)
    }
  }

  async send(payload: AlertPayload, channels: AlertChannel[] = ['webhook', 'database']): Promise<void> {
    this.alertLogger.info('Sending alert', { title: payload.title, level: payload.level, channels })
    const promises: Promise<void>[] = []
    if (channels.includes('webhook')) promises.push(this.sendWebhook(payload))
    if (channels.includes('database')) promises.push(this.saveToDatabase(payload))
    await Promise.allSettled(promises)
  }
}

export const alertService = new AlertService()
