import { createClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// TYPES
// ============================================================================

export interface CorporateClient {
  id: string
  therapist_id: string
  company_name: string
  industry: string
  company_size: string
  contact_name: string
  contact_role: string
  contact_email: string
  contact_phone: string
  contract_type: string
  contract_value: number
  sessions_included: number
  sessions_used: number
  billing_frequency: string
  hourly_rate: number
  package_rate: number
  status: 'prospect' | 'proposal_sent' | 'negotiating' | 'active' | 'paused' | 'completed' | 'lost'
  notes: string
  tags: string[]
  created_at?: string
  updated_at?: string
}

export interface CorporateSession {
  id: string
  therapist_id: string
  client_id: string
  title: string
  session_type:
    | 'workshop'
    | 'group_therapy'
    | 'seminar'
    | 'webinar'
    | 'individual_eap'
    | 'team_coaching'
    | 'crisis_intervention'
    | 'training'
    | 'meditation'
    | 'assessment'
  description: string
  objectives: string[]
  scheduled_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  location: string
  is_remote: boolean
  meeting_link: string
  max_participants: number
  registered_count: number
  attended_count: number
  participants: Record<string, any>
  materials: string[]
  exercises: Record<string, any>[]
  avg_satisfaction: number
  feedback_responses: Array<{ participantName?: string; rating: number; comment?: string }>
  session_rate: number
  is_billed: boolean
  status: string
  created_at?: string
  updated_at?: string
}

export interface CorporateReport {
  id: string
  therapist_id: string
  client_id: string
  title: string
  report_type: string
  period_start: string
  period_end: string
  total_sessions: number
  total_participants: number
  unique_participants: number
  avg_satisfaction: number
  participation_rate: number
  wellbeing_score_before: number
  wellbeing_score_after: number
  stress_reduction_pct: number
  engagement_improvement_pct: number
  estimated_absenteeism_reduction: number
  estimated_turnover_savings: number
  estimated_productivity_gain: number
  roi_multiplier: number
  executive_summary: string
  detailed_analysis: string
  recommendations: string[]
  next_steps: string[]
  charts_data: Record<string, any>
  status: string
  created_at?: string
  updated_at?: string
}

export interface WellnessTemplate {
  id: string
  name: string
  category: string
  description: string
  target_audience: string
  recommended_duration: number
  recommended_group_size: string
  format: string
  outline: string[]
  materials_list: string[]
  exercises: Record<string, any>[]
  talking_points: string[]
  suggested_price_range: { min: number; max: number }
  created_at?: string
}

export interface WellnessAssessment {
  id: string
  therapist_id: string
  client_id: string
  session_id?: string
  assessment_type: string
  respondent_hash: string
  responses: Record<string, number>
  overall_score: number
  stress_level: number
  work_satisfaction: number
  team_cohesion: number
  energy_level: number
  sleep_quality: number
  motivation: number
  created_at?: string
  updated_at?: string
}

export interface CorporateDashboardStats {
  totalClients: number
  activeContracts: number
  totalRevenue: number
  totalSessions: number
  avgSatisfaction: number
  upcomingSessionsCount: number
  pendingProposals: number
}

// ============================================================================
// CONSTANTS: WORKSHOP TEMPLATES
// ============================================================================

export const WORKSHOP_TEMPLATES: WellnessTemplate[] = [
  {
    id: 'template_stress',
    name: 'Gestion du stress au travail',
    category: 'stress',
    description: 'Atelier pratique pour identifier et gérer les sources de stress professionnel',
    target_audience: 'Tous les collaborateurs',
    recommended_duration: 120,
    recommended_group_size: '12-15',
    format: 'Workshop interactif',
    outline: [
      'Identifier les sources de stress',
      'Comprendre la réaction du corps au stress',
      'Techniques de respiration et relaxation',
      'Mindfulness en entreprise',
      'Plan d\'action personnel',
    ],
    materials_list: [
      'Slides présentations',
      'Guide de respiration',
      'Tapis de yoga',
      'Musique relaxante',
    ],
    exercises: [
      { name: 'Respiration 4-7-8', duration_min: 10 },
      { name: 'Body scan', duration_min: 15 },
      { name: 'Réflexion sur sources de stress', duration_min: 20 },
    ],
    talking_points: [
      'Le stress est une réaction naturelle',
      'Les techniques se pratiquent régulièrement',
      'L\'entreprise est responsable du bien-être',
    ],
    suggested_price_range: { min: 800, max: 1500 },
  },
  {
    id: 'template_burnout',
    name: 'Prévention du burn-out',
    category: 'burnout',
    description: 'Atelier complet pour reconnaître et prévenir l\'épuisement professionnel',
    target_audience: 'Managers et collaborateurs',
    recommended_duration: 180,
    recommended_group_size: '10-12',
    format: 'Atelier intensif',
    outline: [
      'Signes et symptômes du burn-out',
      'Facteurs de risque et prévention',
      'Limites et gestion du temps',
      'Communication et demande d\'aide',
      'Ressources et soutien disponibles',
    ],
    materials_list: [
      'Quiz autoévaluation',
      'Ressources RH',
      'Numéros d\'aide',
    ],
    exercises: [
      { name: 'Autoévaluation risque burn-out', duration_min: 15 },
      { name: 'Jeu de rôle demande d\'aide', duration_min: 20 },
    ],
    talking_points: [
      'Le burn-out est un risque professionnel',
      'La prévention est collective',
      'Les managers jouent un rôle crucial',
    ],
    suggested_price_range: { min: 1200, max: 2000 },
  },
  {
    id: 'template_communication',
    name: 'Communication bienveillante en équipe',
    category: 'communication',
    description: 'Développer une communication respectueuse et constructive en équipe',
    target_audience: 'Équipes et départements',
    recommended_duration: 120,
    recommended_group_size: '8-12',
    format: 'Workshop participatif',
    outline: [
      'Écoute active',
      'Communication non-violente',
      'Exprimer ses besoins et limites',
      'Gérer les incompréhensions',
      'Renforcer la confiance d\'équipe',
    ],
    materials_list: [
      'Cas pratiques',
      'Outils de communication',
    ],
    exercises: [
      { name: 'Jeu de rôle communication', duration_min: 30 },
      { name: 'Feedback constructif', duration_min: 25 },
    ],
    talking_points: [
      'La communication est une compétence',
      'L\'écoute est plus importante que parler',
      'Les conflits sont constructifs s\'ils sont bien gérés',
    ],
    suggested_price_range: { min: 900, max: 1600 },
  },
  {
    id: 'template_leadership',
    name: 'Leadership et intelligence émotionnelle',
    category: 'leadership',
    description: 'Développer le leadership par l\'intelligence émotionnelle et l\'empathie',
    target_audience: 'Managers et leaders',
    recommended_duration: 240,
    recommended_group_size: '8-10',
    format: 'Atelier sur 2 jours',
    outline: [
      'Connaissance de soi émotionnelle',
      'Gestion de ses émotions',
      'Empathie et reconnaissance',
      'Motivation d\'équipe',
      'Feedback et développement des talents',
      'Gestion du changement',
    ],
    materials_list: [
      'Test QEI',
      'Cas d\'études',
      'Outils de coaching',
    ],
    exercises: [
      { name: 'Autoévaluation intelligence émotionnelle', duration_min: 20 },
      { name: 'Jeu de rôle leadership', duration_min: 45 },
    ],
    talking_points: [
      'L\'intelligence émotionnelle est clé',
      'Les leaders doivent montrer l\'exemple',
      'L\'empathie crée l\'engagement',
    ],
    suggested_price_range: { min: 1500, max: 2500 },
  },
  {
    id: 'template_resilience',
    name: 'Résilience face au changement',
    category: 'resilience',
    description: 'Construire la capacité individuelle et collective à s\'adapter au changement',
    target_audience: 'Tous les collaborateurs',
    recommended_duration: 120,
    recommended_group_size: '15-20',
    format: 'Workshop dynamique',
    outline: [
      'Comprendre le changement',
      'Réactions émotionnelles au changement',
      'Facteurs de résilience',
      'Stratégies d\'adaptation',
      'Soutien mutuels et collectif',
    ],
    materials_list: [
      'Cas pratiques d\'adaptation',
      'Histoires inspirantes',
    ],
    exercises: [
      { name: 'Réflexion sur changements passés', duration_min: 20 },
      { name: 'Plan d\'action personnel', duration_min: 25 },
    ],
    talking_points: [
      'Le changement est inévitable',
      'La résilience se développe',
      'Le collectif renforce l\'individu',
    ],
    suggested_price_range: { min: 800, max: 1400 },
  },
  {
    id: 'template_conflict',
    name: 'Gestion des conflits',
    category: 'conflict',
    description: 'Outils pratiques pour désamorcer et résoudre les conflits professionnels',
    target_audience: 'Managers et responsables',
    recommended_duration: 180,
    recommended_group_size: '10-12',
    format: 'Atelier avec cas pratiques',
    outline: [
      'Origine et dynamique des conflits',
      'Styles de gestion des conflits',
      'Médiation et négociation',
      'Résolution collaborative',
      'Prévention et culture positive',
    ],
    materials_list: [
      'Cadre de médiation',
      'Scénarios réalistes',
    ],
    exercises: [
      { name: 'Simulation de médiation', duration_min: 40 },
      { name: 'Analyse de conflits réels', duration_min: 30 },
    ],
    talking_points: [
      'Les conflits sont normaux',
      'La gestion est une compétence',
      'Les solutions gagnant-gagnant existent',
    ],
    suggested_price_range: { min: 1000, max: 1800 },
  },
  {
    id: 'template_worklife',
    name: 'Équilibre vie pro / vie perso',
    category: 'work_life_balance',
    description: 'Stratégies pour maintenir un équilibre sain entre travail et vie personnelle',
    target_audience: 'Tous les collaborateurs',
    recommended_duration: 90,
    recommended_group_size: '15-20',
    format: 'Workshop pratique',
    outline: [
      'Comprendre l\'équilibre vie-travail',
      'Impacts de l\'imbalance',
      'Stratégies de gestion du temps',
      'Déconnexion et récupération',
      'Plans personnalisés',
    ],
    materials_list: [
      'Grille d\'évaluation personnelle',
      'Outils de planification',
    ],
    exercises: [
      { name: 'Audit temps personnel', duration_min: 20 },
      { name: 'Création plan équilibre', duration_min: 25 },
    ],
    talking_points: [
      'L\'équilibre est personnel',
      'La déconnexion est essentielle',
      'L\'entreprise peut favoriser l\'équilibre',
    ],
    suggested_price_range: { min: 700, max: 1200 },
  },
  {
    id: 'template_cohesion',
    name: 'Cohésion d\'équipe',
    category: 'team_cohesion',
    description: 'Renforcer la solidarité et la collaboration au sein de l\'équipe',
    target_audience: 'Équipes et directions',
    recommended_duration: 240,
    recommended_group_size: '8-15',
    format: 'Séminaire demi-journée ou journée',
    outline: [
      'Diagnostic de la dynamique d\'équipe',
      'Clarifier les rôles et responsabilités',
      'Jeux collaboratifs',
      'Résolution de tensions existantes',
      'Engagement et contrat d\'équipe',
    ],
    materials_list: [
      'Jeux et activités',
      'Charte d\'équipe',
    ],
    exercises: [
      { name: 'Jeux collaboratifs', duration_min: 60 },
      { name: 'Définir vision commune', duration_min: 40 },
    ],
    talking_points: [
      'La cohésion se construit',
      'La diversité enrichit l\'équipe',
      'Le collectif surpasse l\'individuel',
    ],
    suggested_price_range: { min: 1200, max: 2000 },
  },
  {
    id: 'template_firstaid',
    name: 'Premiers secours psychologiques',
    category: 'wellbeing',
    description: 'Former les managers et RH à identifier et soutenir les personnes en détresse',
    target_audience: 'RH, managers, représentants du personnel',
    recommended_duration: 240,
    recommended_group_size: '10-15',
    format: 'Formation avec certification',
    outline: [
      'Reconnaître la détresse psychologique',
      'Écoute empathique',
      'Premiers secours psychologiques',
      'Ressources disponibles',
      'Limites et responsabilités',
      'Plan d\'action pour l\'entreprise',
    ],
    materials_list: [
      'Guide premiers secours',
      'Ressources d\'aide',
      'Certificat',
    ],
    exercises: [
      { name: 'Jeu de rôle support psychologique', duration_min: 45 },
      { name: 'Plan d\'action entreprise', duration_min: 30 },
    ],
    talking_points: [
      'Les troubles psychologiques sont fréquents',
      'La détection précoce aide',
      'L\'entreprise peut sauver des vies',
    ],
    suggested_price_range: { min: 1500, max: 2500 },
  },
  {
    id: 'template_mindfulness',
    name: 'Méditation et pleine conscience au bureau',
    category: 'wellbeing',
    description: 'Pratiquer la pleine conscience pour améliorer focus, calme et bien-être',
    target_audience: 'Tous les collaborateurs',
    recommended_duration: 60,
    recommended_group_size: '20-30',
    format: 'Session guidée',
    outline: [
      'Fondements de la pleine conscience',
      'Bénéfices au travail',
      'Pratique guidée 1: respiration',
      'Pratique guidée 2: body scan',
      'Pratique guidée 3: méditation bienveillance',
      'Intégration au quotidien',
    ],
    materials_list: [
      'Coussin de méditation',
      'Enregistrements audio',
      'Guide pratique',
    ],
    exercises: [
      { name: 'Respiration consciente', duration_min: 10 },
      { name: 'Body scan', duration_min: 15 },
      { name: 'Méditation guidée', duration_min: 20 },
    ],
    talking_points: [
      'La mindfulness est scientifiquement prouvée',
      'Les résultats sont rapides',
      'La pratique se renforce avec l\'habitude',
    ],
    suggested_price_range: { min: 500, max: 1000 },
  },
]

// ============================================================================
// CONSTANTS: WELLNESS SURVEY QUESTIONS
// ============================================================================

export const WELLNESS_SURVEY_QUESTIONS = [
  {
    id: 'stress',
    question: 'Quel est votre niveau de stress actuel au travail?',
    scale: { min: 1, max: 10, minLabel: 'Pas stressé', maxLabel: 'Extrêmement stressé' },
  },
  {
    id: 'satisfaction',
    question: 'Êtes-vous satisfait de votre travail?',
    scale: { min: 1, max: 10, minLabel: 'Pas satisfait', maxLabel: 'Très satisfait' },
  },
  {
    id: 'team_cohesion',
    question: 'La cohésion d\'équipe est-elle bonne?',
    scale: { min: 1, max: 10, minLabel: 'Très mauvaise', maxLabel: 'Excellente' },
  },
  {
    id: 'energy',
    question: 'Quel est votre niveau d\'énergie général?',
    scale: { min: 1, max: 10, minLabel: 'Très faible', maxLabel: 'Très élevé' },
  },
  {
    id: 'sleep',
    question: 'Quelle est la qualité de votre sommeil?',
    scale: { min: 1, max: 10, minLabel: 'Très mauvaise', maxLabel: 'Excellente' },
  },
  {
    id: 'motivation',
    question: 'Avez-vous envie de venir travailler?',
    scale: { min: 1, max: 10, minLabel: 'Pas du tout', maxLabel: 'Beaucoup' },
  },
  {
    id: 'communication',
    question: 'La communication au sein de l\'équipe est-elle bonne?',
    scale: { min: 1, max: 10, minLabel: 'Mauvaise', maxLabel: 'Excellente' },
  },
  {
    id: 'autonomy',
    question: 'Avez-vous l\'autonomie nécessaire pour bien travailler?',
    scale: { min: 1, max: 10, minLabel: 'Pas du tout', maxLabel: 'Complètement' },
  },
  {
    id: 'recognition',
    question: 'Vous sentez-vous reconnu pour votre travail?',
    scale: { min: 1, max: 10, minLabel: 'Pas du tout', maxLabel: 'Beaucoup' },
  },
  {
    id: 'balance',
    question: 'Avez-vous un bon équilibre vie professionnelle / vie personnelle?',
    scale: { min: 1, max: 10, minLabel: 'Mauvais', maxLabel: 'Excellent' },
  },
  {
    id: 'confidence',
    question: 'Êtes-vous confiant dans vos capacités?',
    scale: { min: 1, max: 10, minLabel: 'Pas du tout', maxLabel: 'Très confiant' },
  },
  {
    id: 'belonging',
    question: 'Vous sentez-vous appartenir à votre équipe?',
    scale: { min: 1, max: 10, minLabel: 'Pas du tout', maxLabel: 'Complètement' },
  },
]

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Create a new corporate client/prospect
 */
export async function createClient(
  therapistId: string,
  data: Partial<CorporateClient>
): Promise<CorporateClient> {
  const supabase = createClient()

  const { data: client, error } = await supabase
    .from('corporate_clients')
    .insert([
      {
        therapist_id: therapistId,
        company_name: data.company_name || '',
        industry: data.industry || '',
        company_size: data.company_size || '',
        contact_name: data.contact_name || '',
        contact_role: data.contact_role || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        contract_type: data.contract_type || '',
        contract_value: data.contract_value || 0,
        sessions_included: data.sessions_included || 0,
        sessions_used: 0,
        billing_frequency: data.billing_frequency || 'monthly',
        hourly_rate: data.hourly_rate || 100,
        package_rate: data.package_rate || 0,
        status: data.status || 'prospect',
        notes: data.notes || '',
        tags: data.tags || [],
      },
    ])
    .select()
    .single()

  if (error) throw error
  return client
}

/**
 * Update client pipeline status
 */
export async function updateClientStatus(
  clientId: string,
  status: string,
  notes?: string
): Promise<CorporateClient> {
  const supabase = createClient()

  const updateData: any = { status }
  if (notes) updateData.notes = notes

  const { data: client, error } = await supabase
    .from('corporate_clients')
    .update(updateData)
    .eq('id', clientId)
    .select()
    .single()

  if (error) throw error
  return client
}

/**
 * Fetch clients with filters
 */
export async function getClients(
  therapistId: string,
  options?: { status?: string; search?: string }
): Promise<CorporateClient[]> {
  const supabase = createClient()

  let query = supabase
    .from('corporate_clients')
    .select('*')
    .eq('therapist_id', therapistId)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.search) {
    query = query.or(
      `company_name.ilike.%${options.search}%,contact_name.ilike.%${options.search}%,contact_email.ilike.%${options.search}%`
    )
  }

  const { data: clients, error } = await query

  if (error) throw error
  return clients || []
}

