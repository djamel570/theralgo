import { NextRequest, NextResponse } from 'next/server'
import { alertService } from '@/lib/alerts'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for processing

// Protect with a secret key to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || ''
const cronLogger = logger.child({ component: 'cron/optimize' })

export async function GET(req: NextRequest) {
  // Verify cron secret via X-CRON-SECRET header
  const cronSecret = req.headers.get('x-cron-secret')
  if (CRON_SECRET && cronSecret !== CRON_SECRET) {
    cronLogger.warn('Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    cronLogger.info('Starting optimization cron job')

    // Call the optimization agent endpoint internally
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/agent/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Optimize all active campaigns
    })

    const result = await res.json()

    // Log results for monitoring
    cronLogger.info('Optimization cron completed', {
      campaignsAnalyzed: result.campaigns_analyzed,
      totalDecisions: result.total_decisions,
    })

    // Send alerts if there are critical decisions
    if (result.results) {
      const criticalDecisions = result.results.flatMap((r: Record<string, unknown>) =>
        ((r.decisions as Array<Record<string, unknown>>) || []).filter(
          (d: Record<string, unknown>) => d.type === 'pause_campaign' || d.type === 'alert_operator'
        )
      )

      if (criticalDecisions.length > 0) {
        cronLogger.warn('Critical decisions detected, sending alerts', { count: criticalDecisions.length })
        // Send alert via the alerts system (non-blocking)
        alertService
          .send(
            {
              level: 'critical',
              title: 'Agent: décision critique détectée',
              message: `L'agent d'optimisation a détecté ${criticalDecisions.length} décision(s) critique(s) et a pris action.`,
              details: criticalDecisions,
              source: 'optimization_agent',
            },
            ['webhook', 'database']
          )
          .catch(() => {}) // Non-blocking
      }
    }

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    cronLogger.error('Optimization cron failed', err)

    // Alert operator of cron failure
    alertService
      .send(
        {
          level: 'warning',
          title: 'Cron optimize: erreur',
          message: `La tâche planifiée d'optimisation a échoué: ${err instanceof Error ? err.message : 'erreur inconnue'}`,
          source: 'cron_optimize',
        },
        ['webhook', 'database']
      )
      .catch(() => {})

    return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 })
  }
}
