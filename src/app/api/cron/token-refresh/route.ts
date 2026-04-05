import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { alertService } from '@/lib/alerts'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Allow up to 30 seconds for processing

// Protect with a secret key to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || ''
const cronLogger = logger.child({ component: 'cron/token-refresh' })

export async function GET(req: NextRequest) {
  // Verify cron secret via X-CRON-SECRET header
  const cronSecret = req.headers.get('x-cron-secret')
  if (CRON_SECRET && cronSecret !== CRON_SECRET) {
    cronLogger.warn('Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    cronLogger.info('Starting token refresh cron job')
    const supabase = createServiceSupabaseClient()
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    if (!appId || !appSecret) {
      throw new Error('META_APP_ID or META_APP_SECRET not configured')
    }

    // Fetch all active tokens from the database
    const { data: tokens, error: fetchError } = await supabase
      .from('meta_tokens')
      .select('*')
      .eq('is_active', true)

    if (fetchError) throw fetchError
    if (!tokens || tokens.length === 0) {
      cronLogger.info('No tokens to refresh')
      return NextResponse.json({ success: true, message: 'Aucun token à rafraîchir', refreshed: 0 })
    }

    cronLogger.info('Processing tokens', { count: tokens.length })

    const results = []
    const expiringThreshold = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

    for (const token of tokens) {
      try {
        const expiresAt = new Date(token.expires_at as string).getTime()
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now

        // Check if token is expiring within 7 days
        if (timeUntilExpiry > expiringThreshold) {
          results.push({
            token_type: token.token_type,
            status: 'ok',
            days_until_expiry: Math.floor(timeUntilExpiry / (24 * 60 * 60 * 1000)),
          })
          continue
        }

        // Token is expiring soon, refresh it
        cronLogger.info('Refreshing token', { tokenType: token.token_type })

        const refreshUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token')
        refreshUrl.searchParams.append('grant_type', 'fb_exchange_token')
        refreshUrl.searchParams.append('client_id', appId)
        refreshUrl.searchParams.append('client_secret', appSecret)
        refreshUrl.searchParams.append('fb_exchange_token', token.access_token as string)

        const refreshRes = await fetch(refreshUrl.toString())
        const refreshData = await refreshRes.json()

        if (refreshData.error) {
          throw new Error(`Meta API error: ${refreshData.error.message}`)
        }

        if (!refreshData.access_token) {
          throw new Error('No new token in Meta response')
        }

        // Calculate new expiry time (usually 60 days from refresh)
        const expiresInSeconds = refreshData.expires_in || 5184000 // 60 days default
        const newExpiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

        // Update token in database
        const { error: updateError } = await supabase
          .from('meta_tokens')
          .update({
            access_token: refreshData.access_token,
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', token.id)

        if (updateError) throw updateError

        // Optionally update environment variable (for session use)
        if (token.token_type === 'access_token') {
          process.env.META_ACCESS_TOKEN = refreshData.access_token
        }

        results.push({
          token_type: token.token_type,
          status: 'refreshed',
          new_expiry: newExpiresAt,
        })

        // Send success alert
        cronLogger.info('Token refreshed successfully', { tokenType: token.token_type, newExpiry: newExpiresAt })
        await alertService.send(
          {
            level: 'info',
            title: 'Meta token rafraîchi',
            message: `Le token ${token.token_type} a été rafraîchi avec succès. Nouvelle expiration: ${newExpiresAt}`,
            source: 'token_refresh',
          },
          ['database']
        )
      } catch (tokenErr) {
        cronLogger.error('Error refreshing token', tokenErr, { tokenId: token.id, tokenType: token.token_type })

        results.push({
          token_type: token.token_type,
          status: 'failed',
          error: tokenErr instanceof Error ? tokenErr.message : 'erreur inconnue',
        })

        // Send failure alert
        await alertService
          .send(
            {
              level: 'critical',
              title: 'Erreur: rafraîchissement du token Meta',
              message: `Impossible de rafraîchir le token ${token.token_type}: ${tokenErr instanceof Error ? tokenErr.message : 'erreur inconnue'}`,
              details: {
                token_type: token.token_type,
                expires_at: token.expires_at,
              },
              source: 'token_refresh',
            },
            ['webhook', 'database']
          )
          .catch(() => {})
      }
    }

    const refreshedCount = results.filter((r) => r.status === 'refreshed').length

    cronLogger.info('Token refresh cron completed', {
      tokensChecked: tokens.length,
      tokensRefreshed: refreshedCount,
    })

    return NextResponse.json({
      success: true,
      tokens_checked: tokens.length,
      tokens_refreshed: refreshedCount,
      results,
    })
  } catch (err) {
    cronLogger.error('Token refresh cron failed', err)

    // Alert operator of cron failure
    await alertService
      .send(
        {
          level: 'critical',
          title: 'Cron token-refresh: erreur',
          message: `La tâche planifiée de rafraîchissement des tokens a échoué: ${err instanceof Error ? err.message : 'erreur inconnue'}`,
          source: 'cron_token_refresh',
        },
        ['webhook', 'database']
      )
      .catch(() => {})

    return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 })
  }
}
