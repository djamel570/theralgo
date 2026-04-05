'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  TrendingUp,
  Euro,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Activity,
  Flame,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { OnboardingTrack } from '@/lib/onboarding'

const GN = '#72C15F'
const DK = '#1A1A1A'
const M = '#6B7280'
const C = '#F7F4EE'
const W = '#FFFFFF'
const LV = '#C4B5FD'
const YL = '#FBD24D'
const RD = '#FF6B6B'

interface CommandCenterProps {
  userId: string
}

interface MetricsData {
  patientsAcquired: number
  patientsTrend: number
  leadsWaiting: number
  leadsStatus: Array<{ status: string; count: number }>
  productRevenue: number
  revenueTrend: number
  roi: number
  roiTrend: number
  campaignStatus: 'active' | 'paused' | 'learning'
  signalMultiplier: number
  bestSegment: string
  nextOptimization: string
  flywheelHealth: 'positive' | 'neutral' | 'negative'
  recommendations: Array<{
    id: string
    title: string
    description: string
    cta: string
    href: string
    priority: 'high' | 'medium' | 'low'
  }>
}

function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendDirection,
  sub,
  color,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  trend?: number
  trendDirection?: 'up' | 'down'
  sub?: string
  color: string
}) {
  const TrendIcon = trendDirection === 'up' ? ArrowUpRight : ArrowDownRight
  const trendColor = trendDirection === 'up' ? GN : RD

  return (
    <div
      style={{
        background: W,
        borderRadius: 20,
        padding: '1.75rem',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent blob */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: color,
          opacity: 0.08,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={color} />
        </div>
        {trend !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.25rem 0.65rem',
              borderRadius: 999,
              background: `${trendColor}18`,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: trendColor,
            }}
          >
            <TrendIcon size={13} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p style={{ fontWeight: 800, fontSize: '2.2rem', color: DK, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 6 }}>
        {value}
      </p>
      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: DK, marginBottom: 2 }}>{label}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: M }}>{sub}</p>}
    </div>
  )
}

