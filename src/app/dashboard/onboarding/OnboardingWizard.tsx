'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  TrendingUp,
  Briefcase,
  Music,
  BookOpen,
  Users,
  Sparkles,
  Loader2,
  AlertCircle,
  Calendar,
  Package,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { completeOnboardingStep, completeOnboarding, saveOnboardingTrack, getStepsForTrack, OnboardingTrack } from '@/lib/onboarding'

const GN = '#72C15F'
const DK = '#1A1A1A'
const M = '#6B7280'
const C = '#F7F4EE'
const W = '#FFFFFF'
const LV = '#C4B5FD'
const YL = '#FBD24D'
const RD = '#FF6B6B'

interface OnboardingWizardProps {
  userId: string
  userName: string
  userEmail: string
  initialProfile?: any
}

function ProgressIndicator({
  current,
  total,
}: {
  current: number
  total: number
}) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 6,
            borderRadius: 3,
            background: i < current ? GN : i === current ? DK : C,
            transition: 'all 0.3s',
            flex: 1,
          }}
        />
      ))}
    </div>
  )
}

function StepHeader({
  step,
  total,
  label,
}: {
  step: number
  total: number
  label: string
}) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: GN,
            color: W,
            fontWeight: 800,
            fontSize: '0.85rem',
          }}
        >
          {step}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: M,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Étape {step} sur {total}
        </span>
      </div>
      <h1
        style={{
          fontWeight: 800,
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          color: DK,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }}
      >
        {label}
      </h1>
    </div>
  )
}

