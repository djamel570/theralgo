'use client'

import { useState } from 'react'
import Link from 'next/link'

// Design tokens
const G = '#72C15F'   // lime green
const GN = '#5DB847'  // green accent
const T = '#1A1A1A'   // text dark
const M = '#6B7280'   // muted
const C = '#F7F4EE'   // cream bg
const W = '#FFFFFF'   // white

interface ROIValues {
  employees: string
  salary: string
  absenteeism: string
}

interface ROIResults {
  absenteeismSavings: number
  turnoverSavings: number
  productivityGain: number
  totalROI: number
}

function calculateROI(values: ROIValues): ROIResults {
  const employees = parseInt(values.employees) || 0
  const salary = parseInt(values.salary) || 0
  const absenteeism = parseInt(values.absenteeism) || 0

  if (employees === 0 || salary === 0) {
    return {
      absenteeismSavings: 0,
      turnoverSavings: 0,
      productivityGain: 0,
      totalROI: 0,
    }
  }

  // WHO/Deloitte formulas
  const absenteeismSavings = employees * salary * (absenteeism / 100) * 0.25
  const turnoverSavings = employees * 0.15 * salary * 0.5 * 0.20
  const productivityGain = employees * salary * 0.12
  const totalROI = absenteeismSavings + turnoverSavings + productivityGain

  return {
    absenteeismSavings: Math.round(absenteeismSavings),
    turnoverSavings: Math.round(turnoverSavings),
    productivityGain: Math.round(productivityGain),
    totalROI: Math.round(totalROI),
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function ServiceCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '2rem',
        borderRadius: '12px',
        background: W,
        border: `1px solid rgba(0,0,0,.08)`,
        transition: 'all .3s ease',
        boxShadow: hovered ? '0 12px 24px rgba(0,0,0,.08)' : '0 1px 3px rgba(0,0,0,.05)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          background: hovered ? G : C,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all .3s ease',
          color: hovered ? W : GN,
        }}
      >
        {icon}
      </div>
      <div>
        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: T,
            margin: '0 0 .5rem 0',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '.95rem',
            color: M,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        background: 'rgba(255,255,255,.12)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,.2)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: '#FFF',
          marginBottom: '.25rem',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '.85rem',
          color: 'rgba(255,255,255,.85)',
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>
    </div>
  )
}

