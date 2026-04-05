/**
 * Dynamic qualification questions per specialty
 *
 * These questions are shown in the contact/landing page form to qualify leads
 * BEFORE they become full contacts. The answers are scored to determine lead
 * quality, which is then sent to Meta via CAPI as a signal.
 */

export interface QualificationQuestion {
  id: string
  question: string
  type: 'select' | 'radio' | 'text'
  options?: Array<{ label: string; value: string; score: number }>
  required: boolean
  weight: number // How much this question contributes to total score (0-1)
}

export interface QualificationConfig {
  specialty_key: string
  specialty_name: string
  questions: QualificationQuestion[]
  scoring: {
    hot_threshold: number    // Score >= this = hot lead (default: 70)
    warm_threshold: number   // Score >= this = warm lead (default: 40)
    // Below warm = cold lead
  }
}

// Qualification configs for each specialty

const HYPNOTHERAPEUTE: QualificationConfig = {
  specialty_key: 'hypnotherapeute',
  specialty_name: 'Hypnothérapeute',
  questions: [
    {
      id: 'problem_duration',
      question: 'Depuis combien de temps souhaitez-vous résoudre ce problème ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Moins d\'1 mois', value: '<1m', score: 30 },
        { label: '1 à 6 mois', value: '1-6m', score: 60 },
        { label: '6 mois à 1 an', value: '6m-1y', score: 80 },
        { label: 'Plus d\'1 an', value: '>1y', score: 90 },
      ],
    },
    {
      id: 'previous_approaches',
      question: 'Avez-vous déjà essayé d\'autres approches ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Non', value: 'no', score: 40 },
        { label: 'Oui, sans succès', value: 'unsuccessful', score: 80 },
        { label: 'Oui, avec succès partiel', value: 'partial', score: 60 },
      ],
    },
    {
      id: 'availability',
      question: 'Quelle est votre disponibilité pour un premier rendez-vous ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Cette semaine', value: 'this_week', score: 100 },
        { label: 'Dans 2 semaines', value: '2_weeks', score: 70 },
        { label: 'Plus tard', value: 'later', score: 30 },
      ],
    },
    {
      id: 'source',
      question: 'Comment avez-vous entendu parler de nous ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Publicité Facebook', value: 'facebook_ad', score: 60 },
        { label: 'Bouche à oreille', value: 'word_of_mouth', score: 80 },
        { label: 'Recherche Google', value: 'google_search', score: 70 },
        { label: 'Autres réseaux sociaux', value: 'social_media', score: 50 },
      ],
    },
  ],
  scoring: {
    hot_threshold: 70,
    warm_threshold: 40,
  },
}

const PSYCHOTHÉRAPEUTE: QualificationConfig = {
  specialty_key: 'psychotherapeute',
  specialty_name: 'Psychothérapeute',
  questions: [
    {
      id: 'problem_duration',
      question: 'Depuis combien de temps affrontez-vous cette difficulté ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Récemment (moins d\'1 mois)', value: '<1m', score: 40 },
        { label: 'Quelques mois', value: '1-6m', score: 70 },
        { label: 'Plus de 6 mois', value: '>6m', score: 85 },
      ],
    },
    {
      id: 'readiness',
      question: 'Êtes-vous prêt(e) à vous engager dans un processus thérapeutique ?',
      type: 'select',
      required: true,
      weight: 0.3,
      options: [
        { label: 'Tout à fait', value: 'fully_ready', score: 90 },
        { label: 'Plutôt oui', value: 'somewhat_ready', score: 65 },
        { label: 'Je réfléchis encore', value: 'uncertain', score: 35 },
      ],
    },
    {
      id: 'support_system',
      question: 'Disposez-vous d\'un soutien social ou familial ?',
      type: 'select',
      required: true,
      weight: 0.2,
      options: [
        { label: 'Oui, bon soutien', value: 'good_support', score: 75 },
        { label: 'Soutien limité', value: 'limited_support', score: 50 },
        { label: 'Non, isolé(e)', value: 'no_support', score: 60 },
      ],
    },
    {
      id: 'availability',
      question: 'Quelle est votre disponibilité pour débuter ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Immédiatement', value: 'immediate', score: 95 },
        { label: 'Prochaines 2-3 semaines', value: 'soon', score: 75 },
        { label: 'Pas avant quelques mois', value: 'later', score: 40 },
      ],
    },
  ],
  scoring: {
    hot_threshold: 75,
    warm_threshold: 45,
  },
}

