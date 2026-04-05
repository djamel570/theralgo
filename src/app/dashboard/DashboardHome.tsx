'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, Video, Zap, ArrowRight, CheckCircle, BarChart2, Calendar, Users, TrendingUp, Euro } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import CommandCenter from './CommandCenter'

/* ── Design tokens ────────────────────────────────────── */
const GN = '#8ED462'
const T  = '#1A1A1A'
const M  = '#6B7280'
const C  = '#F7F4EE'
const W  = '#FFFFFF'
const LV = '#C4B5FD'
const YL = '#FBD24D'
const RD = '#FF6B6B'

/* ── Types ─────────────────────────────────────────────── */
interface TherapistProfile { name?: string; specialty?: string; city?: string }
interface MediaUpload { id: string; file_url: string }
interface Campaign {
  id: string; status: string; budget: number;
  generated_content?: { variations?: Array<{ hook: string; message: string; cta: string; audience: string }> }
  campaign_metrics?: Array<{ impressions: number; clicks: number; leads: number; appointments: number; ctr: number; cpl: number; spend: number }>
}
interface Props {
  user: { id: string; name?: string; email?: string }
  profile: TherapistProfile | null
  media: MediaUpload | null
  campaign: Campaign | null
}

/* ── Metric card ───────────────────────────────────────── */
function MetricCard({
  label, value, sub, color, icon: Icon, trend,
}: {
  label: string
  value: string | number
  sub?: string
  color: string
  icon: React.ElementType
  trend?: string
}) {
  return (
    <div style={{
      background: W, borderRadius: 24, padding: '1.75rem',
      border: '1px solid rgba(0,0,0,.07)',
      boxShadow: '0 2px 12px rgba(0,0,0,.04)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Accent blob */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: .08, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
        {trend && (
          <span style={{ fontSize: '.68rem', fontWeight: 700, color: GN, background: `${GN}14`, padding: '.2rem .6rem', borderRadius: 999 }}>
            {trend}
          </span>
        )}
      </div>
      <p style={{ fontWeight: 800, fontSize: '2.2rem', color: T, lineHeight: 1, letterSpacing: '-.04em', marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: '.78rem', fontWeight: 600, color: T, marginBottom: 2 }}>{label}</p>
      {sub && <p style={{ fontSize: '.7rem', color: M }}>{sub}</p>}
    </div>
  )
}

/* ── Step item ─────────────────────────────────────────── */
function StepItem({ done, icon: Icon, label, cta, href, isActivate, canActivate, activating, activated, onActivate, accent = GN }: {
  done: boolean; icon: React.ElementType; label: string; cta: string;
  href?: string; isActivate?: boolean; canActivate?: boolean;
  activating?: boolean; activated?: boolean; onActivate?: () => void; accent?: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '1rem 1.25rem', borderRadius: 20,
      background: done ? `${accent}08` : W,
      border: `1px solid ${done ? `${accent}25` : 'rgba(0,0,0,.07)'}`,
      transition: 'all .25s',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? accent : 'rgba(0,0,0,.05)',
      }}>
        {done
          ? <CheckCircle style={{ width: 18, height: 18, color: 'white' }} />
          : <Icon style={{ width: 16, height: 16, color: M }} />}
      </div>
      <p style={{ flex: 1, fontSize: '.875rem', fontWeight: 600, color: done ? M : T, textDecoration: done ? 'line-through' : 'none', textDecorationColor: `${accent}50` }}>{label}</p>
      {!done && (
        isActivate ? (
          <button
            disabled={!canActivate || activating}
            onClick={onActivate}
            style={{
              padding: '.5rem 1.2rem', borderRadius: 999, border: 'none',
              background: canActivate ? T : 'rgba(0,0,0,.08)',
              color: canActivate ? 'white' : M,
              fontSize: '.8rem', fontWeight: 700, cursor: canActivate ? 'pointer' : 'not-allowed',
              transition: 'all .25s', display: 'flex', alignItems: 'center', gap: 6,
              opacity: activating ? .7 : 1,
            }}
          >
            {activating ? 'Activation...' : activated ? '✓ Activé !' : cta}
          </button>
        ) : (
          <Link href={href || '#'}>
            <button style={{
              padding: '.5rem 1.2rem', borderRadius: 999,
              border: '1px solid rgba(0,0,0,.14)', background: 'transparent',
              color: T, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s',
            }}>
              {cta} <ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          </Link>
        )
      )}
    </div>
  )
}

