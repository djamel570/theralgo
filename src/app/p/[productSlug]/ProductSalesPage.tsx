'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check, Lock } from 'lucide-react'

/* ── Design tokens ──────────────────────────────────────── */
const GN = '#72C15F'     // green primary
const GD = '#5DB847'     // green dark
const T  = '#1A1A1A'     // text dark
const M  = '#6B7280'     // muted
const C  = '#F7F4EE'     // cream bg
const W  = '#FFFFFF'     // white

interface Product {
  id: string
  title: string
  slug: string
  price: number
  compare_at_price?: number
  description?: string
  stripe_price_id: string
  content?: {
    hero_headline?: string
    hero_subheadline?: string
    hero_image_url?: string
    pain_points?: string[]
    benefits?: string[]
    modules?: Array<{
      title: string
      description: string
      items?: string[]
    }>
    guarantee_text?: string
    faq?: Array<{
      question: string
      answer: string
    }>
  }
}

interface Therapist {
  id: string
  name: string
  email: string
  phone?: string
  specialty?: string
  city?: string
  bio?: string
  credentials?: string
  photo_url?: string
  approach_description?: string
}

interface ProductSalesPageProps {
  product: Product
  therapist: Therapist
}

function useInView(ref: React.RefObject<HTMLElement>, threshold = 0.3) {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
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

export default function ProductSalesPage({
  product,
  therapist,
}: ProductSalesPageProps) {
  const [checkoutState, setCheckoutState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)
  const [email, setEmail] = useState('')

  const heroRef = useRef<HTMLElement>(null)
  const painPointsRef = useRef<HTMLElement>(null)
  const benefitsRef = useRef<HTMLElement>(null)
  const modulesRef = useRef<HTMLElement>(null)
  const therapistRef = useRef<HTMLElement>(null)
  const testimonialsRef = useRef<HTMLElement>(null)
  const faqRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLElement>(null)

  const heroInView = useInView(heroRef)
  const painPointsInView = useInView(painPointsRef)
  const benefitsInView = useInView(benefitsRef)
  const modulesInView = useInView(modulesRef)
  const therapistInView = useInView(therapistRef)
  const testimonialsInView = useInView(testimonialsRef)
  const faqInView = useInView(faqRef)

  const content = product.content || {}
  const painPoints = content.pain_points || [
    'Vous vous sentez bloqué(e) dans votre progression',
    'Les solutions classiques ne fonctionnent pas pour vous',
    'Vous cherchez une approche vraiment adaptée à votre situation',
    'Vous voulez enfin voir des résultats concrets et durables',
  ]
  const benefits = content.benefits || [
    'Accès immédiat au contenu complet',
    'Méthodologie éprouvée et personnalisée',
    'Soutien continu tout au long du parcours',
    'Résultats mesurables et transformation durable',
  ]
  const modules = content.modules || [
    {
      title: 'Module 1: Fondations',
      description: 'Les principes clés pour démarrer',
      items: ['Présentation de la méthode', 'Auto-diagnostic', 'Plan d\'action personnalisé'],
    },
    {
      title: 'Module 2: Mise en pratique',
      description: 'Les outils et techniques pratiques',
      items: ['Exercices quotidiens', 'Fiches de suivi', 'Stratégies éprouvées'],
    },
    {
      title: 'Module 3: Consolidation',
      description: 'Intégrer les changements durablement',
      items: ['Maintenance du progrès', 'Prévention des rechutes', 'Bilan et perspectives'],
    },
  ]
  const guarantee = content.guarantee_text || 'Satisfait(e) ou remboursé(e) sous 30 jours - Aucune question posée'
  const faqItems = content.faq || [
    {
      question: 'Comment accède-t-on au contenu après l\'achat?',
      answer: 'Vous recevrez un email immédiatement après votre achat avec un lien sécurisé pour accéder à votre espace personnalisé.',
    },
    {
      question: 'Pendant combien de temps ai-je accès au contenu?',
      answer: 'Vous aurez accès illimité au programme dès que vous l\'achetez. Aucune limite de durée.',
    },
    {
      question: 'Quelle est votre politique de remboursement?',
      answer: 'Si vous n\'êtes pas satisfait(e), nous offrons un remboursement complet sous 30 jours, sans aucune question posée.',
    },
    {
      question: 'Le programme convient-il à ma situation?',
      answer: 'Ce programme est conçu pour les personnes prêtes à investir dans leur transformation. Si vous avez des doutes, n\'hésitez pas à me contacter.',
    },
  ]

  const handleCheckout = async () => {
    if (!email || !email.includes('@')) {
      setShowEmailPrompt(true)
      return
    }

    setCheckoutState('loading')

    try {
      const response = await fetch('/api/products/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: product.stripe_price_id,
          productSlug: product.slug,
          successUrl: `${window.location.origin}/p/${product.slug}/merci`,
          cancelUrl: window.location.href,
          customerEmail: email,
        }),
      })

      if (!response.ok) {
        throw new Error('Checkout failed')
      }

      const data = await response.json()

      // Track in Meta Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        ;(window as any).fbq('track', 'InitiateCheckout', {
          currency: 'EUR',
          value: product.price,
          content_name: product.title,
        })
      }

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setCheckoutState('error')
      setTimeout(() => setCheckoutState('idle'), 3000)
    }
  }

  return (
    <div style={{ backgroundColor: C, color: T, fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* ─────────────────────────────────────────────────── HERO ─────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{
          padding: '80px 20px',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
          opacity: heroInView ? 1 : 0.8,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        {/* Hero Left - Text */}
        <div>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '20px',
              color: T,
            }}
          >
            {content.hero_headline || product.title}
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: M,
              marginBottom: '40px',
            }}
          >
            {content.hero_subheadline || product.description}
          </p>

          {/* Price Card */}
          <div
            style={{
              backgroundColor: W,
              padding: '30px',
              borderRadius: '12px',
              marginBottom: '30px',
              border: `1px solid #e5e7eb`,
            }}
          >
            <p style={{ fontSize: '0.875rem', color: M, marginBottom: '8px' }}>
              Investissez dans votre transformation
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 700, color: GD }}>
                {product.price.toFixed(0)}€
              </span>
              {product.compare_at_price && (
                <span
                  style={{
                    fontSize: '1rem',
                    color: M,
                    textDecoration: 'line-through',
                  }}
                >
                  {product.compare_at_price.toFixed(0)}€
                </span>
              )}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleCheckout}
              disabled={checkoutState === 'loading'}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1rem',
                fontWeight: 600,
                color: W,
                backgroundColor: checkoutState === 'error' ? '#ef4444' : GN,
                border: 'none',
                borderRadius: '8px',
                cursor: checkoutState === 'loading' ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                opacity: checkoutState === 'loading' ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (checkoutState !== 'loading' && checkoutState !== 'error') {
                  e.currentTarget.style.backgroundColor = GD
                }
              }}
              onMouseLeave={(e) => {
                if (checkoutState !== 'error') {
                  e.currentTarget.style.backgroundColor = GN
                }
              }}
            >
              {checkoutState === 'loading'
                ? 'Chargement...'
                : checkoutState === 'error'
                  ? 'Erreur - Réessayer'
                  : 'Acheter Maintenant'}
            </button>

            {/* Trust Badges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: '24px',
              }}
            >
              {[
                { icon: '🔒', text: 'Paiement sécurisé' },
                { icon: '⚡', text: 'Accès immédiat' },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem',
                    color: M,
                  }}
                >
                  <span>{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guarantee */}
          <p
            style={{
              fontSize: '0.9rem',
              color: M,
              padding: '12px 0',
              borderTop: `1px solid #e5e7eb`,
              borderBottom: `1px solid #e5e7eb`,
            }}
          >
            ✓ {guarantee}
          </p>
        </div>

        {/* Hero Right - Image */}
        {content.hero_image_url && (
          <div>
            <img
              src={content.hero_image_url}
              alt={product.title}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
                objectFit: 'cover',
              }}
            />
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────── PAIN POINTS ─────────────────────────────────────────────────── */}
      <section
        ref={painPointsRef}
        style={{
          padding: '80px 20px',
          maxWidth: '1200px',
          margin: '0 auto',
          opacity: painPointsInView ? 1 : 0.8,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '15px',
            textAlign: 'center',
          }}
        >
          Vous reconnaissez-vous?
        </h2>
        <p
          style={{
            fontSize: '1.125rem',
            color: M,
            textAlign: 'center',
            marginBottom: '60px',
            maxWidth: '600px',
            margin: '15px auto 60px',
          }}
        >
          Ces défis vous semblent familiers?
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
          }}
        >
          {painPoints.map((point, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: W,
                padding: '30px',
                borderRadius: '12px',
                border: `1px solid #e5e7eb`,
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  marginBottom: '15px',
                }}
              >
                ✗
              </div>
              <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{point}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── BENEFITS ─────────────────────────────────────────────────── */}
      <section
        ref={benefitsRef}
        style={{
          padding: '80px 20px',
          backgroundColor: '#f9f7f0',
          opacity: benefitsInView ? 1 : 0.8,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '15px',
              textAlign: 'center',
            }}
          >
            Imaginez si...
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              color: M,
              textAlign: 'center',
              marginBottom: '60px',
              maxWidth: '600px',
              margin: '15px auto 60px',
            }}
          >
            Vous pouviez transformer ces défis en force
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '30px',
            }}
          >
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    color: GN,
                    fontSize: '1.5rem',
                    flexShrink: 0,
                  }}
                >
                  <Check size={24} />
                </div>
                <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── MODULES ─────────────────────────────────────────────────── */}
      <section
        ref={modulesRef}
        style={{
          padding: '80px 20px',
          maxWidth: '1200px',
          margin: '0 auto',
          opacity: modulesInView ? 1 : 0.8,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '60px',
            textAlign: 'center',
          }}
        >
          Ce qui vous attendez à l'intérieur
        </h2>

        <div
          style={{
            display: 'grid',
            gap: '20px',
          }}
        >
          {modules.map((module, idx) => (
            <details
              key={idx}
              style={{
                border: `1px solid #e5e7eb`,
                borderRadius: '12px',
                padding: '30px',
                backgroundColor: W,
              }}
            >
              <summary
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  listStyle: 'none',
                }}
              >
                <div>
                  <h3 style={{ marginBottom: '8px' }}>{module.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: M }}>{module.description}</p>
                </div>
                <ChevronDown
                  size={24}
                  style={{
                    flexShrink: 0,
                    marginLeft: '20px',
                    transition: 'transform 0.2s',
                  }}
                />
              </summary>

              {module.items && (
                <ul
                  style={{
                    marginTop: '20px',
                    paddingLeft: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {module.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      style={{
                        listStyle: 'none',
                        paddingLeft: '24px',
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          color: GN,
                        }}
                      >
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── THERAPIST ─────────────────────────────────────────────────── */}
      <section
        ref={therapistRef}
        style={{
          padding: '80px 20px',
          backgroundColor: '#f9f7f0',
          opacity: therapistInView ? 1 : 0.8,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '60px',
              textAlign: 'center',
            }}
          >
            À propos du thérapeute
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            {therapist.photo_url && (
              <div>
                <img
                  src={therapist.photo_url}
                  alt={therapist.name}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '12px',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}

            <div>
              <h3
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  marginBottom: '10px',
                }}
              >
                {therapist.name}
              </h3>
              {therapist.specialty && (
                <p
                  style={{
                    fontSize: '1.125rem',
                    color: GN,
                    fontWeight: 600,
                    marginBottom: '20px',
                  }}
                >
                  {therapist.specialty}
                  {therapist.city && ` - ${therapist.city}`}
                </p>
              )}

              {therapist.credentials && (
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: M,
                    marginBottom: '20px',
                  }}
                >
                  <strong>Certifications:</strong> {therapist.credentials}
                </p>
              )}

              {therapist.approach_description && (
                <p
                  style={{
                    fontSize: '1rem',
                    lineHeight: 1.7,
                    marginBottom: '20px',
                  }}
                >
                  {therapist.approach_description}
                </p>
              )}

              {therapist.bio && (
                <p
                  style={{
                    fontSize: '1rem',
                    lineHeight: 1.7,
                    color: M,
                  }}
                >
                  {therapist.bio}
                </p>
              )}

              {therapist.email && (
                <div style={{ marginTop: '30px' }}>
                  <a
                    href={`mailto:${therapist.email}`}
                    style={{
                      display: 'inline-block',
                      padding: '12px 24px',
                      backgroundColor: GN,
                      color: W,
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = GD
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = GN
                    }}
                  >
                    Me contacter
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section
        ref={testimonialsRef}
        style={{
          padding: '80px 20px',
          maxWidth: '1200px',
          margin: '0 auto',
          opacity: testimonialsInView ? 1 : 0.8,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '60px',
            textAlign: 'center',
          }}
        >
          Ce que disent les clients
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px',
          }}
        >
          {[
            {
              text: 'La meilleure décision que j\'ai prise pour ma transformation.',
              author: 'Sophie M.',
            },
            {
              text: 'Enfin une approche qui me comprend vraiment.',
              author: 'Jean-Paul D.',
            },
            {
              text: 'Les résultats parlent d\'eux-mêmes. Je recommande vivement!',
              author: 'Marie T.',
            },
          ].map((testimonial, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: W,
                padding: '30px',
                borderRadius: '12px',
                border: `1px solid #e5e7eb`,
              }}
            >
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  marginBottom: '20px',
                  fontStyle: 'italic',
                }}
              >
                "{testimonial.text}"
              </p>
              <p style={{ fontWeight: 600, color: GN }}>— {testimonial.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── FAQ ─────────────────────────────────────────────────── */}
      <section
        ref={faqRef}
        style={{
          padding: '80px 20px',
          backgroundColor: '#f9f7f0',
          opacity: faqInView ? 1 : 0.8,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '60px',
              textAlign: 'center',
            }}
          >
            Questions fréquentes
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
            }}
          >
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  border: `1px solid #e5e7eb`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: W,
                }}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: 'none',
                    backgroundColor: expandedFaq === idx ? '#f3f4f6' : W,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => {
                    if (expandedFaq !== idx) {
                      e.currentTarget.style.backgroundColor = '#f9f7f0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = expandedFaq === idx ? '#f3f4f6' : W
                  }}
                >
                  <span style={{ textAlign: 'left' }}>{item.question}</span>
                  <ChevronDown
                    size={20}
                    style={{
                      flexShrink: 0,
                      marginLeft: '20px',
                      transform: expandedFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {expandedFaq === idx && (
                  <div
                    style={{
                      padding: '0 20px 20px',
                      borderTop: `1px solid #e5e7eb`,
                      lineHeight: 1.6,
                      color: M,
                    }}
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── FINAL CTA ─────────────────────────────────────────────────── */}
      <section
        ref={ctaRef}
        style={{
          padding: '80px 20px',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '20px',
          }}
        >
          Prêt(e) à transformer votre vie?
        </h2>
        <p
          style={{
            fontSize: '1.125rem',
            color: M,
            marginBottom: '40px',
          }}
        >
          Rejoignez nos clients satisfaits et commencez dès aujourd'hui
        </p>

        <div
          style={{
            backgroundColor: W,
            padding: '40px',
            borderRadius: '12px',
            maxWidth: '400px',
            margin: '0 auto',
            border: `2px solid ${GN}`,
          }}
        >
          <p
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: GD,
              marginBottom: '10px',
            }}
          >
            {product.price.toFixed(0)}€
          </p>
          {product.compare_at_price && (
            <p
              style={{
                fontSize: '0.9rem',
                color: M,
                textDecoration: 'line-through',
                marginBottom: '20px',
              }}
            >
              {product.compare_at_price.toFixed(0)}€
            </p>
          )}

          {/* Email input if not set */}
          {!email && (
            <input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                border: `1px solid #e5e7eb`,
                borderRadius: '6px',
                fontSize: '1rem',
              }}
            />
          )}

          <button
            onClick={handleCheckout}
            disabled={checkoutState === 'loading'}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.125rem',
              fontWeight: 700,
              color: W,
              backgroundColor: GN,
              border: 'none',
              borderRadius: '8px',
              cursor: checkoutState === 'loading' ? 'not-allowed' : 'pointer',
              opacity: checkoutState === 'loading' ? 0.7 : 1,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (checkoutState !== 'loading') {
                e.currentTarget.style.backgroundColor = GD
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = GN
            }}
          >
            {checkoutState === 'loading'
              ? 'Chargement...'
              : 'Acheter Maintenant'}
          </button>

          <p
            style={{
              fontSize: '0.875rem',
              color: M,
              marginTop: '20px',
              borderTop: `1px solid #e5e7eb`,
              paddingTop: '20px',
            }}
          >
            ✓ {guarantee}
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── FOOTER ─────────────────────────────────────────────────── */}
      <footer
        style={{
          backgroundColor: '#f3f1ed',
          padding: '60px 20px 40px',
          borderTop: `1px solid #e5e7eb`,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            marginBottom: '40px',
          }}
        >
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '15px' }}>Theralgo</h4>
            <p style={{ fontSize: '0.9rem', color: M, lineHeight: 1.6 }}>
              Plateforme de marketing pour thérapeutes
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '15px' }}>Navigation</h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <li>
                <a href="/" style={{ color: M, textDecoration: 'none' }}>
                  Accueil
                </a>
              </li>
              <li>
                <a href="/contact" style={{ color: M, textDecoration: 'none' }}>
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '15px' }}>Légal</h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <li>
                <a href="/conditions-generales" style={{ color: M, textDecoration: 'none' }}>
                  CGV
                </a>
              </li>
              <li>
                <a href="/politique-confidentialite" style={{ color: M, textDecoration: 'none' }}>
                  Confidentialité
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: `1px solid #e5e7eb`,
            paddingTop: '30px',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: M,
          }}
        >
          <p>© {new Date().getFullYear()} Theralgo. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