function FlywheelDiagram({ health }: { health: 'positive' | 'neutral' | 'negative' }) {
  const healthColor = health === 'positive' ? GN : health === 'neutral' ? YL : RD
  const stages = [
    { label: 'Ad Spend', position: 0 },
    { label: 'Leads', position: 25 },
    { label: 'Patients', position: 50 },
    { label: 'Revenue', position: 75 },
  ]

  return (
    <div
      style={{
        background: W,
        borderRadius: 20,
        padding: '2rem',
        border: '1px solid rgba(0,0,0,0.08)',
        position: 'relative',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: DK, marginBottom: 8 }}>
          État du Flywheel
        </h3>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '0.5rem 1rem',
            borderRadius: 999,
            background: `${healthColor}15`,
            border: `1px solid ${healthColor}30`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: healthColor,
              animation: health === 'positive' ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: healthColor,
            }}
          >
            {health === 'positive'
              ? 'Flywheel positif - Les produits financent les publicités'
              : health === 'neutral'
                ? 'Équilibre - Presque rentable'
                : 'À améliorer - Vous investissez plus que vous gagnez'}
          </span>
        </div>
      </div>

      {/* Circular diagram */}
      <div
        style={{
          position: 'relative',
          width: 280,
          height: 280,
          margin: '0 auto',
        }}
      >
        <svg
          viewBox="0 0 280 280"
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          {/* Outer circle */}
          <circle cx="140" cy="140" r="120" fill="none" stroke={C} strokeWidth="2" />

          {/* Arrows connecting stages */}
          {stages.map((stage, i) => {
            const nextStage = stages[(i + 1) % stages.length]
            const angle1 = (stage.position * 360) / 100 - 90
            const angle2 = (nextStage.position * 360) / 100 - 90
            const radius = 120

            const x1 = 140 + radius * Math.cos((angle1 * Math.PI) / 180)
            const y1 = 140 + radius * Math.sin((angle1 * Math.PI) / 180)
            const x2 = 140 + radius * Math.cos((angle2 * Math.PI) / 180)
            const y2 = 140 + radius * Math.sin((angle2 * Math.PI) / 180)

            return (
              <g key={`arrow-${i}`}>
                <defs>
                  <marker
                    id={`arrowhead-${i}`}
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill={healthColor} />
                  </marker>
                </defs>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={healthColor}
                  strokeWidth="2"
                  markerEnd={`url(#arrowhead-${i})`}
                  opacity="0.6"
                />
              </g>
            )
          })}

          {/* Stage indicators */}
          {stages.map((stage, i) => {
            const angle = (stage.position * 360) / 100 - 90
            const radius = 120
            const x = 140 + radius * Math.cos((angle * Math.PI) / 180)
            const y = 140 + radius * Math.sin((angle * Math.PI) / 180)

            return (
              <g key={`stage-${i}`}>
                <circle cx={x} cy={y} r="20" fill={healthColor} opacity="0.15" />
                <circle cx={x} cy={y} r="20" fill="none" stroke={healthColor} strokeWidth="2" />
              </g>
            )
          })}

          {/* Center text */}
          <text
            x="140"
            y="135"
            textAnchor="middle"
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              fill: DK,
            }}
          >
            Flywheel
          </text>
          <text
            x="140"
            y="155"
            textAnchor="middle"
            style={{
              fontSize: '0.75rem',
              fill: M,
            }}
          >
            ROI optimisé
          </text>
        </svg>

        {/* Stage labels */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: DK }}>Ad Spend</p>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: DK }}>Revenue</p>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: DK }}>Leads</p>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: DK }}>Patients</p>
        </div>
      </div>
    </div>
  )
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: {
    id: string
    title: string
    description: string
    cta: string
    href: string
    priority: 'high' | 'medium' | 'low'
  }
}) {
  const priorityColor =
    recommendation.priority === 'high' ? RD : recommendation.priority === 'medium' ? YL : GN

  return (
    <Link href={recommendation.href}>
      <div
        style={{
          background: W,
          borderRadius: 16,
          padding: '1.5rem',
          border: `1px solid ${priorityColor}30`,
          cursor: 'pointer',
          transition: 'all 0.25s',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = `${priorityColor}60`
          el.style.background = `${priorityColor}05`
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = `${priorityColor}30`
          el.style.background = W
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${priorityColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {recommendation.priority === 'high' && <AlertCircle size={20} color={priorityColor} />}
          {recommendation.priority === 'medium' && <Activity size={20} color={priorityColor} />}
          {recommendation.priority === 'low' && <CheckCircle2 size={20} color={priorityColor} />}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: DK }}>
              {recommendation.title}
            </h4>
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.65rem',
                borderRadius: 999,
                background: `${priorityColor}18`,
                fontSize: '0.65rem',
                fontWeight: 700,
                color: priorityColor,
                textTransform: 'uppercase',
              }}
            >
              {recommendation.priority === 'high'
                ? 'Urgent'
                : recommendation.priority === 'medium'
                  ? 'Important'
                  : 'À faire'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: M, marginBottom: 8, lineHeight: 1.5 }}>
            {recommendation.description}
          </p>
          <p
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: DK,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {recommendation.cta}
            <ArrowUpRight size={12} />
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function CommandCenter({ userId }: CommandCenterProps) {
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userTrack, setUserTrack] = useState<OnboardingTrack | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserTrack = async () => {
      try {
        const { data } = await supabase
          .from('onboarding_progress')
          .select('selected_track')
          .eq('user_id', userId)
          .single()

        setUserTrack((data?.selected_track as OnboardingTrack) || null)
      } catch (err) {
        console.error('Error fetching user track:', err)
      }
    }

    fetchUserTrack()
  }, [userId, supabase])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/dashboard/overview', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const json = await response.json()
        setData(json)
      } catch (err) {
        console.error('Error fetching command center data:', err)
        setError('Impossible de charger les données du tableau de bord')

        // Set mock data for development
        setData({
          patientsAcquired: 12,
          patientsTrend: 35,
          leadsWaiting: 8,
          leadsStatus: [
            { status: 'Nouveaux', count: 5 },
            { status: 'En cours', count: 3 },
          ],
          productRevenue: 450,
          revenueTrend: 22,
          roi: 2.8,
          roiTrend: 15,
          campaignStatus: 'active',
          signalMultiplier: 8.2,
          bestSegment: 'Professionnels stressés',
          nextOptimization: 'Demain à 14h',
          flywheelHealth: 'positive',
          recommendations: [
            {
              id: 'video-score',
              title: 'Vidéo score 45/100',
              description:
                'Améliorez le hook dans les 3 premières secondes pour augmenter le CTR de +30%',
              cta: 'Améliorer la vidéo',
              href: '/dashboard/media',
              priority: 'high',
            },
            {
              id: 'leads-follow',
              title: '3 leads non contactés',
              description:
                'Ces leads ne vous ont pas été contactés depuis 48h. Appelez-les avant qu\'ils refroidissent.',
              cta: 'Voir les leads',
              href: '/dashboard/results',
              priority: 'high',
            },
            {
              id: 'product-campaign',
              title: 'Lancer campagne produit',
              description:
                'Votre programme audio est prêt mais n\'a pas encore de campagne de promotion.',
              cta: 'Créer une campagne',
              href: '/dashboard/admin/products',
              priority: 'medium',
            },
          ],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 600,
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <Loader2 size={40} color={GN} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: M, fontSize: '0.95rem' }}>Chargement du Command Center...</p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
        `}</style>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div
        style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1.5px solid rgba(239,68,68,0.3)',
          borderRadius: 16,
          padding: '1.5rem',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <AlertCircle size={20} color={RD} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: RD, marginBottom: 6 }}>
            Erreur de chargement
          </p>
          <p style={{ fontSize: '0.85rem', color: '#C0392B' }}>{error}</p>
        </div>
      </div>
    )
  }

  // Determine which metrics to show based on track
  const showAcquisitionMetrics = userTrack === 'acquisition' || userTrack === 'both'
  const showProductMetrics = userTrack === 'digital_products' || userTrack === 'both'
  const showFlywheel = userTrack === 'both'

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Top Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: '2rem',
        }}
      >
        {showAcquisitionMetrics && (
          <>
            <MetricCard
              label="Patients acquis"
              value={data.patientsAcquired}
              icon={Users}
              color={GN}
              trend={data.patientsTrend}
              trendDirection="up"
              sub="ce mois"
            />
            <MetricCard
              label="Leads en attente"
              value={data.leadsWaiting}
              icon={TrendingUp}
              color={LV}
              sub="à qualifier"
            />
          </>
        )}

        {showProductMetrics && (
          <MetricCard
            label="Revenus produits"
            value={`${data.productRevenue}€`}
            icon={Euro}
            color={YL}
            trend={data.revenueTrend}
            trendDirection="up"
            sub="ce mois"
          />
        )}

        {showAcquisitionMetrics && (
          <MetricCard
            label="ROI global"
            value={`${data.roi.toFixed(1)}x`}
            icon={Zap}
            color={GN}
            trend={data.roiTrend}
            trendDirection="up"
            sub="revenus / dépenses"
          />
        )}
      </div>

      {/* Flywheel Section - only for 'both' track */}
      {showFlywheel && (
        <div style={{ marginBottom: '2rem' }}>
          <FlywheelDiagram health={data.flywheelHealth} />
        </div>
      )}

      {/* Quick Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: '2rem',
        }}
      >
        {showAcquisitionMetrics && (
          <div
            style={{
              background: W,
              borderRadius: 16,
              padding: '1.25rem',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: M, marginBottom: 8, letterSpacing: '0.05em' }}>
              STATUT CAMPAGNE
            </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.5rem 1rem',
              borderRadius: 999,
              background:
                data.campaignStatus === 'active'
                  ? `${GN}15`
                  : data.campaignStatus === 'learning'
                    ? `${YL}15`
                    : `${M}15`,
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background:
                  data.campaignStatus === 'active'
                    ? GN
                    : data.campaignStatus === 'learning'
                      ? YL
                      : M,
                animation: data.campaignStatus === 'active' ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: DK }}>
              {data.campaignStatus === 'active'
                ? 'En cours'
                : data.campaignStatus === 'learning'
                  ? 'Apprentissage'
                  : 'En pause'}
            </span>
          </div>
          </div>
        )}

        {showAcquisitionMetrics && (
          <>
            <div
              style={{
                background: W,
                borderRadius: 16,
                padding: '1.25rem',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: M, marginBottom: 8, letterSpacing: '0.05em' }}>
                SIGNAL MULTIPLIER
              </p>
              <p
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: GN,
                  lineHeight: 1,
                }}
              >
                {data.signalMultiplier.toFixed(1)}x
              </p>
              <p style={{ fontSize: '0.7rem', color: M, marginTop: 4 }}>Plus que la moyenne</p>
            </div>

            <div
              style={{
                background: W,
                borderRadius: 16,
                padding: '1.25rem',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: M, marginBottom: 8, letterSpacing: '0.05em' }}>
                MEILLEUR SEGMENT
              </p>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: DK }}>{data.bestSegment}</p>
            </div>

            <div
              style={{
                background: W,
                borderRadius: 16,
                padding: '1.25rem',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: M, marginBottom: 8, letterSpacing: '0.05em' }}>
                PROCHAINE OPTIM
              </p>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: DK }}>{data.nextOptimization}</p>
            </div>
          </>
        )}
      </div>

      {/* Recommendations Section */}
      <div>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: GN }} />
          <h2
            style={{
              fontWeight: 800,
              fontSize: '1.1rem',
              color: DK,
              letterSpacing: '-0.02em',
            }}
          >
            Actions recommandées
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 14,
          }}
        >
          {data.recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.7 }
          50% { opacity: 1 }
        }
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  )
}