// ── STEP 1: WELCOME ────────────────────────────────────────
function StepWelcome({
  userName,
  onNext,
}: {
  userName: string
  onNext: () => void
}) {
  return (
    <div style={{ maxWidth: 720 }}>
      <StepHeader step={1} total={2} label={`Bienvenue sur Theralgo, ${userName.split(' ')[0]} !`} />

      <div style={{ marginBottom: '3rem' }}>
        <p
          style={{
            fontSize: '1.05rem',
            color: M,
            lineHeight: 1.8,
            marginBottom: '2.5rem',
          }}
        >
          Rejoignez des centaines de thérapeutes qui utilisent Theralgo pour remplir leur agenda et créer des revenus passifs.
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          {[
            {
              icon: Briefcase,
              label: 'Remplissez votre cabinet',
              desc: 'Attirez des patients qualifiés avec nos campagnes IA',
              color: GN,
            },
            {
              icon: Package,
              label: 'Vendez des produits digitaux',
              desc: 'Créez des programmes en ligne avec l\'IA',
              color: LV,
            },
            {
              icon: Zap,
              label: 'Piloté par l\'IA',
              desc: 'Optimisation autonome, zéro configuration complexe',
              color: YL,
            },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: '1.5rem',
                  borderRadius: 20,
                  background: W,
                  border: `1px solid ${item.color}20`,
                  transition: 'all 0.25s',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={24} color={item.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: DK, marginBottom: 4 }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: M, lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={onNext}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '1rem 2rem',
          borderRadius: 999,
          border: 'none',
          background: DK,
          color: W,
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.25s',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}
      >
        Choisir mon chemin <ArrowRight size={18} />
      </button>
    </div>
  )
}

// ── STEP 2: CHOOSE TRACK ────────────────────────────────────────
function StepChooseTrack({
  userId,
  onTrackSelected,
}: {
  userId: string
  onTrackSelected: (track: OnboardingTrack) => void
}) {
  const [selectedTrack, setSelectedTrack] = useState<OnboardingTrack | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const tracks = [
    {
      id: 'acquisition' as const,
      title: 'Remplir mon agenda',
      icon: Calendar,
      description: 'Attirez des patients qualifiés grâce à des campagnes Meta Ads optimisées par l\'IA',
      features: [
        'Ciblage algorithmique',
        'Landing pages personnalisées',
        'Optimisation autonome',
      ],
      result: '5 à 15 nouveaux patients/mois',
      color: GN,
    },
    {
      id: 'digital_products' as const,
      title: 'Vendre des produits digitaux',
      icon: Package,
      description: 'Créez et vendez des programmes en ligne (audio, cours, ateliers)',
      features: [
        'L\'IA crée votre produit',
        'Page de vente générée',
        'Paiement Stripe intégré',
      ],
      result: '€500 à €3 000/mois de revenus passifs',
      color: LV,
    },
    {
      id: 'both' as const,
      title: 'Les deux',
      icon: Sparkles,
      description: 'La puissance combinée : vos produits financent vos publicités',
      features: [
        'Acquisition patients + Produits digitaux',
        'Le flywheel : vos produits paient vos pubs',
        'Liberté financière',
      ],
      result: 'Cabinet rempli + revenus passifs',
      color: GN,
      recommended: true,
    },
  ]

  const handleSelect = async (track: OnboardingTrack) => {
    setSelectedTrack(track)
    setSaving(true)
    try {
      await saveOnboardingTrack(userId, track, supabase)
      await new Promise((resolve) => setTimeout(resolve, 500))
      onTrackSelected(track)
    } catch (err) {
      console.error('Error saving track:', err)
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 920 }}>
      <StepHeader step={2} total={2} label="Quel est votre objectif ?" />

      <p style={{ fontSize: '1rem', color: M, marginBottom: '2rem', lineHeight: 1.7 }}>
        Choisissez le chemin qui correspond le mieux à vos ambitions. Vous pourrez toujours changer plus tard.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: '2rem' }}>
        {tracks.map((track) => {
          const Icon = track.icon
          const isSelected = selectedTrack === track.id
          const isSaving = saving && selectedTrack === track.id

          return (
            <button
              key={track.id}
              onClick={() => !saving && handleSelect(track.id)}
              disabled={saving && !isSaving}
              style={{
                padding: '1.75rem',
                borderRadius: 20,
                border: isSelected ? `2px solid ${track.color}` : '1.5px solid rgba(0,0,0,0.12)',
                background: isSelected ? `${track.color}08` : W,
                cursor: isSaving ? 'not-allowed' : saving ? 'not-allowed' : 'pointer',
                opacity: saving && !isSaving ? 0.5 : 1,
                transition: 'all 0.25s',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!saving && !isSelected) {
                  (e.currentTarget as HTMLElement).style.borderColor = track.color
                  (e.currentTarget as HTMLElement).style.background = `${track.color}04`
                }
              }}
              onMouseLeave={(e) => {
                if (!saving && !isSelected) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.12)'
                  (e.currentTarget as HTMLElement).style.background = W
                }
              }}
            >
              {track.recommended && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: track.color,
                    color: W,
                    padding: '0.35rem 0.75rem',
                    borderRadius: 999,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Recommandé
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${track.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={track.color} />
                </div>
                {isSaving && <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginLeft: 'auto' }} />}
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: DK, marginBottom: '0.5rem' }}>
                {track.title}
              </h3>

              <p style={{ fontSize: '0.85rem', color: M, marginBottom: '1rem', lineHeight: 1.6 }}>
                {track.description}
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                {track.features.map((feature, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: track.color,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: DK }}>{feature}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: 12,
                  background: `${track.color}12`,
                  borderLeft: `3px solid ${track.color}`,
                }}
              >
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: track.color, marginBottom: 4 }}>
                  RÉSULTAT ESTIMÉ
                </p>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: DK }}>
                  {track.result}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

