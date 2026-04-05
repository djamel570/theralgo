'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, Sparkles, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const GN = '#8ED462'
const T  = '#1A1A1A'
const M  = '#6B7280'
const C  = '#F7F4EE'
const W  = '#FFFFFF'
const LV = '#C4B5FD'
const YL = '#FBD24D'

/* ── Zod schema — 10 champs requis ─────────────────────── */
const schema = z.object({
  // Section 1
  name:                    z.string().min(2, 'Nom requis (min. 2 caractères)'),
  specialty:               z.string().min(1, 'Choisissez votre spécialité'),
  city:                    z.string().min(2, 'Ville requise'),
  consultation_price:      z.coerce.number().min(1, 'Indiquez votre tarif de consultation'),
  // Section 2
  approach_description:    z.string().min(50, 'Décrivez votre approche (min. 50 caractères)'),
  main_techniques:         z.string().min(20, 'Listez vos techniques principales'),
  patient_transformation:  z.string().min(30, 'Décrivez la transformation apportée'),
  // Section 3
  ideal_patient_profile:   z.string().min(30, 'Décrivez votre patient idéal'),
  main_problem_solved:     z.string().min(30, 'Quel problème principal résolvez-vous ?'),
  // Section 4
  unique_differentiator:   z.string().min(40, 'Partagez ce qui vous différencie'),
})
type FormData = z.infer<typeof schema>

const specialties = [
  { value: '', label: 'Choisir une spécialité' },
  { value: 'hypnotherapeute',  label: 'Hypnothérapeute' },
  { value: 'naturopathe',      label: 'Naturopathe' },
  { value: 'sophrologue',      label: 'Sophrologue' },
  { value: 'psychotherapeute', label: 'Psychothérapeute' },
  { value: 'coach',            label: 'Coach de vie' },
  { value: 'osteopathe',       label: 'Ostéopathe' },
  { value: 'kinesiologue',     label: 'Kinésiologue' },
  { value: 'autre',            label: 'Autre' },
]

/* ── Sections / steps ───────────────────────────────────── */
const SECTIONS = [
  { label: 'Identité professionnelle', color: GN, fields: ['name','specialty','city','consultation_price'] as const },
  { label: 'Votre approche',          color: LV, fields: ['approach_description','main_techniques','patient_transformation'] as const },
  { label: 'Votre patient idéal',     color: YL, fields: ['ideal_patient_profile','main_problem_solved'] as const },
  { label: 'Votre histoire & ADN',    color: '#FF6B6B', fields: ['unique_differentiator'] as const },
]

/* ── Signature result type ──────────────────────────────── */
interface Signature {
  headline: string
  about: string
  benefits: string[]
  cta: string
}

/* ── Sub-components ─────────────────────────────────────── */
const inputBase: React.CSSProperties = {
  width: '100%', padding: '.85rem 1rem', borderRadius: 14,
  border: '1.5px solid rgba(0,0,0,.12)', background: C,
  fontSize: '.875rem', color: T, outline: 'none',
  transition: 'border-color .2s, box-shadow .2s',
  fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
  boxSizing: 'border-box' as const,
}

function Field({ label, hint, error, required, children }: {
  label: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '.78rem', fontWeight: 700, color: T, letterSpacing: '.02em' }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: '.72rem', color: M, lineHeight: 1.55, marginBottom: 2 }}>{hint}</p>}
      {children}
      {error && <p style={{ fontSize: '.72rem', color: '#EF4444', marginTop: 1 }}>{error}</p>}
    </div>
  )
}