/* ── Ad card ───────────────────────────────────────────── */
function AdCard({ hook, message, cta, index }: { hook: string; message: string; cta: string; index: number }) {
  const accents = [GN, LV, YL, RD]
  const acc = accents[index % accents.length]
  return (
    <div style={{ background: W, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(0,0,0,.07)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
      <div style={{ padding: '.6rem 1rem', background: `${acc}15`, borderBottom: '1px solid rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: acc }} />
        <span style={{ fontSize: '.65rem', fontWeight: 700, color: T, letterSpacing: '.1em', textTransform: 'uppercase' }}>Variation {index + 1}</span>
      </div>
      <div style={{ padding: '1.25rem' }}>
        <p style={{ fontWeight: 700, color: T, marginBottom: 8, fontSize: '.9rem', lineHeight: 1.4 }}>{hook}</p>
        <p style={{ fontSize: '.82rem', color: M, lineHeight: 1.7, marginBottom: 14 }}>{message}</p>
        <span style={{ display: 'inline-block', background: acc, color: acc === YL ? T : 'white', fontSize: '.72rem', fontWeight: 700, padding: '.35rem 1rem', borderRadius: 999 }}>{cta}</span>
      </div>
    </div>
  )
}

/* ── Main ──────────────────────────────────────────────── */
export default function DashboardHome({ user, profile, media, campaign }: Props) {
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)
  const supabase = createClient()

  const profileComplete = !!(profile?.name && profile?.specialty && profile?.city)
  const hasVideo = !!media
  const hasCampaign = !!campaign
  const isActive = campaign?.status === 'active'
  const canActivate = profileComplete && hasVideo && !hasCampaign

  const activate = async () => {
    setActivating(true)
    try {
      await fetch('/api/campaigns/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      setActivated(true)
      setTimeout(() => window.location.reload(), 2000)
    } catch { setActivating(false) }
  }

  const firstName = user.name?.split(' ')[0] || 'Thérapeute'
  const steps = [profileComplete, hasVideo].filter(Boolean).length

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: T, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
              {firstName[0]}
            </div>
            <div>
              <p style={{ fontSize: '.7rem', fontWeight: 700, color: M, letterSpacing: '.09em', textTransform: 'uppercase' }}>Bienvenue</p>
              <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem,3vw,2rem)', color: T, lineHeight: 1.1, letterSpacing: '-.03em' }}>
                {firstName} 👋
              </h1>
            </div>
          </div>
          <p style={{ color: M, fontSize: '.86rem', marginLeft: 54 }}>Votre moteur d'acquisition en temps réel</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isActive && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '.45rem 1.1rem', borderRadius: 999, background: `${GN}14`, border: `1px solid ${GN}28` }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: GN, animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#2D6B1A' }}>Système actif</span>
            </div>
          )}
          <Link href="/dashboard/agenda">
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '.45rem 1.1rem', borderRadius: 999, border: '1px solid rgba(0,0,0,.1)', background: W, fontSize: '.78rem', fontWeight: 600, color: T, cursor: 'pointer' }}>
              <Calendar size={14} /> Agenda
            </button>
          </Link>
        </div>
      </div>

      {/* ── Live Metrics ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: '2rem' }}>
        <MetricCard label="Nouveaux patients" value={7}   sub="ce mois" color={GN} icon={Users}      trend="+40%" />
        <MetricCard label="Demandes RDV"       value={5}   sub="reçues"  color={LV} icon={Calendar}   trend="+20%" />
        <MetricCard label="RDV confirmés"       value={4}   sub="à venir" color={YL} icon={TrendingUp}  />
        <MetricCard label="Revenu généré"       value="320€" sub="ce mois" color={RD} icon={Euro}       trend="×2.1" />
      </div>

      {/* ── Activate banner ─────────────────────────────── */}
      {canActivate && (
        <div style={{ borderRadius: 28, marginBottom: '2rem', background: T, padding: '2.25rem 2.5rem', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,.15)' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: GN, opacity: .1 }} />
          <div style={{ position: 'absolute', bottom: -60, right: 80, width: 160, height: 160, borderRadius: '50%', background: LV, opacity: .08 }} />
          <div style={{ position: 'relative' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(142,212,98,.2)', borderRadius: 999, padding: '.3rem .9rem', fontSize: '.72rem', fontWeight: 700, color: GN, marginBottom: '1rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: GN }} /> Prêt à démarrer !
            </span>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,2.2rem)', color: 'white', marginBottom: '.75rem', letterSpacing: '-.03em', lineHeight: 1.1 }}>
              Votre moteur est prêt.
            </h2>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.88rem', marginBottom: '1.75rem', maxWidth: 400, lineHeight: 1.7 }}>
              Profil et vidéo validés. Notre équipe va créer vos premières campagnes et les lancer dans les 48h.
            </p>
            <button onClick={activate} disabled={activating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '.9rem 2rem', borderRadius: 999, border: 'none', background: activated ? GN : 'white', color: T, fontWeight: 700, fontSize: '.9rem', cursor: activating ? 'not-allowed' : 'pointer', opacity: activating ? .8 : 1, transition: 'all .25s', boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}>
              {activating ? 'Lancement...' : activated ? '✓ Système activé !' : 'Activer mon moteur'}
              {!activating && <div style={{ width: 26, height: 26, borderRadius: '50%', background: T, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArrowRight size={13} color="white" />
              </div>}
            </button>
          </div>
        </div>
      )}

      {/* ── Onboarding checklist ─────────────────────────── */}
      {!hasCampaign && (
        <div style={{ marginBottom: '2rem', background: W, borderRadius: 28, border: '1px solid rgba(0,0,0,.07)', boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden' }}>
          <div style={{ padding: '1.75rem 1.75rem 1.25rem', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: T, letterSpacing: '-.02em' }}>
                Activez votre moteur en 3 étapes
              </h2>
              <span style={{ fontSize: '.76rem', fontWeight: 700, color: M }}>{steps} / 2 complétées</span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: C, overflow: 'hidden', marginTop: '.75rem' }}>
              <div style={{ height: '100%', borderRadius: 999, background: GN, width: `${(steps / 2) * 100}%`, transition: 'width .6s ease' }} />
            </div>
          </div>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StepItem done={profileComplete} icon={User} label="Créez votre Therapist Signature (profil complet)" cta="Créer" href="/dashboard/profile" accent={GN} />
            <StepItem done={hasVideo} icon={Video} label="Uploadez votre vidéo de présentation" cta="Uploader" href="/dashboard/media" accent={LV} />
            <StepItem done={hasCampaign} icon={Zap} label="Activez votre moteur d'acquisition" cta="Activer" isActivate canActivate={canActivate} activating={activating} activated={activated} onActivate={activate} accent={YL} />
          </div>
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12, marginBottom: '2rem' }}>
        {[
          { href: '/dashboard/results', icon: BarChart2, label: 'Mes résultats', sub: 'Leads, clics, conversions', color: GN },
          { href: '/dashboard/agenda', icon: Calendar, label: 'Mon agenda', sub: '4 RDV cette semaine', color: LV },
          { href: '/dashboard/profile', icon: User, label: 'Therapist Signature', sub: 'Mon profil IA-optimisé', color: YL },
        ].map(({ href, icon: Icon, label, sub, color }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1.1rem 1.25rem', borderRadius: 20, background: W, border: '1px solid rgba(0,0,0,.07)', cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,.13)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = W; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,.07)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '.86rem', fontWeight: 700, color: T }}>{label}</p>
                <p style={{ fontSize: '.73rem', color: M }}>{sub}</p>
              </div>
              <ArrowRight size={14} color={M} />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Command Center (when campaign active) ───────────── */}
      {hasCampaign && (
        <>
          <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 28, borderRadius: 2, background: GN }} />
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: T, letterSpacing: '-.02em' }}>
              Command Center
            </h2>
          </div>
          <CommandCenter userId={user.id} />
        </>
      )}

      {/* ── Generated ads ─────────────────────────────── */}
      {campaign?.generated_content?.variations && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 24, borderRadius: 2, background: GN }} />
            <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: T, letterSpacing: '-.02em' }}>Vos publicités générées</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 16 }}>
            {campaign.generated_content.variations.map((v, i) => (
              <AdCard key={i} {...v} index={i} />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.7} 50%{opacity:1} }
      `}</style>
    </div>
  )
}