/**
 * Schedule a new corporate session/workshop
 */
export async function createSession(
  therapistId: string,
  clientId: string,
  data: Partial<CorporateSession>
): Promise<CorporateSession> {
  const supabase = createClient()

  const { data: session, error } = await supabase
    .from('corporate_sessions')
    .insert([
      {
        therapist_id: therapistId,
        client_id: clientId,
        title: data.title || '',
        session_type: data.session_type || 'workshop',
        description: data.description || '',
        objectives: data.objectives || [],
        scheduled_date: data.scheduled_date || new Date().toISOString().split('T')[0],
        start_time: data.start_time || '09:00',
        end_time: data.end_time || '11:00',
        duration_minutes: data.duration_minutes || 120,
        location: data.location || '',
        is_remote: data.is_remote || false,
        meeting_link: data.meeting_link || '',
        max_participants: data.max_participants || 15,
        registered_count: 0,
        attended_count: 0,
        participants: data.participants || {},
        materials: data.materials || [],
        exercises: data.exercises || [],
        avg_satisfaction: 0,
        feedback_responses: [],
        session_rate: data.session_rate || 100,
        is_billed: data.is_billed || false,
        status: 'scheduled',
      },
    ])
    .select()
    .single()

  if (error) throw error
  return session
}

/**
 * Record participant feedback after a session (public endpoint)
 */
