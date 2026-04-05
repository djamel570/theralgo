import { NextRequest, NextResponse } from 'next/server'
import { alertService } from '@/lib/alerts'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for processing

// Protect with a secret key to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || ''
const cronLogger = logger.child({ component: 'cron/monitor' })

export async function GET(req: NextRequest) {
  // Verify cron secret via X-CRON-SECRET header
  const cronSecret = req.headers.get('x-cron-secret')
  if (CRON_SECRET && cronSecret !== CRON_SECRET) {
    cronLogger.warn('Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    cronLogger.info('Starting campaign monitor cron job')

    // Call the campaigns monitor endpoint internally
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/campaigns/monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Monitor all active and paused campaigns
    })

    const result = await res.json()

    // Log results for monitoring
    cronLogger.info('Campaign monitor cron completed', {
      campaignsMonitored: result.campaigns_monitored,
      metricsRecorded: result.metrics?.length || 0,
    })

    // Check for campaigns with poor performance and alert
    if (result.metrics && Array.isArray(result.metrics)) {
      const poorPerformers = result.metrics.filter((m: Record<string, unknown>) => {
        const ctr = parseFloat(String(m.ctr || 0))
        const cpl = parseFloat(String(m.cpl || 0))
        // Alert if CTR is very low (< 0.5%) or CPL is very high (> $100)
        return ctr < 0.5 || (cpl > 100 && cpl < 10000) // Avoid false positives with 0 leads
      })

      if (poorPerformers.length > 0) {
        cronLogger.warn('Poor performers detected', { count: poorPerformers.length })
        // Send alert via the alerts system (non-blocking)
        alertService
          .send(
            {
              level: 'warning',
              title: 'Alertes de performance campagne',
              message: `${poorPerformers.length} campagne(s) présentent une performance faible (CTR < 0.5% ou CPL > $100).`,
              details: poorPerformers,
              source: 'campaign_monitor',
            },
            ['webhook', 'database']
          )
          .catch(() => {}) // Non-blocking
      }
    }

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    cronLogger.error('Campaign monitor cron failed', err)

    // Alert operator of cron failure
    alertService
      .send(
        {
          level: 'warning',
          title: 'Cron monitor: erreur',
          message: `La tâche planifiée de surveillance des métriques a échoué: ${err instanceof Error ? err.message : 'erreur inconnue'}`,
          source: 'cron_monitor',
        },
        ['webhook', 'database']
      )
      .catch(() => {})

    return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 })
  }
}
