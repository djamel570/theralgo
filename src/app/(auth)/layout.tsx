'use client'
import { ReactNode } from 'react'
import Link from 'next/link'

const GN = '#8ED462'
const T  = '#1A1A1A'
const M  = '#6B7280'
const C  = '#F5F3EF'
const G  = '#72C15F'

/* ── Logo inline (même que landing) ───────────────────── */
function Logo() {
  return (
    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.13)', borderRadius: 999, padding: '.45rem 1rem', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.18)' }}>
        <svg width="22" height="18" viewBox="0 0 36 30" fill="none" aria-hidden>
          <path stroke={GN} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.3" d="M3.8 28.2C-3.5 6.4 15.2-1.7 16.2 10.9c.9 11.1-5.6 12.7-5.6 7.2s5.2-11.7 10.6-9.5c6 2.5 4 17-.5 15.4-3.3-1.2-.1-9.4 4.6-11.7 6.6-3.2 12.1 4.8 4.9 15.8" />
        </svg>
        <span style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", fontWeight: 800, fontSize: '.92rem', color: '#fff' }}>
          Ther<span style={{ color: GN }}>algo</span>
        </span>
      </div>
    </Link>
  )
}

/* ── Check item ───────────────────────────────────────── */
function Check({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${GN}22`, border: `1.5px solid ${GN}60`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke={GN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.55 }}>{text}</span>
    </div>
  )
}

/* ── Metric badge ─────────────────────────────────────── */
function Metric({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontWeight: 800, fontSize: '1.3rem', color: '#fff', letterSpacing: '-.04em', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.45)', marginTop: 3 }}>{label}</p>
      <div style={{ width: 14, height: 2, borderRadius: 99, background: color, margin: '5px auto 0' }} />
    </div>
  )
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
      background: C,
    }}>

      {/* ── Colonne gauche — branding ─────────────────────────── */}
      <div style={{
        width: '46%', minWidth: 340, flexShrink: 0,
        background: T, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        padding: 'clamp(2rem,4vw,3.5rem)',
      }}
        className="auth-left-col"
      >
        {/* Blobs décoratifs */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 320, height: 320, borderRadius: '50%', background: GN, opacity: .06, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 280, height: 280, borderRadius: '50%', background: '#C4B5FD', opacity: .05, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: -60, width: 200, height: 200, borderRadius: '50%', background: '#FBD24D', opacity: .04, pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 2, marginBottom: 'clamp(2.5rem,5vw,4rem)' }}>
          <Logo />
        </div>

        {/* Pitch */}
        <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `${GN}18`, border: `1px solid ${GN}30`, borderRadius: 999, padding: '.3rem .9rem', marginBottom: '1.5rem', width: 'fit-content' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GN, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '.7rem', fontWeight: 700, color: GN, letterSpacing: '.07em', textTransform: 'uppercase' as const }}>120+ thérapeutes actifs</span>
          </div>

          <h2 style={{
            fontWeight: 800, lineHeight: .9,
            fontSize: 'clamp(1.8rem,3.5vw,3rem)',
            color: '#fff', letterSpacing: '-.045em',
            marginBottom: '1.25rem',
          }}>
            Votre cabinet<br />
            <span style={{ color: GN }}>mérite plus</span><br />
            que le hasard.
          </h2>

          <p style={{ fontSize: 'clamp(.82rem,1.2vw,.9rem)', color: 'rgba(255,255,255,.52)', lineHeight: 1.8, maxWidth: 380, marginBottom: '2rem' }}>
            Theralgo installe un moteur qui attire automatiquement de nouveaux patients autour de votre cabinet. Patient Sharing amplifie chaque recommandation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '2.5rem' }}>
            <Check text="Moteur d'acquisition installé en 10 jours" />
            <Check text="Campagnes Meta ciblées par zone géographique" />
            <Check text="Patient Sharing automatique après chaque séance" />
            <Check text="Tableau de bord patients en temps réel" />
          </div>

          {/* Dashboard preview */}
          <div style={{
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 20, padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: '1rem' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: GN, animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '.65rem', fontWeight: 700, color: GN, letterSpacing: '.08em', textTransform: 'uppercase' as const }}>Exemple de résultats</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Metric value="7"    label="Nouveaux patients" color={GN} />
              <Metric value="5"    label="Demandes RDV"      color="#C4B5FD" />
              <Metric value="4"    label="RDV confirmés"     color="#FBD24D" />
              <Metric value="320€" label="Revenu généré"     color="#FF6B6B" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)' }}>© {new Date().getFullYear()} Theralgo · Fait pour les thérapeutes</p>
        </div>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:.7} 50%{opacity:1} }
          @media (max-width: 767px) { .auth-left-col { display: none !important; } }
        `}</style>
      </div>

      {/* ── Colonne droite — formulaire ──────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(1.5rem,5vw,3rem)',
        overflowY: 'auto',
        background: C,
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile logo */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }} className="auth-mobile-logo">
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: T, borderRadius: 999, padding: '.5rem 1.25rem' }}>
              <svg width="20" height="16" viewBox="0 0 36 30" fill="none" aria-hidden>
                <path stroke={GN} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.3" d="M3.8 28.2C-3.5 6.4 15.2-1.7 16.2 10.9c.9 11.1-5.6 12.7-5.6 7.2s5.2-11.7 10.6-9.5c6 2.5 4 17-.5 15.4-3.3-1.2-.1-9.4 4.6-11.7 6.6-3.2 12.1 4.8 4.9 15.8" />
              </svg>
              <span style={{ fontWeight: 800, fontSize: '.88rem', color: '#fff' }}>Ther<span style={{ color: GN }}>algo</span></span>
            </Link>
          </div>
          <style>{`
            @media (min-width: 768px) { .auth-mobile-logo { display: none !important; } }
          `}</style>

          {children}
        </div>
      </div>
    </div>
  )
}