export async function recordSessionFeedback(
  sessionId: string,
  feedback: { participantName?: string; rating: number; comment?: string }
): Promise<void> {
  const supabase = createClient()

  // Get current session
  const { data: session, error: getError } = await supabase
    .from('corporate_sessions')
    .select('feedback_responses, avg_satisfaction')
    .eq('id', sessionId)
    .single()

  if (getError) throw getError

  // Add new feedback
  const currentFeedback = session.feedback_responses || []
  const currentAvg = session.avg_satisfaction || 0
  const newFeedback = [
    ...currentFeedback,
    {
      participantName: feedback.participantName || 'Anonyme',
      rating: feedback.rating,
      comment: feedback.comment || '',
    },
  ]

  // Calculate new average
  const allRatings = newFeedback.map((f: any) => f.rating)
  const newAverage = allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length

  // Update session
  const { error: updateError } = await supabase
    .from('corporate_sessions')
    .update({
      feedback_responses: newFeedback,
      avg_satisfaction: Math.round(newAverage * 100) / 100,
    })
    .eq('id', sessionId)

  if (updateError) throw updateError
}

/**
 * Get upcoming sessions
 */
export async function getUpcomingSessions(
  therapistId: string,
  days: number = 30
): Promise<CorporateSession[]> {
  const supabase = createClient()

  const today = new Date()
  const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

  const { data: sessions, error } = await supabase
    .from('corporate_sessions')
    .select('*')
    .eq('therapist_id', therapistId)
    .gte('scheduled_date', today.toISOString().split('T')[0])
    .lte('scheduled_date', future.toISOString().split('T')[0])
    .order('scheduled_date', { ascending: true })

  if (error) throw error
  return sessions || []
}