const COACH: QualificationConfig = {
  specialty_key: 'coach',
  specialty_name: 'Coach',
  questions: [
    {
      id: 'goal_clarity',
      question: 'Avez-vous une vision claire de vos objectifs ?',
      type: 'select',
      required: true,
      weight: 0.3,
      options: [
        { label: 'Oui, très claire', value: 'very_clear', score: 85 },
        { label: 'Plutôt claire', value: 'somewhat_clear', score: 65 },
        { label: 'Flou ou pas encore défini', value: 'unclear', score: 35 },
      ],
    },
    {
      id: 'motivation',
      question: 'Quel est votre niveau de motivation pour changer ?',
      type: 'select',
      required: true,
      weight: 0.3,
      options: [
        { label: 'Très motivé(e)', value: 'very_motivated', score: 95 },
        { label: 'Modérément motivé(e)', value: 'moderately_motivated', score: 65 },
        { label: 'Peu motivé(e)', value: 'low_motivation', score: 30 },
      ],
    },
    {
      id: 'engagement',
      question: 'Êtes-vous capable de vous engager régulièrement ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Oui, sans doute', value: 'yes', score: 90 },
        { label: 'Probablement', value: 'probably', score: 60 },
        { label: 'Difficile à dire', value: 'unsure', score: 40 },
      ],
    },
    {
      id: 'timeline',
      question: 'Quand souhaiteriez-vous commencer ?',
      type: 'select',
      required: true,
      weight: 0.15,
      options: [
        { label: 'Cette semaine', value: 'this_week', score: 100 },
        { label: 'Prochaine semaine', value: 'next_week', score: 80 },
        { label: 'Plus tard', value: 'later', score: 40 },
      ],
    },
  ],
  scoring: {
    hot_threshold: 80,
    warm_threshold: 50,
  },
}

const NATUROPATHE: QualificationConfig = {
  specialty_key: 'naturopathe',
  specialty_name: 'Naturopathe',
  questions: [
    {
      id: 'health_concern',
      question: 'Depuis combien de temps avez-vous cette préoccupation de santé ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Récent (moins d\'1 mois)', value: '<1m', score: 50 },
        { label: 'Quelques mois', value: '1-6m', score: 70 },
        { label: 'Plus de 6 mois', value: '>6m', score: 85 },
      ],
    },
    {
      id: 'openness',
      question: 'Êtes-vous ouvert(e) aux approches naturelles ?',
      type: 'select',
      required: true,
      weight: 0.3,
      options: [
        { label: 'Très ouvert(e)', value: 'very_open', score: 90 },
        { label: 'Plutôt ouvert(e)', value: 'somewhat_open', score: 70 },
        { label: 'Plutôt scceptique', value: 'skeptical', score: 40 },
      ],
    },
    {
      id: 'previous_results',
      question: 'Les traitements conventionnels vous ont-ils aidé ?',
      type: 'select',
      required: true,
      weight: 0.2,
      options: [
        { label: 'Non, inefficaces', value: 'no', score: 85 },
        { label: 'Partiellement efficaces', value: 'partial', score: 65 },
        { label: 'Oui, mais je veux améliorer', value: 'yes', score: 55 },
      ],
    },
    {
      id: 'commitment',
      question: 'Êtes-vous prêt(e) à engager des changements de mode de vie ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Oui, absolument', value: 'yes', score: 95 },
        { label: 'Oui, partiellement', value: 'partial', score: 65 },
        { label: 'Difficile', value: 'difficult', score: 35 },
      ],
    },
  ],
  scoring: {
    hot_threshold: 75,
    warm_threshold: 48,
  },
}

const NUTRITIONNISTE: QualificationConfig = {
  specialty_key: 'nutritionniste',
  specialty_name: 'Nutritionniste',
  questions: [
    {
      id: 'goal_type',
      question: 'Quel est votre principal objectif nutritionnel ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Perte de poids', value: 'weight_loss', score: 80 },
        { label: 'Santé générale', value: 'general_health', score: 70 },
        { label: 'Performance athlétique', value: 'athletic', score: 75 },
        { label: 'Trouble digestif', value: 'digestive', score: 85 },
      ],
    },
    {
      id: 'urgency',
      question: 'À quel point c\'est urgent pour vous ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Très urgent', value: 'very_urgent', score: 90 },
        { label: 'Modérément urgent', value: 'somewhat_urgent', score: 65 },
        { label: 'Peut attendre', value: 'can_wait', score: 40 },
      ],
    },
    {
      id: 'diet_history',
      question: 'Avez-vous déjà suivi un régime ou plan nutritionnel ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Oui, avec succès', value: 'successful', score: 70 },
        { label: 'Oui, sans vraiment réussir', value: 'unsuccessful', score: 75 },
        { label: 'Non, première fois', value: 'first_time', score: 65 },
      ],
    },
    {
      id: 'willingness',
      question: 'Êtes-vous prêt(e) à changer vos habitudes ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Oui, complètement', value: 'completely', score: 95 },
        { label: 'Oui, progressivement', value: 'gradually', score: 70 },
        { label: 'Pas vraiment', value: 'not_really', score: 35 },
      ],
    },
  ],
  scoring: {
    hot_threshold: 78,
    warm_threshold: 50,
  },
}