// ── STEP 3: PROFILE ────────────────────────────────────────
function StepProfile({
  userId,
  track,
  initialProfile,
  onNext,
}: {
  userId: string
  track: OnboardingTrack
  initialProfile?: any
  onNext: () => void
}) {
  const [formData, setFormData] = useState({
    name: initialProfile?.name || '',
    specialty: initialProfile?.specialty || '',
    city: initialProfile?.city || '',
    consultation_price: initialProfile?.consultation_price || '',
    approach_description: initialProfile?.approach_description || '',
    main_problem_solved: initialProfile?.main_problem_solved || '',
    main_techniques: initialProfile?.main_techniques || '',
    ideal_patient_profile: initialProfile?.ideal_patient_profile || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const isAcquisitionTrack = track === 'acquisition' || track === 'both'

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Nom requis (min. 2 caractères)'
    }
    if (!formData.specialty) {
      newErrors.specialty = 'Choisissez votre spécialité'
    }
    if (isAcquisitionTrack) {
      if (!formData.city || formData.city.length < 2) {
        newErrors.city = 'Ville requise'
      }
      if (!formData.consultation_price || Number(formData.consultation_price) < 1) {
        newErrors.consultation_price = 'Tarif requis'
      }
    }
    if (!formData.approach_description || formData.approach_description.length < 30) {
      newErrors.approach_description = 'Décrivez votre approche (min. 30 caractères)'
    }
    if (!formData.main_problem_solved || formData.main_problem_solved.length < 30) {
      newErrors.main_problem_solved = 'Décrivez le problème principal (min. 30 caractères)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('therapist_profiles')
        .upsert(
          {
            user_id: userId,
            ...formData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (error) {
        setErrors({ form: 'Erreur de sauvegarde. Veuillez réessayer.' })
        return
      }

      await completeOnboardingStep(userId, 'profile', track, supabase)
      onNext()
    } catch (err) {
      setErrors({ form: 'Une erreur est survenue.' })
    } finally {
      setSaving(false)
    }
  }

  const specialties = [
    { value: '', label: 'Choisir une spécialité' },
    { value: 'hypnotherapeute', label: 'Hypnothérapeute' },
    { value: 'naturopathe', label: 'Naturopathe' },
    { value: 'sophrologue', label: 'Sophrologue' },
    { value: 'psychotherapeute', label: 'Psychothérapeute' },
    { value: 'coach', label: 'Coach de vie' },
    { value: 'osteopathe', label: 'Ostéopathe' },
    { value: 'kinesiologue', label: 'Kinésiologue' },
    { value: 'autre', label: 'Autre' },
  ]

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: 14,
    border: '1.5px solid rgba(0,0,0,0.12)',
    background: C,
    fontSize: '0.875rem',
    color: DK,
    outline: 'none' as const,
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    boxSizing: 'border-box' as const,
  }

  const steps = getStepsForTrack(track)
  const currentStepIndex = steps.findIndex((s) => s.key === 'profile') + 1

  return (
    <div style={{ maxWidth: 720 }}>
      <StepHeader step={currentStepIndex} total={steps.length} label="Votre profil professionnel" />

      <div
        style={{
          background: W,
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 20,
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        {errors.form && (
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1.5px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={18} color={RD} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.85rem', color: '#C0392B' }}>{errors.form}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: DK, marginBottom: 6 }}>
              Nom complet
            </label>
            <input
              type="text"
              style={inputStyle}
              placeholder="Dr. Marie Dupont"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <p style={{ fontSize: '0.7rem', color: RD, marginTop: 4 }}>{errors.name}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: DK, marginBottom: 6 }}>
              Spécialité
            </label>
            <select
              style={inputStyle}
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            >
              {specialties.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {errors.specialty && <p style={{ fontSize: '0.7rem', color: RD, marginTop: 4 }}>{errors.specialty}</p>}
          </div>
        </div>

        {isAcquisitionTrack && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: DK, marginBottom: 6 }}>
                Ville et département
              </label>
              <input
                type="text"
                style={inputStyle}
                placeholder="Paris 11e (75)"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              {errors.city && <p style={{ fontSize: '0.7rem', color: RD, marginTop: 4 }}>{errors.city}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: DK, marginBottom: 6 }}>
                Tarif consultation (€)
              </label>
              <input
                type="number"
                style={inputStyle}
                placeholder="80"
                value={formData.consultation_price}
                onChange={(e) => setFormData({ ...formData, consultation_price: e.target.value })}
              />
              {errors.consultation_price && (
                <p style={{ fontSize: '0.7rem', color: RD, marginTop: 4 }}>{errors.consultation_price}</p>
              )}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: DK, marginBottom: 6 }}>
            Décrivez votre approche thérapeutique
          </label>
          <textarea
            style={{
              ...inputStyle,
              minHeight: 100,
              resize: 'vertical',
            }}
            placeholder="Mon approche combine la sophrologie avec des techniques de pleine conscience..."
            value={formData.approach_description}
            onChange={(e) => setFormData({ ...formData, approach_description: e.target.value })}
          />
          {errors.approach_description && (
            <p style={{ fontSize: '0.7rem', color: RD, marginTop: 4 }}>{errors.approach_description}</p>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: DK, marginBottom: 6 }}>
            Le problème principal que vous aidez à résoudre
          </label>
          <textarea
            style={{
              ...inputStyle,
              minHeight: 100,
              resize: 'vertical',
            }}
            placeholder="Le stress chronique qui empêche de dormir, d'être pleinement présent..."
            value={formData.main_problem_solved}
            onChange={(e) => setFormData({ ...formData, main_problem_solved: e.target.value })}
          />
          {errors.main_problem_solved && (
            <p style={{ fontSize: '0.7rem', color: RD, marginTop: 4 }}>{errors.main_problem_solved}</p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: DK, marginBottom: 6 }}>
              Vos techniques principales
            </label>
            <textarea
              style={{
                ...inputStyle,
                minHeight: 80,
                resize: 'vertical',
              }}
              placeholder="1. Hypnose ericksonienne&#10;2. Cohérence cardiaque&#10;3. EMDR"
              value={formData.main_techniques}
              onChange={(e) => setFormData({ ...formData, main_techniques: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: DK, marginBottom: 6 }}>
              Votre patient idéal
            </label>
            <textarea
              style={{
                ...inputStyle,
                minHeight: 80,
                resize: 'vertical',
              }}
              placeholder="Des adultes entre 30 et 55 ans, souvent des actifs stressés..."
              value={formData.ideal_patient_profile}
              onChange={(e) => setFormData({ ...formData, ideal_patient_profile: e.target.value })}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '1rem 2rem',
          borderRadius: 999,
          border: 'none',
          background: saving ? M : DK,
          color: W,
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
          transition: 'all 0.25s',
        }}
      >
        {saving ? (
          <>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde...
          </>
        ) : (
          <>
            Suivant <ArrowRight size={18} />
          </>
        )}
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────
export default function OnboardingWizard({
  userId,
  userName,
  userEmail,
  initialProfile,
}: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTrack, setSelectedTrack] = useState<OnboardingTrack | null>(null)

  const steps = selectedTrack ? getStepsForTrack(selectedTrack) : [{ key: 'welcome', label: 'Bienvenue', description: '' }, { key: 'choose_track', label: 'Votre objectif', description: '' }]

  const handleTrackSelected = (track: OnboardingTrack) => {
    setSelectedTrack(track)
    setCurrentStep(2)
  }

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const renderStep = () => {
    const stepKey = steps[currentStep]?.key

    switch (stepKey) {
      case 'welcome':
        return <StepWelcome userName={userName} onNext={handleNext} />
      case 'choose_track':
        return <StepChooseTrack userId={userId} onTrackSelected={handleTrackSelected} />
      case 'profile':
        return selectedTrack ? (
          <StepProfile
            userId={userId}
            track={selectedTrack}
            initialProfile={initialProfile}
            onNext={handleNext}
          />
        ) : null
      default:
        return <div style={{ color: DK }}>Étape en cours de développement</div>
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C,
        padding: '3rem 2rem',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Progress indicator - only show if track is selected */}
        {selectedTrack && (
          <div style={{ marginBottom: '3rem' }}>
            <ProgressIndicator current={currentStep} total={steps.length} />
          </div>
        )}

        {renderStep()}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
