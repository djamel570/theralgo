'use client'

import { useState } from 'react'
import { ChevronRight, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

/* ── Design tokens (MindMarket-inspired) ──────────────── */
const G = '#72C15F'
const GN = '#5DB847'
const T = '#1A1A1A'
const M = '#6B7280'
const C = '#F7F4EE'
const W = '#FFFFFF'

interface TherapistProfile {
  id: string
  user_id: string
  name: string
  specialty: string
  city: string
  main_problem_solved?: string
  patient_transformation?: string
  ideal_patient_profile?: string
  approach_description?: string
}

interface Gap {
  item: string
  priority: 'high' | 'medium' | 'low'
  recommendation: string
}

interface Diagnostic {
  signal_score: number
  maturity_level: 'debutant' | 'intermediaire' | 'avance'
  gaps: Gap[]
}

interface Segment {
  name: string
  description: string
  temperature: 'cold' | 'warm' | 'hot'
  media_priority: 'high' | 'medium' | 'low'
  example_situations: string[]
}

interface CreativeItem {
  segment_name: string
  hooks: string[]
  promises: string[]
  angles: {
    educational: string
    transformation: string
    reassurance: string
  }
}

interface AdSet {
  name: string
  segment: string
  daily_budget: number
  hooks_to_test: string[]
  priority: 'high' | 'medium' | 'low'
}

interface CampaignStructure {
  total_campaigns: number
  optimization_event: string
  audience_strategy: string
  ad_sets: AdSet[]
  testing_plan: string
  estimated_learning_period_days: number
}

interface DiagnosticForm {
  has_pixel: boolean
  has_capi: boolean
  has_landing_page: boolean
  landing_page_url: string
  form_type: 'native_meta' | 'website_form' | 'calendly' | 'doctolib' | 'other'
  has_crm: boolean
  crm_name: string
  existing_events: string[]
  current_lead_source: string[]
  monthly_budget: number
  main_objective: 'leads' | 'calls' | 'appointments' | 'workshops' | 'other'
}

interface Props {
  profiles: TherapistProfile[]
  existingPlans: Record<string, unknown>[]
}

function TargetingClientContent({ profiles, existingPlans }: Props) {
  const [step, setStep] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)

  // Data state
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null)
  const [segments, setSegments] = useState<Segment[] | null>(null)
  const [creativePlan, setCreativePlan] = useState<CreativeItem[] | null>(null)
  const [campaignStructure, setCampaignStructure] = useState<CampaignStructure | null>(null)

  // Diagnostic form state
  const [diagnosticForm, setDiagnosticForm] = useState<DiagnosticForm>({
    has_pixel: false,
    has_capi: false,
    has_landing_page: false,
    landing_page_url: '',
    form_type: 'website_form',
    has_crm: false,
    crm_name: '',
    existing_events: [],
    current_lead_source: [],
    monthly_budget: 300,
    main_objective: 'leads',
  })

  const [budgetInput, setBudgetInput] = useState(300)

  const selectedProfile = profiles.find(p => p.user_id === selectedUserId)

  const handleRunDiagnostic = async () => {
    if (!selectedUserId) {
      setError('Veuillez sélectionner un thérapeute')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/targeting/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          diagnosticData: diagnosticForm,
        }),
      })

      if (!res.ok) throw new Error('Erreur lors du diagnostic')
      const data = await res.json()

      if (data.diagnostic) {
        setDiagnostic(data.diagnostic)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSegments = async () => {
    if (!selectedUserId || !selectedProfile) {
      setError('Profil thérapeute manquant')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/targeting/intentions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          profileData: {
            specialty: selectedProfile.specialty,
            city: selectedProfile.city,
            main_problem_solved: selectedProfile.main_problem_solved || '',
            patient_transformation: selectedProfile.patient_transformation || '',
            ideal_patient_profile: selectedProfile.ideal_patient_profile || '',
            approach_description: selectedProfile.approach_description || '',
          },
        }),
      })

      if (!res.ok) throw new Error('Erreur lors de la génération des segments')
      const data = await res.json()

      if (data.segments) {
        setSegments(data.segments)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCreatives = async () => {
    if (!selectedUserId || !selectedProfile || !segments) {
      setError('Données manquantes')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/targeting/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          segments,
          profileData: {
            specialty: selectedProfile.specialty,
            city: selectedProfile.city,
            main_problem_solved: selectedProfile.main_problem_solved || '',
            patient_transformation: selectedProfile.patient_transformation || '',
            ideal_patient_profile: selectedProfile.ideal_patient_profile || '',
            approach_description: selectedProfile.approach_description || '',
          },
        }),
      })

      if (!res.ok) throw new Error('Erreur lors de la génération des angles')
      const data = await res.json()

      if (data.creative_plan) {
        setCreativePlan(data.creative_plan)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleRecommendStructure = async () => {
    if (!selectedUserId || !diagnostic || !segments || !creativePlan) {
      setError('Données manquantes')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/targeting/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          diagnostic,
          segments,
          creative_plan: creativePlan,
          budget: budgetInput,
        }),
      })

      if (!res.ok) throw new Error('Erreur lors de la recommandation')
      const data = await res.json()

      if (data.campaign_structure) {
        setCampaignStructure(data.campaign_structure)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const stepsCompleted = [diagnostic !== null, segments !== null, creativePlan !== null, campaignStructure !== null]

  const StepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      {[1, 2, 3, 4].map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => {
              if (stepsCompleted[s - 2] || s === 1) setStep(s)
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: step === s ? GN : stepsCompleted[s - 1] ? GN : '#E5E7EB',
              color: step === s || stepsCompleted[s - 1] ? 'white' : M,
              fontWeight: 700,
              fontSize: '.85rem',
              border: 'none',
              cursor: stepsCompleted[s - 2] || s === 1 ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.22s ease',
            }}
          >
            {stepsCompleted[s - 1] ? <CheckCircle2 size={20} /> : s}
          </button>
          {i < 3 && (
            <div style={{
              width: 32,
              height: 2,
              background: stepsCompleted[s - 1] ? GN : '#E5E7EB',
              transition: 'all 0.22s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  )

  const CircularProgress = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 45
    const offset = circumference - (score / 100) * circumference
    const color = score >= 60 ? GN : score >= 30 ? '#F59E0B' : '#EF4444'

    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          <svg width={140} height={140} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
            <circle cx={70} cy={70} r={45} fill="none" stroke="#E5E7EB" strokeWidth={8} />
            <circle
              cx={70}
              cy={70}
              r={45}
              fill="none"
              stroke={color}
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: T }}>{score}</div>
            <div style={{ fontSize: '.7rem', color: M }}>/ 100</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <StepIndicator />

      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          background: '#FEE2E2',
          border: `1px solid #FECACA`,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: '2rem',
        }}>
          <AlertCircle size={20} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ fontWeight: 700, color: '#DC2626', fontSize: '.9rem', margin: 0 }}>Erreur</h4>
            <p style={{ fontSize: '.85rem', color: '#991B1B', margin: '.25rem 0 0' }}>{error}</p>
          </div>
        </div>
      )}

      <div style={{ minHeight: '600px', marginBottom: '3rem' }}>
        {/* STEP 1: Diagnostic */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease', opacity: 1 }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: T, margin: 0 }}>Diagnostic de signal</h2>
              <p style={{ color: M, fontSize: '.95rem', margin: '.5rem 0 0' }}>Évaluez la maturité de votre infrastructure publicitaire</p>
            </div>

            <Card style={{ background: W, borderRadius: 20, marginBottom: '1.5rem' }}>
              <CardBody>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: T, fontSize: '.9rem', marginBottom: '.75rem' }}>
                    Sélectionner un thérapeute
                  </label>
                  <Select
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value)
                      setDiagnostic(null)
                      setSegments(null)
                      setCreativePlan(null)
                      setCampaignStructure(null)
                    }}
                    options={[
                      { value: '', label: 'Choisir un thérapeute...' },
                      ...profiles.map(p => ({ value: p.user_id, label: `${p.name} - ${p.specialty}` })),
                    ]}
                  />
                </div>

                {selectedProfile && (
                  <div style={{
                    padding: '1rem',
                    background: C,
                    borderRadius: 12,
                    marginBottom: '1.5rem',
                    fontSize: '.9rem',
                  }}>
                    <div style={{ fontWeight: 600, color: T, marginBottom: '.5rem' }}>{selectedProfile.name}</div>
                    <div style={{ color: M, fontSize: '.85rem' }}>
                      {selectedProfile.specialty} • {selectedProfile.city}
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}>
                  {[
                    { key: 'has_pixel', label: 'Pixel Meta' },
                    { key: 'has_capi', label: 'Conversion API' },
                    { key: 'has_landing_page', label: 'Landing page' },
                    { key: 'has_crm', label: 'CRM' },
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(diagnosticForm as Record<string, unknown>)[item.key] as boolean}
                        onChange={(e) => setDiagnosticForm(prev => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }))}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '.9rem', color: T, fontWeight: 500 }}>{item.label}</span>
                    </label>
                  ))}
                </div>

                {diagnosticForm.has_landing_page && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <Input
                      label="URL de la landing page"
                      placeholder="https://example.com"
                      value={diagnosticForm.landing_page_url}
                      onChange={(e) => setDiagnosticForm(prev => ({ ...prev, landing_page_url: e.target.value }))}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: T, fontSize: '.9rem', marginBottom: '.75rem' }}>
                    Type de formulaire
                  </label>
                  <Select
                    value={diagnosticForm.form_type}
                    onChange={(e) => setDiagnosticForm(prev => ({ ...prev, form_type: e.target.value as any }))}
                    options={[
                      { value: 'native_meta', label: 'Formulaire natif Meta' },
                      { value: 'website_form', label: 'Formulaire site web' },
                      { value: 'calendly', label: 'Calendly' },
                      { value: 'doctolib', label: 'Doctolib' },
                      { value: 'other', label: 'Autre' },
                    ]}
                  />
                </div>

                {diagnosticForm.has_crm && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <Input
                      label="Nom du CRM"
                      placeholder="ex: HubSpot, Pipedrive..."
                      value={diagnosticForm.crm_name}
                      onChange={(e) => setDiagnosticForm(prev => ({ ...prev, crm_name: e.target.value }))}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: T, fontSize: '.9rem', marginBottom: '.75rem' }}>
                    Budget mensuel (€)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={diagnosticForm.monthly_budget}
                    onChange={(e) => setDiagnosticForm(prev => ({ ...prev, monthly_budget: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: T, fontSize: '.9rem', marginBottom: '.75rem' }}>
                    Objectif principal
                  </label>
                  <Select
                    value={diagnosticForm.main_objective}
                    onChange={(e) => setDiagnosticForm(prev => ({ ...prev, main_objective: e.target.value as any }))}
                    options={[
                      { value: 'leads', label: 'Générer des leads' },
                      { value: 'calls', label: 'Augmenter les appels' },
                      { value: 'appointments', label: 'Prendre des rendez-vous' },
                      { value: 'workshops', label: 'Ateliers/Conférences' },
                      { value: 'other', label: 'Autre' },
                    ]}
                  />
                </div>

                <Button
                  variant="green"
                  size="lg"
                  onClick={handleRunDiagnostic}
                  loading={loading}
                  disabled={!selectedUserId || loading}
                  style={{ width: '100%' }}
                >
                  Lancer le diagnostic
                </Button>
              </CardBody>
            </Card>

            {diagnostic && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: T, marginBottom: '1rem' }}>Résultats du diagnostic</h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '1.5rem',
                }}>
                  <Card style={{ background: W, borderRadius: 20 }}>
                    <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <CircularProgress score={diagnostic.signal_score} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: T, fontSize: '.95rem' }}>Score de signal</div>
                        <Badge variant="completed" style={{ marginTop: '.5rem', justifyContent: 'center' }}>
                          {diagnostic.maturity_level === 'debutant' && 'Débutant'}
                          {diagnostic.maturity_level === 'intermediaire' && 'Intermédiaire'}
                          {diagnostic.maturity_level === 'avance' && 'Avancé'}
                        </Badge>
                      </div>
                    </CardBody>
                  </Card>

                  <Card style={{ background: W, borderRadius: 20 }}>
                    <CardBody>
                      <h4 style={{ fontWeight: 700, color: T, fontSize: '.95rem', margin: '0 0 1rem' }}>Lacunes identifiées</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                        {diagnostic.gaps.map((gap, i) => (
                          <div key={i} style={{ fontSize: '.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '.25rem' }}>
                              <span style={{ fontWeight: 600, color: T }}>{gap.item}</span>
                              <Badge variant={
                                gap.priority === 'high' ? 'paused' :
                                  gap.priority === 'medium' ? 'pending' : 'completed'
                              }>
                                {gap.priority === 'high' && 'Haute'}
                                {gap.priority === 'medium' && 'Moyenne'}
                                {gap.priority === 'low' && 'Basse'}
                              </Badge>
                            </div>
                            <p style={{ color: M, fontSize: '.8rem', margin: 0 }}>{gap.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Cartographie d'intention */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: T, margin: 0 }}>Cartographie d'intention</h2>
              <p style={{ color: M, fontSize: '.95rem', margin: '.5rem 0 0' }}>Segmentez votre audience par intention d'achat</p>
            </div>

            {selectedProfile && (
              <Card style={{ background: W, borderRadius: 20, marginBottom: '1.5rem' }}>
                <CardBody>
                  <h3 style={{ fontWeight: 700, color: T, fontSize: '1rem', margin: '0 0 1rem' }}>Profil du thérapeute</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '.9rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: T }}>Nom</div>
                      <div style={{ color: M }}>{selectedProfile.name}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: T }}>Spécialité</div>
                      <div style={{ color: M }}>{selectedProfile.specialty}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: T }}>Ville</div>
                      <div style={{ color: M }}>{selectedProfile.city}</div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            <Button
              variant="green"
              size="lg"
              onClick={handleGenerateSegments}
              loading={loading}
              disabled={!diagnostic || loading}
              style={{ width: '100%', marginBottom: '1.5rem' }}
            >
              Générer les segments
            </Button>

            {segments && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: T, marginBottom: '1rem' }}>Segments identifiés</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem',
                }}>
                  {segments.map((seg, i) => (
                    <Card key={i} style={{ background: W, borderRadius: 20 }}>
                      <CardBody>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <h4 style={{ fontWeight: 700, color: T, fontSize: '.95rem', margin: 0, flex: 1 }}>{seg.name}</h4>
                          <div style={{ display: 'flex', gap: '.5rem' }}>
                            <Badge variant={seg.temperature === 'hot' ? 'paused' : seg.temperature === 'warm' ? 'pending' : 'new'}>
                              {seg.temperature === 'hot' && '🔴 Hot'}
                              {seg.temperature === 'warm' && '🟠 Warm'}
                              {seg.temperature === 'cold' && '❄️ Cold'}
                            </Badge>
                            <Badge variant={
                              seg.media_priority === 'high' ? 'paused' :
                                seg.media_priority === 'medium' ? 'pending' : 'completed'
                            }>
                              {seg.media_priority === 'high' && 'Haute'}
                              {seg.media_priority === 'medium' && 'Moyenne'}
                              {seg.media_priority === 'low' && 'Basse'}
                            </Badge>
                          </div>
                        </div>
                        <p style={{ color: M, fontSize: '.85rem', margin: '0 0 1rem' }}>{seg.description}</p>
                        <div>
                          <div style={{ fontWeight: 600, color: T, fontSize: '.8rem', marginBottom: '.5rem' }}>Situations types</div>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '.85rem' }}>
                            {seg.example_situations.slice(0, 3).map((sit, j) => (
                              <li key={j} style={{ color: M, marginBottom: '.25rem' }}>{sit}</li>
                            ))}
                          </ul>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Angles créatifs */}
        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: T, margin: 0 }}>Angles créatifs</h2>
              <p style={{ color: M, fontSize: '.95rem', margin: '.5rem 0 0' }}>Générez des crochets et angles pour chaque segment</p>
            </div>

            <Button
              variant="green"
              size="lg"
              onClick={handleGenerateCreatives}
              loading={loading}
              disabled={!segments || loading}
              style={{ width: '100%', marginBottom: '1.5rem' }}
            >
              Générer les angles
            </Button>

            {creativePlan && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: T, marginBottom: '1rem' }}>Plan créatif</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {creativePlan.map((item, i) => (
                    <Card key={i} style={{ background: W, borderRadius: 20 }}>
                      <CardHeader>
                        <h4 style={{ fontWeight: 700, color: T, fontSize: '1rem', margin: 0 }}>{item.segment_name}</h4>
                      </CardHeader>
                      <CardBody>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h5 style={{ fontWeight: 600, color: T, fontSize: '.9rem', marginBottom: '.75rem' }}>Crochets (Hooks)</h5>
                          <div style={{ display: 'grid', gap: '.5rem' }}>
                            {item.hooks.map((hook, j) => (
                              <div key={j} style={{
                                padding: '.75rem',
                                background: C,
                                borderRadius: 8,
                                fontSize: '.85rem',
                                color: T,
                                fontStyle: 'italic',
                              }}>
                                "{hook}"
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <h5 style={{ fontWeight: 600, color: T, fontSize: '.9rem', marginBottom: '.75rem' }}>Promesses</h5>
                          <div style={{ display: 'grid', gap: '.5rem' }}>
                            {item.promises.map((promise, j) => (
                              <div key={j} style={{
                                padding: '.75rem',
                                background: C,
                                borderRadius: 8,
                                fontSize: '.85rem',
                                color: T,
                              }}>
                                ✓ {promise}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 style={{ fontWeight: 600, color: T, fontSize: '.9rem', marginBottom: '.75rem' }}>3 Angles</h5>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                            {[
                              { label: 'Pédagogique', value: item.angles.educational, color: '#3B82F6' },
                              { label: 'Transformation', value: item.angles.transformation, color: '#F59E0B' },
                              { label: 'Rassurant', value: item.angles.reassurance, color: '#10B981' },
                            ].map((angle, j) => (
                              <div key={j} style={{
                                padding: '.75rem',
                                background: C,
                                borderRadius: 8,
                                border: `2px solid ${angle.color}`,
                              }}>
                                <div style={{ fontWeight: 600, fontSize: '.75rem', color: angle.color, marginBottom: '.5rem' }}>
                                  {angle.label}
                                </div>
                                <p style={{ fontSize: '.8rem', color: T, margin: 0, lineHeight: 1.4 }}>{angle.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Structure campagne */}
        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: T, margin: 0 }}>Structure de campagne</h2>
              <p style={{ color: M, fontSize: '.95rem', margin: '.5rem 0 0' }}>Recommandations d'optimisation et de budget</p>
            </div>

            <Card style={{ background: W, borderRadius: 20, marginBottom: '1.5rem' }}>
              <CardBody>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: T, fontSize: '.9rem', marginBottom: '.75rem' }}>
                    Budget mensuel recommandé (€)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(parseInt(e.target.value) || 300)}
                  />
                </div>

                <Button
                  variant="green"
                  size="lg"
                  onClick={handleRecommendStructure}
                  loading={loading}
                  disabled={!creativePlan || loading}
                  style={{ width: '100%' }}
                >
                  Recommander la structure
                </Button>
              </CardBody>
            </Card>

            {campaignStructure && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: T, marginBottom: '1rem' }}>Plan de campagne</h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '1.5rem',
                }}>
                  <Card style={{ background: W, borderRadius: 20 }}>
                    <CardBody>
                      <div style={{ fontSize: '.8rem', fontWeight: 600, color: M, marginBottom: '.5rem' }}>NOMBRE DE CAMPAGNES</div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: GN }}>{campaignStructure.total_campaigns}</div>
                    </CardBody>
                  </Card>
                  <Card style={{ background: W, borderRadius: 20 }}>
                    <CardBody>
                      <div style={{ fontSize: '.8rem', fontWeight: 600, color: M, marginBottom: '.5rem' }}>ÉVÉNEMENT D'OPTIMISATION</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: T }}>{campaignStructure.optimization_event}</div>
                    </CardBody>
                  </Card>
                  <Card style={{ background: W, borderRadius: 20 }}>
                    <CardBody>
                      <div style={{ fontSize: '.8rem', fontWeight: 600, color: M, marginBottom: '.5rem' }}>STRATÉGIE D'AUDIENCE</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: T }}>{campaignStructure.audience_strategy}</div>
                    </CardBody>
                  </Card>
                  <Card style={{ background: W, borderRadius: 20 }}>
                    <CardBody>
                      <div style={{ fontSize: '.8rem', fontWeight: 600, color: M, marginBottom: '.5rem' }}>DURÉE D'APPRENTISSAGE</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: T }}>{campaignStructure.estimated_learning_period_days}j</div>
                    </CardBody>
                  </Card>
                </div>

                <Card style={{ background: W, borderRadius: 20, marginBottom: '1.5rem' }}>
                  <CardHeader>
                    <h4 style={{ fontWeight: 700, color: T, fontSize: '.95rem', margin: 0 }}>Ad Sets</h4>
                  </CardHeader>
                  <CardBody>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid #E5E7EB` }}>
                            <th style={{ textAlign: 'left', padding: '.75rem', fontWeight: 600, color: M }}>Ad Set</th>
                            <th style={{ textAlign: 'left', padding: '.75rem', fontWeight: 600, color: M }}>Segment</th>
                            <th style={{ textAlign: 'left', padding: '.75rem', fontWeight: 600, color: M }}>Budget/jour</th>
                            <th style={{ textAlign: 'left', padding: '.75rem', fontWeight: 600, color: M }}>Priorité</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignStructure.ad_sets.map((adSet, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid #F3F4F6` }}>
                              <td style={{ padding: '.75rem', color: T, fontWeight: 500 }}>{adSet.name}</td>
                              <td style={{ padding: '.75rem', color: M }}>{adSet.segment}</td>
                              <td style={{ padding: '.75rem', color: T, fontWeight: 600 }}>{adSet.daily_budget}€</td>
                              <td style={{ padding: '.75rem' }}>
                                <Badge variant={
                                  adSet.priority === 'high' ? 'paused' :
                                    adSet.priority === 'medium' ? 'pending' : 'completed'
                                }>
                                  {adSet.priority === 'high' && 'Haute'}
                                  {adSet.priority === 'medium' && 'Moyenne'}
                                  {adSet.priority === 'low' && 'Basse'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardBody>
                </Card>

                <Card style={{ background: W, borderRadius: 20 }}>
                  <CardHeader>
                    <h4 style={{ fontWeight: 700, color: T, fontSize: '.95rem', margin: 0 }}>Plan de test</h4>
                  </CardHeader>
                  <CardBody>
                    <p style={{ color: T, fontSize: '.9rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {campaignStructure.testing_plan}
                    </p>
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1.5rem',
        background: W,
        borderRadius: 20,
        marginBottom: '2rem',
      }}>
        <Button
          variant="ghost"
          size="md"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ChevronLeft size={18} /> Précédent
        </Button>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          {[1, 2, 3, 4].map(s => (
            <button
              key={s}
              onClick={() => setStep(s)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: step === s ? GN : 'transparent',
                color: step === s ? 'white' : M,
                fontWeight: 700,
                fontSize: '.85rem',
                border: `2px solid ${step === s ? GN : '#E5E7EB'}`,
                cursor: 'pointer',
                transition: 'all 0.22s ease',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <Button
          variant="green"
          size="md"
          onClick={() => setStep(Math.min(4, step + 1))}
          disabled={step === 4 || !stepsCompleted[step - 1]}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          Suivant <ChevronRight size={18} />
        </Button>
      </div>

      {/* History section */}
      {existingPlans.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: T, margin: '0 0 1rem' }}>Historique des plans</h2>
          <Card style={{ background: W, borderRadius: 20 }}>
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {existingPlans.map((plan: any, i) => (
                  <div key={i} style={{
                    padding: '1rem',
                    background: C,
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.22s ease',
                  }} onClick={() => setExpandedHistory(expandedHistory === plan.id ? null : plan.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: T, marginBottom: '.25rem' }}>
                          Plan #{i + 1}
                        </div>
                        <div style={{ fontSize: '.8rem', color: M }}>
                          {new Date(plan.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: M, transform: expandedHistory === plan.id ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.22s ease' }} />
                    </div>
                    {expandedHistory === plan.id && (
                      <div style={{ marginTop: '1rem', fontSize: '.85rem', color: T, paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,.05)' }}>
                        <pre style={{ overflow: 'auto', maxHeight: '200px', background: W, padding: '.75rem', borderRadius: 8, margin: 0, fontSize: '.75rem' }}>
                          {JSON.stringify(plan.plan_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          div[style*="grid"] {
            grid-template-columns: 1fr !important;
          }

          input, select {
            font-size: 16px !important;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default function TargetingClient(props: Props) {
  return (
    <ErrorBoundary>
      <TargetingClientContent {...props} />
    </ErrorBoundary>
  )
}