const OSTÉOPATHE: QualificationConfig = {
  specialty_key: 'osteopathe',
  specialty_name: 'Ostéopathe',
  questions: [
    {
      id: 'pain_duration',
      question: 'Depuis combien de temps avez-vous cette douleur ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Récemment (moins d\'1 mois)', value: '<1m', score: 75 },
        { label: 'Quelques mois', value: '1-6m', score: 80 },
        { label: 'Chronique (plus de 6 mois)', value: '>6m', score: 85 },
      ],
    },
    {
      id: 'pain_severity',
      question: 'Quel est le niveau de votre douleur (1-10) ?',
      type: 'select',
      required: true,
      weight: 0.3,
      options: [
        { label: 'Légère (1-3)', value: 'mild', score: 50 },
        { label: 'Modérée (4-6)', value: 'moderate', score: 75 },
        { label: 'Sévère (7-10)', value: 'severe', score: 90 },
      ],
    },
    {
      id: 'treatment_history',
      question: 'Avez-vous reçu d\'autres traitements ?',
      type: 'select',
      required: true,
      weight: 0.2,
      options: [
        { label: 'Non, première tentative', value: 'first', score: 70 },
        { label: 'Oui, sans succès probant', value: 'unsuccessful', score: 80 },
        { label: 'Oui, avec succès partiel', value: 'partial', score: 75 },
      ],
    },
    {
      id: 'availability',
      question: 'Pouvez-vous débuter les séances rapidement ?',
      type: 'select',
      required: true,
      weight: 0.25,
      options: [
        { label: 'Oui, cette semaine', value: 'this_week', score: 95 },
        { label: 'Oui, prochaine semaine', value: 'next_week', score: 75 },
        { label: 'Plus tard', value: 'later', score: 45 },
      ],
    },
  ],
  scoring: {
    hot_threshold: 77,
    warm_threshold: 48,
  },
}

const SPECIALTIES: Record<string, QualificationConfig> = {
  hypnotherapeute: HYPNOTHERAPEUTE,
  psychotherapeute: PSYCHOTHÉRAPEUTE,
  coach: COACH,
  naturopathe: NATUROPATHE,
  nutritionniste: NUTRITIONNISTE,
  osteopathe: OSTÉOPATHE,
}

/**
 * Get qualification config for a specialty
 */
export function getQualificationConfig(specialty?: string): QualificationConfig {
  if (!specialty || !SPECIALTIES[specialty]) {
    // Return a generic config if specialty not found
    return SPECIALTIES.coach
  }
  return SPECIALTIES[specialty]
}

/**
 * Calculate lead score from qualification answers
 *
 * @param answers - Object with question IDs as keys and scores as values
 * @param config - Qualification config for the specialty
 * @returns Calculated score (0-100)
 */
export function calculateLeadScore(
  answers: Record<string, number>,
  config: QualificationConfig
): number {
  let totalScore = 0
  let totalWeight = 0

  for (const question of config.questions) {
    const answer = answers[question.id]
    if (answer !== undefined) {
      totalScore += answer * question.weight
      totalWeight += question.weight
    }
  }

  // Normalize to 0-100 range
  if (totalWeight === 0) return 0
  return Math.round(totalScore / totalWeight)
}

/**
 * Determine lead temperature based on score
 */
export function getLeadTemperature(
  score: number,
  config: QualificationConfig
): 'hot' | 'warm' | 'cold' {
  if (score >= config.scoring.hot_threshold) return 'hot'
  if (score >= config.scoring.warm_threshold) return 'warm'
  return 'cold'
}

/**
 * Get French label for lead temperature
 */
export function getTemperatureLabel(temperature: 'hot' | 'warm' | 'cold'): string {
  const labels = {
    hot: 'Lead Qualifié Chaud',
    warm: 'Lead Qualifié Tiède',
    cold: 'Lead Froid',
  }
  return labels[temperature]
}

/**
 * All available specialties
 */
export const AVAILABLE_SPECIALTIES = Object.values(SPECIALTIES).map(config => ({
  key: config.specialty_key,
  name: config.specialty_name,
}))
