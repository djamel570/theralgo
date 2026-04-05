'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Send, Check } from 'lucide-react'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { FunnelVariant } from '@/lib/adaptive-funnel'

/* ── Design tokens ──────────────────────────────────────── */
const GN = '#5DB847'     // green
const T  = '#1A1A1A'     // text dark
const M  = '#6B7280'     // muted
const C  = '#F7F4EE'     // cream bg
const W  = '#FFFFFF'     // white

interface TherapistProfile {
  id: string
  name: string
  specialty: string
  city: string
  consultation_price: number
  approach_description: string
  main_techniques: string
  patient_transformation: string
  ideal_patient_profile: string
  main_problem_solved: string
  unique_differentiator: string
  signature_content: {
    headline?: string
    benefits?: string[]
    cta?: string
  } | null
  meta_config?: Record<string, unknown>
}

interface MediaUpload {
  id: string
  file_url: string
  file_name: string
}

interface TherapistLandingProps {
  profile: TherapistProfile
  media: MediaUpload | null
  campaignId: string | null
  pixelId: string
  funnelVariant?: FunnelVariant | null
}

/* ── Helper to check if element is in viewport ──────────── */
function useInView(ref: React.RefObject<HTMLElement>, threshold = 0.3) {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold])

  return isInView
}