export default function CorporateLanding() {
  const [roiValues, setROIValues] = useState<ROIValues>({
    employees: '100',
    salary: '40000',
    absenteeism: '4',
  })

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    employeeCount: '',
    specificNeeds: '',
  })

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [showConfetti, setShowConfetti] = useState(false)

  const roiResults = calculateROI(roiValues)

  const handleROIChange = (field: keyof ROIValues, value: string) => {
    setROIValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStatus('submitting')

    try {
      const response = await fetch('/api/corporate/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'prospect',
        }),
      })

      if (!response.ok) throw new Error('Failed to submit')

      setSubmitStatus('success')
      setShowConfetti(true)
      setFormData({
        companyName: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        employeeCount: '',
        specificNeeds: '',
      })

      setTimeout(() => setShowConfetti(false), 3000)
      setTimeout(() => setSubmitStatus('idle'), 5000)
    } catch (error) {
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus('idle'), 3000)
    }
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", overflowX: 'hidden' }}>
      {/* Hero Section */}
      <section
        style={{
          background: T,
          color: W,
          padding: '5rem 1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 800,
                margin: '0 0 1.5rem 0',
                lineHeight: 1.2,
              }}
            >
              Investissez dans le bien-être de vos équipes
            </h1>
            <p
              style={{
                fontSize: '1.2rem',
                color: 'rgba(255,255,255,.8)',
                maxWidth: '600px',
                margin: '0 auto 2rem',
                lineHeight: 1.6,
              }}
            >
              Réduisez l'absentéisme, améliorez la productivité et fidélisez vos talents avec nos programmes de bien-être personnalisés.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1.5rem',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              <StatBadge value="4x" label="ROI moyen" />
              <StatBadge value="-28%" label="Absentéisme" />
              <StatBadge value="+15%" label="Productivité" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section style={{ background: C, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 800,
                color: T,
                margin: 0,
              }}
            >
              Nos interventions
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            <ServiceCard
              title="Ateliers collectifs"
              description="Sessions de 2-4h pour groupes de 10-20 collaborateurs. Techniques pratiques et échanges interactifs."
              icon={
                <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
                  <circle cx="7" cy="8" r="2.5" />
                  <circle cx="14" cy="8" r="2.5" />
                  <circle cx="21" cy="8" r="2.5" />
                  <path d="M 3 12 Q 7 14 7 18 M 10 12 Q 14 14 14 18 M 17 12 Q 21 14 21 18" stroke="currentColor" strokeWidth="2" fill="none" />
                  <line x1="2" y1="20" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="16" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              }
            />
            <ServiceCard
              title="Séminaires thématiques"
              description="Journées complètes dédiées à un sujet (stress, sommeil, nutrition). Jusqu'à 50 participants."
              icon={
                <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
                  <rect x="3" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <line x1="3" y1="10" x2="25" y2="10" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="9" cy="7" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="7" r="1.5" fill="currentColor" />
                  <line x1="8" y1="24" x2="20" y2="24" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              }
            />
            <ServiceCard
              title="Accompagnement individuel EAP"
              description="Séances confidentielles avec nos thérapeutes. Soutien personnalisé pour chaque collaborateur."
              icon={
                <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
                  <circle cx="14" cy="8" r="3" />
                  <path d="M 8 14 Q 8 12 14 12 Q 20 12 20 14 L 20 22 Q 20 24 18 24 L 10 24 Q 8 24 8 22 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M 3 15 L 5 15 M 3 18 L 5 18 M 23 15 L 25 15 M 23 18 L 25 18" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              }
            />
            <ServiceCard
              title="Coaching d'équipe"
              description="6-12 sessions pour renforcer la cohésion et la résilience collective. Team building efficace."
              icon={
                <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
                  <circle cx="10" cy="8" r="2" />
                  <circle cx="18" cy="8" r="2" />
                  <path d="M 8 12 Q 8 10 10 10 Q 12 10 12 12 L 12 16" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M 16 12 Q 16 10 18 10 Q 20 10 20 12 L 20 16" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <rect x="4" y="18" width="20" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              }
            />
            <ServiceCard
              title="Webinaires"
              description="Sessions en ligne sur des thèmes clés du bien-être. Format accessible, jusqu'à 100 participants."
              icon={
                <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
                  <rect x="2" y="4" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <circle cx="14" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <line x1="2" y1="22" x2="26" y2="22" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              }
            />
            <ServiceCard
              title="Intervention de crise"
              description="Prise en charge rapide en cas de situation difficile. Déploiement dans les 24h."
              icon={
                <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
                  <path d="M 14 2 L 20 8 L 14 14 L 20 20 L 14 26 L 8 20 L 2 26 L 8 20 L 2 14 L 8 8 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section style={{ background: W, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 800,
                color: T,
                margin: 0,
              }}
            >
              Calculatrice ROI
            </h2>
            <p style={{ color: M, fontSize: '1rem', marginTop: '0.5rem' }}>
              Estimez les économies possibles pour votre organisation
            </p>
          </div>

          <div style={{ background: C, padding: '2.5rem', borderRadius: '16px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '2rem',
                marginBottom: '2rem',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '.9rem',
                    fontWeight: 600,
                    color: T,
                    marginBottom: '.5rem',
                  }}
                >
                  Nombre de collaborateurs
                </label>
                <input
                  type="number"
                  min="1"
                  value={roiValues.employees}
                  onChange={(e) => handleROIChange('employees', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '.75rem 1rem',
                    fontSize: '1rem',
                    border: `1px solid rgba(0,0,0,.12)`,
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '.9rem',
                    fontWeight: 600,
                    color: T,
                    marginBottom: '.5rem',
                  }}
                >
                  Salaire moyen annuel (€)
                </label>
                <input
                  type="number"
                  min="0"
                  value={roiValues.salary}
                  onChange={(e) => handleROIChange('salary', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '.75rem 1rem',
                    fontSize: '1rem',
                    border: `1px solid rgba(0,0,0,.12)`,
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '.9rem',
                    fontWeight: 600,
                    color: T,
                    marginBottom: '.5rem',
                  }}
                >
                  Taux d'absentéisme actuel (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={roiValues.absenteeism}
                  onChange={(e) => handleROIChange('absenteeism', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '.75rem 1rem',
                    fontSize: '1rem',
                    border: `1px solid rgba(0,0,0,.12)`,
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                paddingTop: '2rem',
                borderTop: `1px solid rgba(0,0,0,.08)`,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '.85rem',
                    color: M,
                    margin: '0 0 .5rem 0',
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    fontWeight: 600,
                  }}
                >
                  Économies absentéisme
                </p>
                <p
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: G,
                    margin: 0,
                  }}
                >
                  {formatCurrency(roiResults.absenteeismSavings)}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: '.85rem',
                    color: M,
                    margin: '0 0 .5rem 0',
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    fontWeight: 600,
                  }}
                >
                  Économies turnover
                </p>
                <p
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: G,
                    margin: 0,
                  }}
                >
                  {formatCurrency(roiResults.turnoverSavings)}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: '.85rem',
                    color: M,
                    margin: '0 0 .5rem 0',
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    fontWeight: 600,
                  }}
                >
                  Gains productivité
                </p>
                <p
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: G,
                    margin: 0,
                  }}
                >
                  {formatCurrency(roiResults.productivityGain)}
                </p>
              </div>
              <div
                style={{
                  gridColumn: 'auto',
                  background: G,
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '.85rem',
                    color: 'rgba(255,255,255,.8)',
                    margin: '0 0 .5rem 0',
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    fontWeight: 600,
                  }}
                >
                  ROI Total
                </p>
                <p
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: W,
                    margin: 0,
                  }}
                >
                  {formatCurrency(roiResults.totalROI)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ background: C, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 800,
                color: T,
                margin: 0,
              }}
            >
              Comment ça marche
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          >
            {[
              {
                number: '1',
                title: 'Diagnostic gratuit',
                description: 'Évaluation des besoins spécifiques de votre entreprise',
              },
              {
                number: '2',
                title: 'Programme sur-mesure',
                description: 'Ateliers et séances adaptés à votre contexte',
              },
              {
                number: '3',
                title: 'Résultats mesurables',
                description: 'Rapports d\'impact et suivi des KPIs',
              },
            ].map((step, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    margin: '0 auto 1.5rem',
                    background: G,
                    color: W,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                  }}
                >
                  {step.number}
                </div>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: T,
                    margin: '0 0 .75rem 0',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontSize: '.95rem',
                    color: M,
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section style={{ background: W, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 800,
                color: T,
                margin: 0,
              }}
            >
              Prêt à commencer?
            </h2>
            <p style={{ color: M, fontSize: '1rem', marginTop: '0.75rem' }}>
              Demandez une proposition gratuite et sans engagement
            </p>
          </div>

          {submitStatus === 'success' ? (
            <div
              style={{
                background: C,
                border: `2px solid ${G}`,
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                }}
              >
                ✓
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: T, margin: '0 0 .5rem 0' }}>
                Merci pour votre intérêt!
              </h3>
              <p style={{ color: M, margin: 0, lineHeight: 1.6 }}>
                Notre équipe vous contactera sous 24h pour discuter de vos besoins en bien-être collaborateur.
              </p>
              {showConfetti && (
                <div
                  style={{
                    fontSize: '3rem',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'float 2s ease-out forwards',
                  }}
                >
                  🎉
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Nom de votre entreprise"
                  value={formData.companyName}
                  onChange={(e) => handleFormChange('companyName', e.target.value)}
                  required
                  style={{
                    padding: '.85rem 1rem',
                    fontSize: '.95rem',
                    border: `1px solid rgba(0,0,0,.12)`,
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  type="text"
                  placeholder="Votre nom complet"
                  value={formData.contactName}
                  onChange={(e) => handleFormChange('contactName', e.target.value)}
                  required
                  style={{
                    padding: '.85rem 1rem',
                    fontSize: '.95rem',
                    border: `1px solid rgba(0,0,0,.12)`,
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <input
                  type="email"
                  placeholder="Votre email"
                  value={formData.contactEmail}
                  onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                  required
                  style={{
                    padding: '.85rem 1rem',
                    fontSize: '.95rem',
                    border: `1px solid rgba(0,0,0,.12)`,
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  type="tel"
                  placeholder="Votre téléphone"
                  value={formData.contactPhone}
                  onChange={(e) => handleFormChange('contactPhone', e.target.value)}
                  required
                  style={{
                    padding: '.85rem 1rem',
                    fontSize: '.95rem',
                    border: `1px solid rgba(0,0,0,.12)`,
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <input
                type="number"
                min="1"
                placeholder="Nombre de collaborateurs"
                value={formData.employeeCount}
                onChange={(e) => handleFormChange('employeeCount', e.target.value)}
                required
                style={{
                  padding: '.85rem 1rem',
                  fontSize: '.95rem',
                  border: `1px solid rgba(0,0,0,.12)`,
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />

              <textarea
                placeholder="Décrivez vos besoins ou situations spécifiques..."
                value={formData.specificNeeds}
                onChange={(e) => handleFormChange('specificNeeds', e.target.value)}
                rows={4}
                style={{
                  padding: '.85rem 1rem',
                  fontSize: '.95rem',
                  border: `1px solid rgba(0,0,0,.12)`,
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'none',
                }}
              />

              <button
                type="submit"
                disabled={submitStatus === 'submitting'}
                style={{
                  padding: '1rem',
                  background: submitStatus === 'submitting' ? M : G,
                  color: W,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '.95rem',
                  fontWeight: 700,
                  cursor: submitStatus === 'submitting' ? 'not-allowed' : 'pointer',
                  transition: 'all .3s ease',
                  opacity: submitStatus === 'submitting' ? 0.7 : 1,
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (submitStatus !== 'submitting') {
                    (e.currentTarget as HTMLElement).style.background = GN
                  }
                }}
                onMouseLeave={(e) => {
                  if (submitStatus !== 'submitting') {
                    (e.currentTarget as HTMLElement).style.background = G
                  }
                }}
              >
                {submitStatus === 'submitting' ? 'Envoi...' : 'Demander une proposition gratuite'}
              </button>

              {submitStatus === 'error' && (
                <div
                  style={{
                    padding: '1rem',
                    background: 'rgba(239,68,68,.1)',
                    border: '1px solid rgba(239,68,68,.3)',
                    borderRadius: '8px',
                    color: '#DC2626',
                    fontSize: '.9rem',
                    textAlign: 'center',
                  }}
                >
                  Une erreur s'est produite. Veuillez réessayer.
                </div>
              )}
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: T, color: W, padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" fill={GN} />
              <path d="M9 14 Q14 7 19 14 Q14 21 9 14Z" fill="white" />
            </svg>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>
              Ther<span style={{ color: G }}>algo</span>
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem', margin: 0, lineHeight: 1.6 }}>
            Algorithmes de bien-être pour les thérapeutes et les entreprises.
          </p>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes float {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -150%) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
