'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

// Design tokens
const GREEN = '#72C15F'
const CREAM = '#F7F4EE'
const DARK = '#1A1A1A'
const MUTED = '#6B7280'
const WHITE = '#FFFFFF'

interface FunnelStage {
  stage: string
  count: number
  percentage: number
}

interface SignalAnalyticsData {
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

interface SignalFunnelProps {
  campaignId: string
}

export default function SignalFunnel({ campaignId }: SignalFunnelProps) {
  const [analytics, setAnalytics] = useState<SignalAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/signals/analytics?campaignId=${campaignId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }

        const data = await response.json()
        setAnalytics(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setAnalytics(null)
      } finally {
        setLoading(false)
      }
    }

    if (campaignId) {
      fetchAnalytics()
    }
  }, [campaignId])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: MUTED }}>
        <p>Loading signal analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>
        <p>Error: {error}</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: MUTED }}>
        <p>No analytics data available yet</p>
      </div>
    )
  }

  const maxCount = Math.max(...analytics.funnel.map(f => f.count), 1)

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: DARK }}>
      {/* ─────────────────────────────────────────────────────── */}
      {/* Key Metrics Row */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Total Sessions */}
        <div
          style={{
            background: WHITE,
            border: `1px solid #E5E7EB`,
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <p style={{ fontSize: '0.85rem', color: MUTED, fontWeight: 600, marginBottom: '0.5rem' }}>
            Total Sessions
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: DARK }}>
            {analytics.totalSessions.toLocaleString()}
          </p>
        </div>

        {/* Total Events */}
        <div
          style={{
            background: WHITE,
            border: `1px solid #E5E7EB`,
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <p style={{ fontSize: '0.85rem', color: MUTED, fontWeight: 600, marginBottom: '0.5rem' }}>
            Micro-Events Fired
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: DARK }}>
            {analytics.totalEvents.toLocaleString()}
          </p>
        </div>

        {/* Signal Multiplier */}
        <div
          style={{
            background: GREEN,
            borderRadius: '12px',
            padding: '1.5rem',
            color: WHITE,
          }}
        >
          <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', opacity: 0.9 }}>
            Signal Multiplier
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <p style={{ fontSize: '2rem', fontWeight: 800 }}>
              {analytics.signalMultiplier.toFixed(1)}x
            </p>
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Conversion Rate */}
        <div
          style={{
            background: WHITE,
            border: `1px solid #E5E7EB`,
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <p style={{ fontSize: '0.85rem', color: MUTED, fontWeight: 600, marginBottom: '0.5rem' }}>
            Conversion Rate
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: DARK }}>
            {analytics.conversionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* Funnel Visualization */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: WHITE,
          border: `1px solid #E5E7EB`,
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: DARK }}>
          Signal Funnel
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {analytics.funnel.map((stage, index) => {
            const widthPercent = (stage.count / maxCount) * 100 || 5
            const dropoff = index > 0 ? analytics.funnel[index - 1].count - stage.count : 0

            return (
              <div key={stage.stage}>
                {/* Stage Label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: DARK }}>
                    {stage.stage}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: MUTED }}>
                    <span>{stage.count.toLocaleString()} visitors</span>
                    <span>{stage.percentage.toFixed(1)}%</span>
                    {dropoff > 0 && (
                      <span style={{ color: '#EF4444' }}>
                        -{dropoff.toLocaleString()} drop-off
                      </span>
                    )}
                  </div>
                </div>

                {/* Bar */}
                <div
                  style={{
                    height: '32px',
                    background: '#F3F4F6',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(widthPercent, 5)}%`,
                      background: GREEN,
                      borderRadius: '8px',
                      transition: 'width 0.5s ease',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '1rem',
                      color: WHITE,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    {widthPercent > 15 && `${stage.count.toLocaleString()}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* Event Breakdown */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Event Types */}
        <div
          style={{
            background: WHITE,
            border: `1px solid #E5E7EB`,
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: DARK }}>
            Event Types Distribution
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(analytics.conversionMetrics.eventTypes)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([eventType, count]) => (
                <div key={eventType} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', color: DARK }}>
                    {eventType.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: GREEN }}>
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Average Session Quality */}
        <div
          style={{
            background: CREAM,
            borderRadius: '12px',
            padding: '1.5rem',
            border: `1px solid #E5E7EB`,
          }}
        >
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: DARK }}>
            Session Quality
          </h4>
          <div>
            <p style={{ fontSize: '0.9rem', color: MUTED, marginBottom: '0.75rem' }}>
              Avg Events per Session
            </p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: GREEN, marginBottom: '1rem' }}>
              {analytics.averageSessionQuality.toFixed(1)}
            </p>
            <p style={{ fontSize: '0.85rem', color: MUTED, lineHeight: 1.6 }}>
              Higher quality sessions engage more with your content before converting.
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* Insights */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: '2rem',
          background: CREAM,
          borderRadius: '12px',
          padding: '1.5rem',
          border: `2px solid ${GREEN}`,
        }}
      >
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: DARK }}>
          Signal Accelerator Impact
        </h4>
        <ul style={{ fontSize: '0.95rem', color: DARK, lineHeight: 1.8, marginLeft: '1.5rem' }}>
          <li>
            Traditional setup sends <strong>1 event</strong> per form submission. Signal Accelerator
            sends <strong>{analytics.signalMultiplier.toFixed(1)}x more events</strong> throughout
            the customer journey.
          </li>
          <li>
            This acceleration teaches Meta's algorithm quality signals <strong>8 days faster</strong> (4
            days vs 21 days).
          </li>
          <li>
            Your campaign has collected <strong>{analytics.totalEvents.toLocaleString()} micro-events</strong> across{' '}
            <strong>{analytics.totalSessions.toLocaleString()} sessions</strong>.
          </li>
        </ul>
      </div>
    </div>
  )
}