export default function TherapistLanding({
  profile,
  media,
  campaignId,
  pixelId,
  funnelVariant,
}: TherapistLandingProps) {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [qualificationAnswers, setQualificationAnswers] = useState<Record<string, string>>({})

  const heroRef = useRef<HTMLElement>(null)
  const problemRef = useRef<HTMLElement>(null)
  const approachRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLElement>(null)
  const transformRef = useRef<HTMLElement>(null)
  const aboutRef = useRef<HTMLElement>(null)
  const formRef = useRef<HTMLElement>(null)

  const heroInView = useInView(heroRef)
  const problemInView = useInView(problemRef)
  const approachInView = useInView(approachRef)
  const videoInView = useInView(videoRef)
  const transformInView = useInView(transformRef)
  const aboutInView = useInView(aboutRef)
  const formInView = useInView(formRef)

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Email validation regex
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignId) return

    // Validate email
    if (!isValidEmail(formData.email)) {
      alert('Veuillez entrer une adresse email valide')
      return
    }

    setFormState('submitting')

    try {
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
        }),
      })

      if (response.ok) {
        // Track lead in Meta Pixel
        if (typeof window !== 'undefined' && (window as any).fbq) {
          ;(window as any).fbq('track', 'Lead')
        }

        setFormState('success')
        setFormData({ name: '', email: '', phone: '', message: '' })
        setTimeout(() => setFormState('idle'), 3000)
      } else {
        setFormState('idle')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setFormState('idle')
    }
  }

  const specialtyLabel = {
    hypnotherapeute: 'Hypnothérapeute',
    naturopathe: 'Naturopathe',
    sophrologue: 'Sophrologue',
    psychotherapeute: 'Psychothérapeute',
    coach: 'Coach de vie',
    osteopathe: 'Ostéopathe',
    kinesiologue: 'Kinésiologue',
    autre: 'Thérapeute',
  }[profile.specialty] || profile.specialty

  // Use funnel variant data if available (adaptive content), otherwise use profile defaults
  const headline = funnelVariant?.hero.headline || profile.signature_content?.headline || `Trouvez votre bien-être avec ${profile.name}`
  const subheadline = funnelVariant?.hero.subheadline || profile.approach_description
  const ctaText = funnelVariant?.hero.ctaText || profile.signature_content?.cta || 'Réserver une consultation'

  const benefits = profile.signature_content?.benefits || [
    'Approche personnalisée',
    'Résultats durables',
    'Bien-être retrouvé',
  ]

  const problems = funnelVariant?.problemSection.problems ||
    profile.main_problem_solved
      .split('\n')
      .filter((p: string) => p.trim())
      .slice(0, 4)

  const problemSectionTitle = funnelVariant?.problemSection.title || 'Vous vivez ça ?'
  const empathyStatement = funnelVariant?.problemSection.empathyStatement || 'Vous vous reconnaissez ?'

  const approachTitle = funnelVariant?.approachSection.title || 'Une approche holistique et bienveillante'
  const approachDescription = funnelVariant?.approachSection.description || profile.approach_description
  const techniques = funnelVariant?.approachSection.techniques ||
    profile.main_techniques
      .split('\n')
      .filter((t: string) => t.trim())

  const formTitle = funnelVariant?.formSection.title || 'Prêt(e) à commencer ?'
  const formSubtitle = funnelVariant?.formSection.subtitle || 'Remplissez le formulaire et je vous recontacterai rapidement.'
  const qualificationQuestions = funnelVariant?.formSection.qualificationQuestions || []

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: T }}>
      {/* ────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION */}
      {/* ────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          background: C,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: '4rem',
        }}
      >
        {/* Decorative blob */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
            background: GN,
            opacity: 0.06,
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', width: '100%', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '4rem',
              alignItems: 'center',
            }}
          >
            {/* Left: Text */}
            <div style={{ opacity: heroInView ? 1 : 0.3, transform: heroInView ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease' }}>
              <p
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: GN,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '1rem',
                }}
              >
                {specialtyLabel}
              </p>

              <h1
                style={{
                  fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  marginBottom: '1.5rem',
                  color: T,
                  letterSpacing: '-0.02em',
                }}
              >
                {headline}
              </h1>

              <p
                style={{
                  fontSize: '1.1rem',
                  color: M,
                  lineHeight: 1.7,
                  marginBottom: '2.5rem',
                  maxWidth: 600,
                }}
              >
                {subheadline}
              </p>

              {/* CTA Button */}
              <button
                onClick={() => {
                  document.querySelector('section[data-form]')?.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: 999,
                  border: 'none',
                  background: GN,
                  color: W,
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 20px rgba(93, 184, 71, 0.3)`,
                  fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = '#4fa83a'
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = `0 8px 28px rgba(93, 184, 71, 0.4)`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = GN
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = `0 4px 20px rgba(93, 184, 71, 0.3)`
                }}
              >
                {ctaText}
              </button>

              {/* Scroll indicator */}
              <div
                style={{
                  marginTop: '3rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.9rem',
                  color: M,
                }}
              >
                <span>Découvrez mon approche</span>
                <ChevronDown
                  size={20}
                  style={{
                    animation: 'bounce 2s infinite',
                  }}
                />
              </div>
            </div>

            {/* Right: Visual (image placeholder or pattern) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 500,
              }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  maxWidth: 400,
                  borderRadius: '30px',
                  background: `linear-gradient(135deg, ${GN} 0%, rgba(93, 184, 71, 0.2) 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 20px 60px rgba(93, 184, 71, 0.15)`,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='rgba(255,255,255,.2)' stroke-width='2'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='rgba(255,255,255,.15)' stroke-width='2'/%3E%3C/svg%3E")`,
                    fontSize: '5rem',
                  }}
                >
                  ✨
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(10px); }
          }
        `}</style>
      </section>

      {/* ────────────────────────────────────────────────────── */}
      {/* 2. PROBLEM SECTION */}
      {/* ────────────────────────────────────────────────────── */}
      <section
        ref={problemRef}
        style={{
          background: T,
          padding: '6rem 2rem',
          color: W,
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div
            style={{
              opacity: problemInView ? 1 : 0.3,
              transform: problemInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s ease',
            }}
          >
            <p
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: GN,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              Vous êtes concerné
            </p>

            <h2
              style={{
                fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                fontWeight: 800,
                marginBottom: '3rem',
                letterSpacing: '-0.01em',
              }}
            >
              {problemSectionTitle}
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem',
              }}
            >
              {problems.map((problem: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,.05)',
                    borderRadius: 16,
                    borderLeft: `4px solid ${GN}`,
                    opacity: problemInView ? 1 : 0.3,
                    transform: problemInView ? 'translateX(0)' : 'translateX(-20px)',
                    transition: `all 0.8s ease ${idx * 0.1}s`,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: GN,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: T,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </div>
                  <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{problem}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────── */}
      {/* 3. APPROACH SECTION */}
      {/* ────────────────────────────────────────────────────── */}
      <section
        ref={approachRef}
        style={{
          background: C,
          padding: '6rem 2rem',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div
            style={{
              opacity: approachInView ? 1 : 0.3,
              transform: approachInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s ease',
            }}
          >
            <p
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: GN,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              Mon approche
            </p>

            <h2
              style={{
                fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                fontWeight: 800,
                marginBottom: '1rem',
                color: T,
                letterSpacing: '-0.01em',
              }}
            >
              {approachTitle}
            </h2>

            <p
              style={{
                fontSize: '1.05rem',
                color: M,
                lineHeight: 1.8,
                marginBottom: '3rem',
                maxWidth: 700,
              }}
            >
              {approachDescription}
            </p>

            {/* Techniques */}
            <div
              style={{
                background: W,
                borderRadius: 20,
                padding: '2rem',
                marginBottom: '3rem',
                boxShadow: '0 4px 12px rgba(0,0,0,.06)',
              }}
            >
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  marginBottom: '1.5rem',
                  color: T,
                }}
              >
                Mes techniques
              </h3>
              {Array.isArray(techniques) && techniques.length > 0 ? (
                <ul
                  style={{
                    fontSize: '1rem',
                    color: M,
                    lineHeight: 1.8,
                    listStylePosition: 'inside',
                  }}
                >
                  {techniques.map((technique: string, idx: number) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>
                      {technique}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  style={{
                    fontSize: '1rem',
                    color: M,
                    lineHeight: 1.8,
                  }}
                >
                  {funnelVariant?.approachSection.techniques && Array.isArray(funnelVariant.approachSection.techniques)
                    ? funnelVariant.approachSection.techniques.join(', ')
                    : profile.main_techniques}
                </p>
              )}
            </div>

            {/* Benefits cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
              }}
            >
              {benefits.map((benefit: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: W,
                    borderRadius: 20,
                    padding: '2rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,.06)',
                    border: '2px solid rgba(0,0,0,.05)',
                    opacity: approachInView ? 1 : 0.3,
                    transform: approachInView ? 'translateY(0)' : 'translateY(20px)',
                    transition: `all 0.8s ease ${idx * 0.1}s`,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: `${GN}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      fontSize: '1.5rem',
                    }}
                  >
                    ✨
                  </div>
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      marginBottom: '0.5rem',
                      color: T,
                    }}
                  >
                    {benefit}
                  </h4>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: M,
                      lineHeight: 1.6,
                    }}
                  >
                    Chaque séance est conçue pour vous apporter des bénéfices durables et mesurables.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────── */}
      {/* 4. VIDEO SECTION (if media exists) */}
      {/* ────────────────────────────────────────────────────── */}
      {media && (
        <section
          ref={videoRef}
          style={{
            background: T,
            padding: '6rem 2rem',
          }}
        >
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div
              style={{
                opacity: videoInView ? 1 : 0.3,
                transform: videoInView ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.8s ease',
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                  fontWeight: 800,
                  marginBottom: '3rem',
                  color: W,
                  letterSpacing: '-0.01em',
                  textAlign: 'center',
                }}
              >
                Découvrez mon univers
              </h2>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '56.25%',
                  height: 0,
                  overflow: 'hidden',
                  borderRadius: 24,
                  boxShadow: '0 20px 60px rgba(0,0,0,.3)',
                  background: '#000',
                }}
              >
                <video
                  controls
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <source src={media.file_url} type="video/mp4" />
                  Votre navigateur ne supporte pas la vidéo.
                </video>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* 5. TRANSFORMATION SECTION */}
      {/* ────────────────────────────────────────────────────── */}
      <section
        ref={transformRef}
        style={{
          background: GN,
          padding: '6rem 2rem',
          color: W,
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div
            style={{
              opacity: transformInView ? 1 : 0.3,
              transform: transformInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s ease',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                fontWeight: 800,
                marginBottom: '2rem',
                letterSpacing: '-0.01em',
              }}
            >
              La transformation que vous pouvez vivre
            </h2>

            <div
              style={{
                fontSize: '1.1rem',
                lineHeight: 1.9,
                fontStyle: 'italic',
                opacity: 0.95,
              }}
            >
              {profile.patient_transformation}
            </div>

            <div
              style={{
                marginTop: '3rem',
                padding: '2rem',
                borderTop: '2px solid rgba(255,255,255,.2)',
              }}
            >
              <p
                style={{
                  fontSize: '0.95rem',
                  opacity: 0.9,
                }}
              >
                <strong>Parfait pour :</strong> {profile.ideal_patient_profile}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────── */}
      {/* 6. ABOUT SECTION */}
      {/* ────────────────────────────────────────────────────── */}
      <section
        ref={aboutRef}
        style={{
          background: C,
          padding: '6rem 2rem',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '4rem',
              alignItems: 'center',
            }}
          >
            {/* Avatar placeholder */}
            <div
              style={{
                opacity: aboutInView ? 1 : 0.3,
                transform: aboutInView ? 'scale(1)' : 'scale(0.9)',
                transition: 'all 0.8s ease',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 280,
                  aspectRatio: '1',
                  borderRadius: '24px',
                  background: `linear-gradient(135deg, ${GN} 0%, rgba(93, 184, 71, 0.3) 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 20px 40px rgba(93, 184, 71, 0.2)`,
                  fontSize: '4rem',
                  margin: '0 auto',
                }}
              >
                👤
              </div>
            </div>

            {/* Text */}
            <div
              style={{
                opacity: aboutInView ? 1 : 0.3,
                transform: aboutInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s ease',
              }}
            >
              <p
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: GN,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '1rem',
                }}
              >
                Mon histoire
              </p>

              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                  fontWeight: 800,
                  marginBottom: '1.5rem',
                  color: T,
                  letterSpacing: '-0.01em',
                }}
              >
                {profile.name}
              </h2>

              <p
                style={{
                  fontSize: '1.05rem',
                  color: M,
                  lineHeight: 1.8,
                  marginBottom: '2rem',
                }}
              >
                {profile.unique_differentiator}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  fontSize: '0.95rem',
                  color: T,
                }}
              >
                <span style={{ fontWeight: 700 }}>📍</span>
                <span>
                  {specialtyLabel} à <strong>{profile.city}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────── */}
      {/* 7. CONTACT FORM SECTION */}
      {/* ────────────────────────────────────────────────────── */}
      <ErrorBoundary>
        <section
          ref={formRef}
          data-form
          style={{
            background: T,
            padding: '6rem 2rem',
            color: W,
          }}
        >
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div
              style={{
                opacity: formInView ? 1 : 0.3,
                transform: formInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s ease',
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                  fontWeight: 800,
                  marginBottom: '1rem',
                  letterSpacing: '-0.01em',
                  textAlign: 'center',
                }}
              >
                {formTitle}
              </h2>

              <p
                style={{
                  fontSize: '1rem',
                  color: 'rgba(255,255,255,.8)',
                  marginBottom: '3rem',
                  textAlign: 'center',
                }}
              >
                {formSubtitle}
              </p>

              {formState === 'success' ? (
                <div
                  style={{
                    background: 'rgba(93, 184, 71, 0.15)',
                    border: `2px solid ${GN}`,
                    borderRadius: 16,
                    padding: '2rem',
                    textAlign: 'center',
                  }}
                >
                  <Check size={48} color={GN} style={{ margin: '0 auto 1rem' }} />
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      marginBottom: '0.5rem',
                      color: GN,
                    }}
                  >
                    Message reçu !
                  </h3>
                  <p>Je vous recontacterai très bientôt. Merci.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} aria-label="Formulaire de contact">
                  {/* Qualification Questions (if funnel variant) */}
                  {qualificationQuestions && qualificationQuestions.length > 0 && (
                    <div style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '2px solid rgba(255,255,255,.1)' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.5rem', color: 'rgba(255,255,255,.9)' }}>
                        Avant de continuer, quelques questions rapides :
                      </p>
                      {qualificationQuestions.map((q, qIdx) => (
                        <div key={qIdx} style={{ marginBottom: '1.5rem' }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              marginBottom: '0.75rem',
                              color: W,
                            }}
                          >
                            {q.question}
                          </label>
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {q.options.map((option, oIdx) => (
                              <label
                                key={oIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '0.75rem 1rem',
                                  background: qualificationAnswers[`q${qIdx}`] === option
                                    ? `${GN}30`
                                    : 'rgba(255,255,255,.06)',
                                  borderRadius: 8,
                                  border: qualificationAnswers[`q${qIdx}`] === option
                                    ? `2px solid ${GN}`
                                    : '2px solid rgba(255,255,255,.1)',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s',
                                }}
                                onMouseEnter={e => {
                                  if (qualificationAnswers[`q${qIdx}`] !== option) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,.1)'
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (qualificationAnswers[`q${qIdx}`] !== option) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,.06)'
                                  }
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`q${qIdx}`}
                                  value={option}
                                  checked={qualificationAnswers[`q${qIdx}`] === option}
                                  onChange={e => {
                                    setQualificationAnswers(prev => ({
                                      ...prev,
                                      [`q${qIdx}`]: option,
                                    }))
                                  }}
                                  style={{
                                    marginRight: '0.75rem',
                                    cursor: 'pointer',
                                    accentColor: GN,
                                  }}
                                />
                                <span style={{ fontSize: '0.95rem', color: W }}>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Name */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label
                      htmlFor="form-name"
                      style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        marginBottom: '0.5rem',
                      }}
                    >
                      Votre nom
                    </label>
                    <input
                      id="form-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      aria-label="Votre nom"
                      aria-required="true"
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        borderRadius: 12,
                        border: '2px solid rgba(255,255,255,.2)',
                        background: 'rgba(255,255,255,.08)',
                        color: W,
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s',
                        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.12)'
                        e.currentTarget.style.borderColor = GN
                      }}
                      onBlur={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.08)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)'
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label
                      htmlFor="form-email"
                      style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        marginBottom: '0.5rem',
                      }}
                    >
                      Votre email
                    </label>
                    <input
                      id="form-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      aria-label="Votre email"
                      aria-required="true"
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        borderRadius: 12,
                        border: '2px solid rgba(255,255,255,.2)',
                        background: 'rgba(255,255,255,.08)',
                        color: W,
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s',
                        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.12)'
                        e.currentTarget.style.borderColor = GN
                      }}
                      onBlur={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.08)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)'
                      }}
                    />
                  </div>

                  {/* Phone */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label
                      htmlFor="form-phone"
                      style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        marginBottom: '0.5rem',
                      }}
                    >
                      Téléphone (optionnel)
                    </label>
                    <input
                      id="form-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      aria-label="Votre téléphone"
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        borderRadius: 12,
                        border: '2px solid rgba(255,255,255,.2)',
                        background: 'rgba(255,255,255,.08)',
                        color: W,
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s',
                        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.12)'
                        e.currentTarget.style.borderColor = GN
                      }}
                      onBlur={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.08)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)'
                      }}
                    />
                  </div>

                  {/* Message */}
                  <div style={{ marginBottom: '2rem' }}>
                    <label
                      htmlFor="form-message"
                      style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        marginBottom: '0.5rem',
                      }}
                    >
                      Message (optionnel)
                    </label>
                    <textarea
                      id="form-message"
                      name="message"
                      value={formData.message}
                      onChange={handleFormChange}
                      rows={4}
                      aria-label="Votre message"
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        borderRadius: 12,
                        border: '2px solid rgba(255,255,255,.2)',
                        background: 'rgba(255,255,255,.08)',
                        color: W,
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s',
                        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
                        boxSizing: 'border-box',
                        resize: 'none',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.12)'
                        e.currentTarget.style.borderColor = GN
                      }}
                      onBlur={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.08)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)'
                      }}
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={formState === 'submitting' || !campaignId}
                    aria-label="Envoyer le formulaire de contact"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: 999,
                      border: 'none',
                      background: GN,
                      color: T,
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: formState === 'submitting' || !campaignId ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                      fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: formState === 'submitting' || !campaignId ? 0.6 : 1,
                    }}
                    onMouseEnter={e => {
                      if (formState !== 'submitting' && campaignId) {
                        const el = e.currentTarget as HTMLButtonElement
                        el.style.background = '#4fa83a'
                        el.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.background = GN
                      el.style.transform = 'translateY(0)'
                    }}
                  >
                    {formState === 'submitting' ? (
                      <>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            border: '2px solid rgba(0,0,0,.3)',
                            borderTopColor: T,
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                          }}
                        />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Envoyer mon message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </section>
      </ErrorBoundary>

      {/* ────────────────────────────────────────────────────── */}
      {/* 8. FOOTER */}
      {/* ────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: '#0a0a0a',
          padding: '2rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,.6)',
        }}
      >
        <p>
          Propulsé par{' '}
          <a
            href="https://theralgo.com"
            style={{ color: GN, textDecoration: 'none', fontWeight: 700 }}
          >
            Theralgo
          </a>
        </p>
      </footer>
    </div>
  )
}