/**
 * Generate AI-powered outcomes report for HR
 */
export async function generateReport(
  therapistId: string,
  clientId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CorporateReport> {
  const supabase = createClient()
  const anthropic = new Anthropic()

  // Fetch sessions data
  const { data: sessions, error: sessionsError } = await supabase
    .from('corporate_sessions')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('client_id', clientId)
    .gte('scheduled_date', periodStart.toISOString().split('T')[0])
    .lte('scheduled_date', periodEnd.toISOString().split('T')[0])

  if (sessionsError) throw sessionsError

  // Fetch assessments
  const { data: assessments, error: assessmentsError } = await supabase
    .from('wellness_assessments')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('client_id', clientId)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString())

  if (assessmentsError) throw assessmentsError

  // Fetch client info
  const { data: client, error: clientError } = await supabase
    .from('corporate_clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (clientError) throw clientError

  // Calculate metrics
  const totalSessions = sessions?.length || 0
  const totalParticipants = sessions?.reduce((sum, s) => sum + (s.attended_count || 0), 0) || 0
  const uniqueParticipants = new Set(
    sessions?.flatMap((s) => Object.keys(s.participants || {})) || []
  ).size
  const avgSatisfaction =
    sessions && sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.avg_satisfaction || 0), 0) / sessions.length
      : 0

  // Assessment scores
  const beforeScores = assessments?.filter((a) => !a.session_id) || []
  const afterScores = assessments?.filter((a) => a.session_id) || []
  const beforeAvg =
    beforeScores.length > 0
      ? beforeScores.reduce((sum, a) => sum + (a.overall_score || 0), 0) / beforeScores.length
      : 0
  const afterAvg =
    afterScores.length > 0
      ? afterScores.reduce((sum, a) => sum + (a.overall_score || 0), 0) / afterScores.length
      : 0

  const wellbeingImprovement = Math.max(0, afterAvg - beforeAvg)
  const stressReduction = Math.max(0, 100 - (wellbeingImprovement * 100) / 10)

  // Use Claude to generate narrative
  const prompt = `Tu es un consultant en bien-être entreprise spécialisé en rapports RH.
Génère un rapport professionnel et data-driven en français basé sur ces données:

Entreprise: ${client.company_name}
Secteur: ${client.industry}
Taille: ${client.company_size}

Périodе: ${periodStart.toLocaleDateString('fr-FR')} à ${periodEnd.toLocaleDateString('fr-FR')}

Données:
- Total sessions: ${totalSessions}
- Participants total: ${totalParticipants}
- Participants uniques: ${uniqueParticipants}
- Satisfaction moyenne: ${avgSatisfaction.toFixed(1)}/10
- Score bien-être avant: ${beforeAvg.toFixed(1)}/10
- Score bien-être après: ${afterAvg.toFixed(1)}/10
- Amélioration: ${wellbeingImprovement.toFixed(1)} points

Fournissez JSON valide avec:
{
  "executive_summary": "1-2 paragraphes résumant impact",
  "detailed_analysis": "Analyse détaillée des résultats",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "next_steps": ["Étape 1", "Étape 2"],
  "roi_analysis": "Analyse ROI brève"
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  let reportData = {
    executive_summary: '',
    detailed_analysis: '',
    recommendations: [],
    next_steps: [],
  }

  try {
    const content = message.content[0]
    if (content.type === 'text') {
      reportData = JSON.parse(content.text)
    }
  } catch {
    reportData = {
      executive_summary: 'Rapport généré avec succès.',
      detailed_analysis: `${totalSessions} sessions ont été conduites avec ${totalParticipants} participants au total. La satisfaction moyenne était de ${avgSatisfaction.toFixed(1)}/10.`,
      recommendations: [
        'Poursuivre les interventions régulières',
        'Adapter les thèmes selon les retours',
      ],
      next_steps: ['Planifier sessions T2', 'Évaluer impact long-terme'],
    }
  }

  // Create report
  const { data: report, error: reportError } = await supabase
    .from('corporate_reports')
    .insert([
      {
        therapist_id: therapistId,
        client_id: clientId,
        title: `Rapport bien-être - ${client.company_name} - ${periodStart.toLocaleDateString('fr-FR')}`,
        report_type: 'wellness_outcomes',
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        total_sessions: totalSessions,
        total_participants: totalParticipants,
        unique_participants: uniqueParticipants,
        avg_satisfaction: Math.round(avgSatisfaction * 100) / 100,
        participation_rate: totalParticipants > 0 ? Math.round((uniqueParticipants / totalParticipants) * 100) : 0,
        wellbeing_score_before: Math.round(beforeAvg * 100) / 100,
        wellbeing_score_after: Math.round(afterAvg * 100) / 100,
        stress_reduction_pct: Math.round(stressReduction),
        engagement_improvement_pct: Math.round(wellbeingImprovement * 10),
        estimated_absenteeism_reduction: Math.round(wellbeingImprovement * 2),
        estimated_turnover_savings: Math.round(wellbeingImprovement * 5000),
        estimated_productivity_gain: Math.round(wellbeingImprovement * 10000),
        roi_multiplier: totalParticipants > 0 ? (wellbeingImprovement * 5000) / (totalSessions * 1000) : 0,
        executive_summary: reportData.executive_summary || '',
        detailed_analysis: reportData.detailed_analysis || '',
        recommendations: reportData.recommendations || [],
        next_steps: reportData.next_steps || [],
        charts_data: {
          satisfaction: avgSatisfaction,
          improvement: wellbeingImprovement,
          participation: uniqueParticipants,
        },
        status: 'completed',
      },
    ])
    .select()
    .single()

  if (reportError) throw reportError
  return report
}

/**
 * Get available workshop templates
 */
export async function getWellnessTemplates(category?: string): Promise<WellnessTemplate[]> {
  if (category) {
    return WORKSHOP_TEMPLATES.filter((t) => t.category === category)
  }
  return WORKSHOP_TEMPLATES
}

/**
 * Create a wellness assessment survey
 */
export async function createAssessment(
  therapistId: string,
  clientId: string,
  sessionId: string | undefined,
  type: string
): Promise<{ assessmentUrl: string; questions: typeof WELLNESS_SURVEY_QUESTIONS }> {
  const supabase = createClient()

  // Create assessment record with respondent_hash placeholder
  const assessmentId = Math.random().toString(36).substring(2, 11)

  const { error } = await supabase
    .from('wellness_assessments')
    .insert([
      {
        therapist_id: therapistId,
        client_id: clientId,
        session_id: sessionId,
        assessment_type: type,
        respondent_hash: assessmentId,
        responses: {},
        overall_score: 0,
        stress_level: 0,
        work_satisfaction: 0,
        team_cohesion: 0,
        energy_level: 0,
        sleep_quality: 0,
        motivation: 0,
      },
    ])

  if (error) throw error

  // Return public assessment URL
  const assessmentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/assess/${therapistId}/${clientId}/${assessmentId}`

  return {
    assessmentUrl,
    questions: WELLNESS_SURVEY_QUESTIONS,
  }
}

