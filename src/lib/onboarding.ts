import { SupabaseClient } from '@supabase/supabase-js'

export type OnboardingTrack = 'acquisition' | 'digital_products' | 'both'

export interface OnboardingState {
  currentStep: number
  completedSteps: string[]
  selectedTrack: OnboardingTrack | null
  profileComplete: boolean
  diagnosticComplete: boolean
  firstCampaignReady: boolean
  firstProductCreated: boolean
  onboardingCompleted: boolean
}

// Track A: Acquisition only
export const ACQUISITION_STEPS = [
  { key: 'welcome', label: 'Bienvenue', description: 'Découvrez Theralgo' },
  { key: 'choose_track', label: 'Votre objectif', description: 'Que souhaitez-vous accomplir ?' },
  { key: 'profile', label: 'Votre profil', description: 'Présentez votre activité' },
  { key: 'diagnostic', label: 'Diagnostic', description: 'Analysons votre situation' },
  { key: 'first_campaign', label: 'Première campagne', description: 'Votre plan d\'acquisition' },
  { key: 'availability', label: 'Disponibilités', description: 'Configurez votre agenda' },
  { key: 'launch', label: 'Lancement', description: 'Votre cabinet va se remplir !' },
] as const

// Track B: Digital Products only
export const DIGITAL_PRODUCT_STEPS = [
  { key: 'welcome', label: 'Bienvenue', description: 'Découvrez Theralgo' },
  { key: 'choose_track', label: 'Votre objectif', description: 'Que souhaitez-vous accomplir ?' },
  { key: 'profile', label: 'Votre profil', description: 'Présentez votre expertise' },
  { key: 'product_type', label: 'Type de produit', description: 'Choisissez votre format' },
  { key: 'product_create', label: 'Création', description: 'L\'IA crée votre produit' },
  { key: 'product_pricing', label: 'Tarification', description: 'Fixez votre prix' },
  { key: 'launch', label: 'Publication', description: 'Votre produit est en ligne !' },
] as const

// Track C: Both
export const FULL_STEPS = [
  { key: 'welcome', label: 'Bienvenue', description: 'Découvrez Theralgo' },
  { key: 'choose_track', label: 'Votre objectif', description: 'La plateforme complète' },
  { key: 'profile', label: 'Votre profil', description: 'Présentez votre activité' },
  { key: 'diagnostic', label: 'Diagnostic', description: 'Analysons votre situation' },
  { key: 'first_campaign', label: 'Campagne', description: 'Votre plan d\'acquisition' },
  { key: 'product_create', label: 'Produit digital', description: 'Créez votre premier produit' },
  { key: 'launch', label: 'Lancement', description: 'Tout est prêt !' },
] as const

export function getStepsForTrack(track: OnboardingTrack | null) {
  if (!track) return [ACQUISITION_STEPS[0], ACQUISITION_STEPS[1]]
  switch (track) {
    case 'acquisition':
      return ACQUISITION_STEPS
    case 'digital_products':
      return DIGITAL_PRODUCT_STEPS
    case 'both':
      return FULL_STEPS
  }
}

/**
 * Fetch current onboarding state for a user
 */
export async function getOnboardingState(
  userId: string,
  supabase: SupabaseClient
): Promise<OnboardingState> {
  try {
    // Fetch profile
    const { data: profile } = await supabase
      .from('therapist_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Fetch products
    const { data: products } = await supabase
      .from('digital_products')
      .select('*')
      .eq('user_id', userId)
      .limit(1)

    // Fetch onboarding tracker
    const { data: tracker } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    const selectedTrack = (tracker?.selected_track || null) as OnboardingTrack | null

    const profileComplete =
      !!(
        profile?.name &&
        profile?.specialty &&
        profile?.city &&
        profile?.consultation_price
      )

    const diagnosticComplete = !!(
      tracker?.signal_score !== null &&
      tracker?.signal_score !== undefined
    )

    const firstCampaignReady = !!(campaign && campaign.status !== 'draft')

    const firstProductCreated = !!(products && products.length > 0)

    const onboardingCompleted = !!(tracker?.completed_at)

    return {
      currentStep: tracker?.current_step || 0,
      completedSteps: tracker?.completed_steps || [],
      selectedTrack,
      profileComplete,
      diagnosticComplete,
      firstCampaignReady,
      firstProductCreated,
      onboardingCompleted,
    }
  } catch (error) {
    console.error('Error fetching onboarding state:', { error, userId, timestamp: new Date().toISOString() })
    return {
      currentStep: 0,
      completedSteps: [],
      selectedTrack: null,
      profileComplete: false,
      diagnosticComplete: false,
      firstCampaignReady: false,
      firstProductCreated: false,
      onboardingCompleted: false,
    }
  }
}

/**
 * Save selected track for a user
 */
export async function saveOnboardingTrack(
  userId: string,
  track: OnboardingTrack,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    await supabase
      .from('onboarding_progress')
      .upsert(
        {
          user_id: userId,
          selected_track: track,
          current_step: 2,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
  } catch (error) {
    console.error('Error saving onboarding track:', { error, userId, track, timestamp: new Date().toISOString() })
    throw error
  }
}

/**
 * Mark a step as completed
 */
export async function completeOnboardingStep(
  userId: string,
  step: string,
  track: OnboardingTrack | null,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    const completedSteps = existing?.completed_steps || []
    if (!completedSteps.includes(step)) {
      completedSteps.push(step)
    }

    const currentTrack = track || (existing?.selected_track as OnboardingTrack) || 'acquisition'
    const allSteps = getStepsForTrack(currentTrack)
    const newStep = allSteps.findIndex((s) => s.key === step) + 1

    await supabase
      .from('onboarding_progress')
      .upsert(
        {
          user_id: userId,
          completed_steps: completedSteps,
          current_step: Math.max(newStep, existing?.current_step || 0),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
  } catch (error) {
    console.error('Error completing onboarding step:', { error, userId, step, timestamp: new Date().toISOString() })
    throw error
  }
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { data: tracker } = await supabase
      .from('onboarding_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .single()

    return !!(tracker?.completed_at)
  } catch (error) {
    console.error('Error checking onboarding completion:', { error, userId, timestamp: new Date().toISOString() })
    return false
  }
}

/**
 * Mark onboarding as fully completed
 */
export async function completeOnboarding(
  userId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single()

    const currentTrack = (existing?.selected_track as OnboardingTrack) || 'acquisition'
    const allSteps = getStepsForTrack(currentTrack)

    await supabase
      .from('onboarding_progress')
      .upsert(
        {
          user_id: userId,
          completed_at: new Date().toISOString(),
          current_step: allSteps.length,
          completed_steps: allSteps.map((s) => s.key),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
  } catch (error) {
    console.error('Error completing onboarding:', { error, userId, timestamp: new Date().toISOString() })
    throw error
  }
}
