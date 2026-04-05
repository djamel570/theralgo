'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const GN = '#8ED462'
const T  = '#1A1A1A'
const M  = '#6B7280'
const C  = '#F5F3EF'
const W  = '#FFFFFF'

const schema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
})
type FormData = z.infer<typeof schema>

/* ── Shared input style ────────────────────────────────── */
const inputBase: React.CSSProperties = {
  width: '100%', padding: '.85rem 1rem', borderRadius: 14,
  border: '1.5px solid rgba(0,0,0,.12)', background: W,
  fontSize: '.9rem', color: T, outline: 'none',
  fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
  transition: 'border-color .2s, box-shadow .2s',
  boxSizing: 'border-box' as const,
}

/* ── Google SVG ────────────────────────────────────────── */
const GoogleSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [googleLoad,  setGoogleLoad]  = useState(false)
  const [showPass,    setShowPass]    = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    const { error: authErr } = await supabase.auth.signInWithPassword(data)
    if (authErr) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const loginWithGoogle = async () => {
    setGoogleLoad(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{`
        .auth-input:focus { border-color: ${GN} !important; box-shadow: 0 0 0 3px rgba(142,212,98,.14) !important; }
        .auth-input::placeholder { color: #9CA3AF; }
        .auth-btn-google:hover { background: rgba(0,0,0,.04) !important; border-color: rgba(0,0,0,.2) !important; }
        .auth-link:hover { color: ${GN} !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2rem)', color: T, letterSpacing: '-.04em', lineHeight: 1, marginBottom: 6 }}>
          Bon retour 👋
        </h1>
        <p style={{ color: M, fontSize: '.88rem' }}>Connectez-vous à votre espace Theralgo</p>
      </div>

      {/* Card */}
      <div style={{ background: W, borderRadius: 24, border: '1px solid rgba(0,0,0,.08)', boxShadow: '0 4px 24px rgba(0,0,0,.07)', padding: '2rem' }}>

        {/* Google OAuth */}
        <button className="auth-btn-google" onClick={loginWithGoogle} disabled={googleLoad}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '.875rem 1rem', borderRadius: 14,
            border: '1.5px solid rgba(0,0,0,.12)', background: W,
            fontSize: '.88rem', fontWeight: 600, color: T,
            cursor: googleLoad ? 'not-allowed' : 'pointer',
            transition: 'all .18s', marginBottom: '1.25rem',
            fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
            opacity: googleLoad ? .7 : 1,
          }}>
          {googleLoad ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <GoogleSVG />}
          {googleLoad ? 'Redirection...' : 'Continuer avec Google'}
        </button>

        {/* Divider */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,.08)' }} />
          <span style={{ padding: '0 12px', fontSize: '.75rem', color: M, fontWeight: 500, flexShrink: 0 }}>ou par email</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,.08)' }} />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '.78rem', fontWeight: 700, color: T }}>Email</label>
            <input className="auth-input" style={inputBase} type="email"
              placeholder="vous@exemple.com" {...register('email')} />
            {errors.email && <p style={{ fontSize: '.72rem', color: '#EF4444' }}>{errors.email.message}</p>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '.78rem', fontWeight: 700, color: T }}>Mot de passe</label>
              <a href="#" className="auth-link" style={{ fontSize: '.75rem', color: M, textDecoration: 'none', transition: 'color .15s' }}>Oublié ?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <input className="auth-input" style={{ ...inputBase, paddingRight: '2.75rem' }}
                type={showPass ? 'text' : 'password'} placeholder="••••••••"
                {...register('password')} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: M, display: 'flex', alignItems: 'center' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={{ fontSize: '.72rem', color: '#EF4444' }}>{errors.password.message}</p>}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,.07)', border: '1.5px solid rgba(239,68,68,.25)', borderRadius: 12, padding: '.75rem 1rem', fontSize: '.84rem', color: '#B91C1C', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '.95rem', borderRadius: 14, border: 'none',
              background: T, color: '#fff', fontWeight: 700, fontSize: '.9rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .2s', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
            }}>
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Connexion...</> : 'Se connecter'}
          </button>
        </form>

        {/* Sign up link */}
        <p style={{ textAlign: 'center', fontSize: '.84rem', color: M, marginTop: '1.25rem' }}>
          Pas encore de compte ?{' '}
          <Link href="/signup" className="auth-link" style={{ color: T, fontWeight: 700, textDecoration: 'none', transition: 'color .15s' }}>
            Créer un compte →
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