/**
 * Public endpoint - employee submits their assessment
 */
export async function submitAssessment(
  assessmentData: Partial<WellnessAssessment>
): Promise<void> {
  const supabase = createClient()

  // Calculate overall score from responses
  const responses = assessmentData.responses || {}
  const scores = Object.values(responses).filter((v): v is number => typeof v === 'number')
  const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  const { error } = await supabase
    .from('wellness_assessments')
    .update({
      responses: assessmentData.responses,
      overall_score: Math.round(overallScore * 100) / 100,
      stress_level: (responses['stress'] as number) || 0,
      work_satisfaction: (responses['satisfaction'] as number) || 0,
      team_cohesion: (responses['team_cohesion'] as number) || 0,
      energy_level: (responses['energy'] as number) || 0,
      sleep_quality: (responses['sleep'] as number) || 0,
      motivation: (responses['motivation'] as number) || 0,
    })
    .eq('respondent_hash', assessmentData.respondent_hash)

  if (error) throw error
}

/**
 * Get aggregated, anonymized assessment results
 */
export async function getAssessmentResults(
  therapistId: string,
  clientId: string,
  type?: string
): Promise<{
  avgScores: Record<string, number>
  participation: number
  trends: Record<string, number[]>
}> {
  const supabase = createClient()

  let query = supabase
    .from('wellness_assessments')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('client_id', clientId)

  if (type) {
    query = query.eq('assessment_type', type)
  }

  const { data: assessments, error } = await query

  if (error) throw error

  const results = assessments || []

  // Calculate averages
  const avgScores: Record<string, number> = {
    overall: 0,
    stress: 0,
    satisfaction: 0,
    team_cohesion: 0,
    energy: 0,
    sleep: 0,
    motivation: 0,
  }

  if (results.length > 0) {
    avgScores.overall = Math.round((results.reduce((s, a) => s + (a.overall_score || 0), 0) / results.length) * 100) / 100
    avgScores.stress = Math.round((results.reduce((s, a) => s + (a.stress_level || 0), 0) / results.length) * 100) / 100
    avgScores.satisfaction = Math.round((results.reduce((s, a) => s + (a.work_satisfaction || 0), 0) / results.length) * 100) / 100
    avgScores.team_cohesion = Math.round((results.reduce((s, a) => s + (a.team_cohesion || 0), 0) / results.length) * 100) / 100
    avgScores.energy = Math.round((results.reduce((s, a) => s + (a.energy_level || 0), 0) / results.length) * 100) / 100
    avgScores.sleep = Math.round((results.reduce((s, a) => s + (a.sleep_quality || 0), 0) / results.length) * 100) / 100
    avgScores.motivation = Math.round((results.reduce((s, a) => s + (a.motivation || 0), 0) / results.length) * 100) / 100
  }

  return {
    avgScores,
    participation: results.length,
    trends: {
      weekly: [],
      monthly: [],
    },
  }
}