/* ── Signature card ─────────────────────────────────────── */
function SignatureCard({ sig }: { sig: Signature }) {
  return (
    <div style={{ marginTop: '2rem', background: T, borderRadius: 24, padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: GN, opacity: .07, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
        <Sparkles size={18} color={GN} />
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: GN, letterSpacing: '-.01em' }}>Votre Therapist Signature</h3>
      </div>

      {/* Headline */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '.65rem', fontWeight: 700, color: GN, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 6 }}>Accroche principale</p>
        <p style={{ fontWeight: 800, fontSize: 'clamp(1.1rem,2vw,1.4rem)', color: 'white', lineHeight: 1.25, letterSpacing: '-.02em' }}>"{sig.headline}"</p>
      </div>

      {/* About */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(255,255,255,.45)', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 6 }}>À propos</p>
        <p style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>{sig.about}</p>
      </div>

      {/* Benefits */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '.65rem', fontWeight: 700, color: 'rgba(255,255,255,.45)', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 8 }}>Ce que vous apportez</p>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sig.benefits.map((b, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${GN}28`, border: `1px solid ${GN}50`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                <CheckCircle size={10} color={GN} />
              </div>
              <p style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.82)', lineHeight: 1.6 }}>{b}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div style={{ padding: '1rem 1.25rem', background: `${GN}15`, border: `1px solid ${GN}30`, borderRadius: 14 }}>
        <p style={{ fontSize: '.65rem', fontWeight: 700, color: GN, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 4 }}>Call-to-action</p>
        <p style={{ fontWeight: 700, fontSize: '.9rem', color: 'white' }}>"{sig.cta}"</p>
      </div>

      <p style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)', marginTop: '1.25rem', textAlign: 'center' }}>
        Cette Therapist Signature sera utilisée pour créer votre landing page personnalisée
      </p>
    </div>
  )
}

/* ── Main ──────────────────────────────────────────────── */
export default function ProfileForm({ userId, initialData }: {
  userId: string
  initialData?: Partial<Record<keyof FormData, unknown>>
}) {
  const [step,       setStep]       = useState(0)
  const [saving,     setSaving]     = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [signature,  setSignature]  = useState<Signature | null>(null)
  const [genError,   setGenError]   = useState<string | null>(null)
  const supabase = createClient()

  const { register, handleSubmit, trigger, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: initialData as Partial<FormData>,
    mode: 'onBlur',
  })

  /* ── Validate current step before advancing ─────────── */
  const goNext = async () => {
    const fields = SECTIONS[step].fields as unknown as Parameters<typeof trigger>[0]
    const ok = await trigger(fields)
    if (ok) setStep(s => Math.min(s + 1, SECTIONS.length - 1))
  }
  const goPrev = () => setStep(s => Math.max(s - 1, 0))

  /* ── Submit ─────────────────────────────────────────── */
  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setSaved(false)
    setGenError(null)
    setSignature(null)

    // 1. Save to Supabase
    const { error: dbErr } = await supabase
      .from('therapist_profiles')
      .upsert({ ...data, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

    setSaving(false)

    if (dbErr) {
      setGenError('Erreur de sauvegarde. Veuillez réessayer.')
      return
    }

    setSaved(true)

    // 2. Generate signature via OpenAI
    setGenerating(true)
    try {
      const res = await fetch('/api/profile/generate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profileData: data }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.signature) setSignature(json.signature)
      } else {
        const err = await res.json().catch(() => ({}))
        setGenError(err.error || 'Erreur lors de la génération.')
      }
    } catch {
      setGenError('Impossible de contacter le service de génération.')
    } finally {
      setGenerating(false)
    }
  }

  const currentSection = SECTIONS[step]
  const isLast = step === SECTIONS.length - 1
  const progress = ((step + 1) / SECTIONS.length) * 100

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <style>{`
        .sig-input:focus { border-color: ${GN} !important; box-shadow: 0 0 0 3px rgba(142,212,98,.14) !important; }
        .sig-input::placeholder { color: #9CA3AF; }
        .sig-input option { background: #F7F4EE; color: #1A1A1A; }
        textarea.sig-input { resize: vertical; min-height: 100px; line-height: 1.7; }
      `}</style>

      {/* Progress header */}
      <div style={{ background: W, borderRadius: 24, border: '1px solid rgba(0,0,0,.07)', boxShadow: '0 2px 12px rgba(0,0,0,.04)', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
          {/* Steps indicators */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
            {SECTIONS.map((s, i) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: i < SECTIONS.length - 1 ? 1 : 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < step ? s.color : i === step ? T : C,
                  border: `2px solid ${i === step ? T : i < step ? s.color : 'rgba(0,0,0,.1)'}`,
                  transition: 'all .3s',
                }}>
                  {i < step
                    ? <CheckCircle size={13} color="white" />
                    : <span style={{ fontSize: '.7rem', fontWeight: 800, color: i === step ? 'white' : M }}>{i + 1}</span>}
                </div>
                {i < SECTIONS.length - 1 && (
                  <div style={{ flex: 1, height: 2, borderRadius: 99, background: i < step ? s.color : 'rgba(0,0,0,.08)', transition: 'background .3s' }} />
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentSection.color }} />
                <span style={{ fontSize: '.7rem', fontWeight: 700, color: M, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  Étape {step + 1} sur {SECTIONS.length}
                </span>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: T, letterSpacing: '-.02em' }}>{currentSection.label}</h2>
            </div>
            <div style={{ height: 40, width: 40, borderRadius: '50%', position: 'relative' }}>
              <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="20" cy="20" r="16" fill="none" stroke={C} strokeWidth="3" />
                <circle cx="20" cy="20" r="16" fill="none" stroke={currentSection.color} strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress / 100)}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset .4s ease' }} />
              </svg>
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 800, color: T }}>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── SECTION 1 ─────────────────────────────────── */}
            {step === 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14 }}>
                  <Field label="Nom complet" required error={errors.name?.message}>
                    <input className="sig-input" style={inputBase} placeholder="Dr. Marie Dupont" {...register('name')} />
                  </Field>
                  <Field label="Spécialité principale" required error={errors.specialty?.message}>
                    <select className="sig-input" style={inputBase} {...register('specialty')}>
                      {specialties.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14 }}>
                  <Field label="Ville et département" required error={errors.city?.message}>
                    <input className="sig-input" style={inputBase} placeholder="Paris 11e (75)" {...register('city')} />
                  </Field>
                  <Field label="Tarif de consultation (€)" required error={errors.consultation_price?.message}>
                    <input className="sig-input" style={inputBase} type="number" placeholder="80" {...register('consultation_price')} />
                  </Field>
                </div>
              </>
            )}

            {/* ── SECTION 2 ─────────────────────────────────── */}
            {step === 1 && (
              <>
                <Field label="Décrivez votre approche thérapeutique" required
                  hint="En 2-3 phrases, comment travaillez-vous avec vos patients ?"
                  error={errors.approach_description?.message}>
                  <textarea className="sig-input" style={inputBase} rows={4}
                    placeholder="Mon approche combine la sophrologie avec des techniques de pleine conscience pour aider mes patients à retrouver équilibre et sérénité..."
                    {...register('approach_description')} />
                </Field>
                <Field label="Vos 3 spécialités ou techniques principales" required
                  hint="Listez vos méthodes et outils thérapeutiques"
                  error={errors.main_techniques?.message}>
                  <textarea className="sig-input" style={inputBase} rows={3}
                    placeholder="1. Hypnose ericksonienne\n2. Cohérence cardiaque\n3. EMDR"
                    {...register('main_techniques')} />
                </Field>
                <Field label="La transformation principale que vous apportez" required
                  hint="Qu'est-ce que vos patients vivent après vos séances ?"
                  error={errors.patient_transformation?.message}>
                  <textarea className="sig-input" style={inputBase} rows={3}
                    placeholder="Mes patients retrouvent une confiance en eux durable et apprennent à gérer leurs émotions au quotidien..."
                    {...register('patient_transformation')} />
                </Field>
              </>
            )}

            {/* ── SECTION 3 ─────────────────────────────────── */}
            {step === 2 && (
              <>
                <Field label="Décrivez votre patient idéal" required
                  hint="Âge, situation, état d'esprit, ce qu'il cherche"
                  error={errors.ideal_patient_profile?.message}>
                  <textarea className="sig-input" style={inputBase} rows={4}
                    placeholder="Des adultes entre 30 et 55 ans, souvent des actifs stressés ou des parents débordés qui sentent qu'ils ne s'appartiennent plus..."
                    {...register('ideal_patient_profile')} />
                </Field>
                <Field label="Le problème principal que vous aidez à résoudre" required
                  hint="Formulez-le du point de vue de votre patient"
                  error={errors.main_problem_solved?.message}>
                  <textarea className="sig-input" style={inputBase} rows={4}
                    placeholder="Le stress chronique qui empêche de dormir, d'être pleinement présent pour sa famille ou de performer au travail..."
                    {...register('main_problem_solved')} />
                </Field>
              </>
            )}

            {/* ── SECTION 4 ─────────────────────────────────── */}
            {step === 3 && (
              <Field label="Ce qui vous différencie — votre histoire, votre pourquoi" required
                hint="Qu'est-ce qui vous a amené à cette pratique ? Qu'est-ce que vous seul pouvez offrir ?"
                error={errors.unique_differentiator?.message}>
                <textarea className="sig-input" style={inputBase} rows={6}
                  placeholder="Après avoir moi-même traversé un burn-out, j'ai découvert la sophrologie comme outil de reconstruction. Cette expérience personnelle me permet de comprendre de l'intérieur ce que vivent mes patients..."
                  {...register('unique_differentiator')} />
              </Field>
            )}

          </div>

          {/* Navigation buttons */}
          <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid rgba(0,0,0,.06)', display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" onClick={goPrev} disabled={step === 0} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '.75rem 1.25rem', borderRadius: 999,
              border: '1.5px solid rgba(0,0,0,.12)', background: step === 0 ? 'transparent' : W,
              color: step === 0 ? 'rgba(0,0,0,.2)' : T, fontSize: '.85rem', fontWeight: 600,
              cursor: step === 0 ? 'not-allowed' : 'pointer', transition: 'all .2s',
            }}>
              <ChevronLeft size={15} /> Précédent
            </button>

            {isLast ? (
              <button type="submit" disabled={saving || generating} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '.85rem 1.75rem', borderRadius: 999,
                border: 'none', background: T, color: 'white',
                fontSize: '.88rem', fontWeight: 700, cursor: saving || generating ? 'not-allowed' : 'pointer',
                opacity: saving || generating ? .7 : 1, transition: 'all .2s',
              }}>
                {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde...</>
                  : generating ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Génération IA...</>
                    : saved ? <><CheckCircle size={15} color={GN} /> Signature générée !</>
                      : <><Sparkles size={15} /> Générer ma Therapist Signature</>}
              </button>
            ) : (
              <button type="button" onClick={goNext} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '.85rem 1.75rem', borderRadius: 999,
                border: 'none', background: T, color: 'white',
                fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
              }}>
                Suivant <ChevronRight size={15} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Generating state */}
      {generating && (
        <div style={{ background: W, borderRadius: 20, border: '1.5px solid rgba(142,212,98,.3)', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1rem' }}>
          <Loader2 size={24} color={GN} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: '.9rem', color: T }}>Génération de votre Therapist Signature...</p>
            <p style={{ fontSize: '.78rem', color: M, marginTop: 3 }}>Notre IA analyse votre profil pour créer votre landing page personnalisée</p>
          </div>
        </div>
      )}

      {/* Error */}
      {genError && (
        <div style={{ background: 'rgba(255,107,107,.08)', border: '1.5px solid rgba(255,107,107,.3)', borderRadius: 16, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '.86rem', color: '#C0392B', fontWeight: 600 }}>{genError}</p>
        </div>
      )}

      {/* Signature result */}
      {signature && <SignatureCard sig={signature} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