/**
 * Dashboard stats
 */
export async function getCorporateStats(therapistId: string): Promise<CorporateDashboardStats> {
  const supabase = createClient()

  // Clients
  const { data: allClients, error: clientsError } = await supabase
    .from('corporate_clients')
    .select('status, contract_value')
    .eq('therapist_id', therapistId)

  if (clientsError) throw clientsError

  const clients = allClients || []
  const totalClients = clients.length
  const activeContracts = clients.filter((c) => c.status === 'active').length
  const totalRevenue = clients.reduce((sum, c) => sum + (c.contract_value || 0), 0)

  // Sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('corporate_sessions')
    .select('attended_count, avg_satisfaction, scheduled_date')
    .eq('therapist_id', therapistId)

  if (sessionsError) throw sessionsError

  const sessionsData = sessions || []
  const totalSessions = sessionsData.length
  const avgSatisfaction =
    totalSessions > 0
      ? Math.round(
          (sessionsData.reduce((sum, s) => sum + (s.avg_satisfaction || 0), 0) / totalSessions) * 100
        ) / 100
      : 0

  // Upcoming sessions
  const today = new Date()
  const upcomingSessionsCount = sessionsData.filter(
    (s) => new Date(s.scheduled_date) >= today
  ).length

  // Pending proposals
  const pendingProposals = clients.filter(
    (c) => c.status === 'proposal_sent' || c.status === 'negotiating'
  ).length

  return {
    totalClients,
    activeContracts,
    totalRevenue,
    totalSessions,
    avgSatisfaction,
    upcomingSessionsCount,
    pendingProposals,
  }
}

/**
 * AI-powered pricing recommendation
 */
export async function suggestPricing(
  therapistId: string,
  sessionType: string,
  duration: number,
  groupSize: number,
  industry: string
): Promise<{ recommended: number; range: { min: number; max: number }; rationale: string }> {
  const anthropic = new Anthropic()

  const prompt = `Tu es un expert en tarification pour services de bien-être en entreprise en France.
Recommande un tarif pour cette session:

Type: ${sessionType}
Durée: ${duration} minutes
Taille groupe: ${groupSize} participants
Secteur entreprise: ${industry}

Basé sur ces références de marché:
- Workshop: 800-2000€ (dépend durée et taille)
- Programme multi-sessions: 3000-8000€ par trimestre
- Sessions individuelles EAP: 80-120€
- Webinaires: 500-1500€

Réponds en JSON:
{
  "recommended": MONTANT_RECOMMANDÉ,
  "min": MONTANT_MIN,
  "max": MONTANT_MAX,
  "rationale": "Explication courte du calcul"
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  let suggestion = {
    recommended: 1000,
    min: 800,
    max: 1200,
    rationale: 'Tarif standard basé sur durée et taille groupe',
  }

  try {
    const content = message.content[0]
    if (content.type === 'text') {
      suggestion = JSON.parse(content.text)
    }
  } catch {
    // Use defaults
  }

  return {
    recommended: suggestion.recommended,
    range: { min: suggestion.min, max: suggestion.max },
    rationale: suggestion.rationale,
  }
}

/**
 * Customize a template for a specific company
 */
export async function generateSessionPlan(
  templateId: string,
  clientContext: { companyName: string; industry: string; specificNeeds: string }
): Promise<{
  plan: Record<string, any>
  materials: string[]
  exercises: Record<string, any>[]
}> {
  const template = WORKSHOP_TEMPLATES.find((t) => t.id === templateId)

  if (!template) {
    throw new Error(`Template ${templateId} not found`)
  }

  const anthropic = new Anthropic()

  const prompt = `Tu es un thérapeute/consultant en bien-être d'entreprise en France.
Personnalise ce workshop pour cette entreprise:

Template: ${template.name}
Entreprise: ${clientContext.companyName}
Secteur: ${clientContext.industry}
Besoins spécifiques: ${clientContext.specificNeeds}

Outline original:
${template.outline.join('\n')}

Adapte le contenu pour être plus pertinent à leur contexte. Réponds en JSON:
{
  "title": "Titre adapté",
  "objectives": ["Objectif 1", "Objectif 2", "Objectif 3"],
  "adapted_outline": ["Étape 1 adaptée", "Étape 2 adaptée", ...],
  "company_specific_examples": ["Exemple 1 du secteur", "Exemple 2", ...],
  "timing": {"segment": "durée en min", ...}
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  let customizedPlan = {
    title: template.name,
    objectives: template.outline,
    adapted_outline: template.outline,
    company_specific_examples: [],
    timing: {},
  }

  try {
    const content = message.content[0]
    if (content.type === 'text') {
      customizedPlan = JSON.parse(content.text)
    }
  } catch {
    // Use template as-is
  }

  return {
    plan: customizedPlan,
    materials: template.materials_list,
    exercises: template.exercises,
  }
}
