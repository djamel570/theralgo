/**
 * Adaptive Funnel Engine
 *
 * Maps intention segments to personalized content variants for landing pages.
 * Each variant contains segment-specific content (headlines, problems, techniques, etc.)
 * that makes the landing page dynamically adapt based on the visitor's intention.
 *
 * This engine handles generation, caching, and retrieval of funnel variants.
 */

import { createServiceSupabaseClient } from './supabase-server'

export interface QualificationQuestion {
  question: string
  options: string[]
}

export interface FunnelVariant {
  id?: string
  profileId?: string
  segmentKey: string // e.g., "stress_travail", "insomnie", "douleur_dos"
  segmentLabel: string // Human readable

  // Personalized content
  hero: {
    headline: string // Segment-specific headline
    subheadline: string
    ctaText: string
  }

  problemSection: {
    title: string
    problems: string[] // 3-4 problems specific to this segment
    empathyStatement: string // "Vous vous reconnaissez ?" style
  }

  approachSection: {
    title: string
    description: string // How this therapist's approach helps THIS specific problem
    techniques: string[] // Relevant techniques for this segment
  }

  testimonialSection: {
    headline: string // "Ils ont retrouvé..." specific to segment
    placeholder: string // If no real testimonials yet
  }

  formSection: {
    title: string // Segment-specific CTA
    subtitle: string
    qualificationQuestions: QualificationQuestion[] // 2-3 quick questions before the main form
  }

  seoMeta: {
    title: string
    description: string
    keywords: string[]
  }

  createdAt?: string
  updatedAt?: string
}

export class AdaptiveFunnelEngine {
  /**
   * Generate a single variant using Claude API
   * (Placeholder - actual implementation would call Claude)
   */
  async generateVariant(params: {
    specialty: string
    segmentKey: string
    segmentLabel: string
    therapistProfile: {
      name: string
      city: string
      approach: string
      mainProblem: string
      techniques: string
      transformation: string
    }
  }): Promise<FunnelVariant> {
    // In production, this would call Claude API to generate personalized content
    // For now, return a template structure
    const { specialty, segmentKey, segmentLabel, therapistProfile } = params

    return {
      segmentKey,
      segmentLabel,
      hero: {
        headline: `Retrouvez votre bien-être avec ${therapistProfile.name}`,
        subheadline: `Approche spécialisée en ${segmentLabel.toLowerCase()}`,
        ctaText: 'Réserver une consultation',
      },
      problemSection: {
        title: `Vous souffrez de ${segmentLabel.toLowerCase()} ?`,
        problems: [
          `Difficultés liées à ${segmentLabel.toLowerCase()}`,
          'Impact sur votre qualité de vie',
          'Solutions classiques insuffisantes',
          'Envie de changement durable',
        ],
        empathyStatement: 'Vous vous reconnaissez ?',
      },
      approachSection: {
        title: `L'approche de ${therapistProfile.name}`,
        description: therapistProfile.approach,
        techniques: therapistProfile.techniques.split('\n').filter(t => t.trim()),
      },
      testimonialSection: {
        headline: `Ils ont retrouvé ${segmentLabel.toLowerCase()}`,
        placeholder: 'Témoignages en attente',
      },
      formSection: {
        title: `Commencez votre transformation`,
        subtitle: `${therapistProfile.name} adapte son approche à votre situation`,
        qualificationQuestions: [
          {
            question: `Depuis combien de temps souffrez-vous de ${segmentLabel.toLowerCase()} ?`,
            options: ['Moins de 6 mois', '6 mois à 1 an', '1 à 2 ans', 'Plus de 2 ans'],
          },
          {
            question: 'Avez-vous déjà consulté un thérapeute pour ce problème ?',
            options: ['Non, première fois', 'Oui, sans résultats', 'Oui, avec résultats partiels'],
          },
        ],
      },
      seoMeta: {
        title: `${therapistProfile.name} — ${segmentLabel} à ${therapistProfile.city}`,
        description: `${therapistProfile.name}, ${specialty} à ${therapistProfile.city}, vous aide à résoudre ${segmentLabel.toLowerCase()}. Découvrez son approche et réservez une consultation.`,
        keywords: [segmentLabel, specialty, therapistProfile.city, 'consultation', 'bien-être'],
      },
    }
  }

  /**
   * Get a specific variant from database
   */
  async getVariant(profileId: string, segmentKey: string): Promise<FunnelVariant | null> {
    try {
      const supabase = createServiceSupabaseClient()

      const { data, error } = await supabase
        .from('funnel_variants')
        .select('*')
        .eq('profile_id', profileId)
        .eq('segment_key', segmentKey)
        .single()

      if (error) {
        console.warn(`Variant not found for ${profileId}/${segmentKey}:`, error)
        return null
      }

      return data as FunnelVariant
    } catch (err) {
      console.error('Error fetching variant:', err)
      return null
    }
  }

  /**
   * Save a variant to database
   */
  async saveVariant(profileId: string, variant: FunnelVariant): Promise<FunnelVariant | null> {
    try {
      const supabase = createServiceSupabaseClient()

      // Check if variant already exists
      const { data: existing } = await supabase
        .from('funnel_variants')
        .select('id')
        .eq('profile_id', profileId)
        .eq('segment_key', variant.segmentKey)
        .single()

      let result

      if (existing) {
        // Update
        result = await supabase
          .from('funnel_variants')
          .update({
            ...variant,
            profile_id: profileId,
            updated_at: new Date().toISOString(),
          })
          .eq('profile_id', profileId)
          .eq('segment_key', variant.segmentKey)
          .select()
          .single()
      } else {
        // Insert
        result = await supabase
          .from('funnel_variants')
          .insert({
            ...variant,
            profile_id: profileId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
      }

      if (result.error) throw result.error
      return result.data as FunnelVariant
    } catch (err) {
      console.error('Error saving variant:', err)
      return null
    }
  }

  /**
   * Generate all variants for a therapist (one per intention segment)
   */
  async generateAllVariants(params: {
    profileId: string
    specialty: string
    segments: Array<{ key: string; label: string }>
    therapistProfile: Record<string, string>
  }): Promise<FunnelVariant[]> {
    const { profileId, specialty, segments, therapistProfile } = params

    const variants: FunnelVariant[] = []

    for (const segment of segments) {
      try {
        const variant = await this.generateVariant({
          specialty,
          segmentKey: segment.key,
          segmentLabel: segment.label,
          therapistProfile: {
            name: therapistProfile.name || '',
            city: therapistProfile.city || '',
            approach: therapistProfile.approach_description || '',
            mainProblem: therapistProfile.main_problem_solved || '',
            techniques: therapistProfile.main_techniques || '',
            transformation: therapistProfile.patient_transformation || '',
          },
        })

        // Save to database
        const saved = await this.saveVariant(profileId, variant)
        if (saved) {
          variants.push(saved)
        }
      } catch (err) {
        console.error(`Error generating variant for ${segment.key}:`, err)
      }
    }

    return variants
  }

  /**
   * Detect segment from URL query parameters
   * Looks for: ?segment=stress_travail or ?utm_content=stress_travail or ?s=stress_travail
   */
  static detectSegment(searchParams: URLSearchParams | Record<string, string | string[] | undefined>): string | null {
    // Handle both URLSearchParams and object formats
    let segment: string | null = null

    if (searchParams instanceof URLSearchParams) {
      segment = searchParams.get('segment') || searchParams.get('utm_content') || searchParams.get('s')
    } else {
      const segmentValue = searchParams.segment || searchParams.utm_content || searchParams.s
      if (typeof segmentValue === 'string') {
        segment = segmentValue
      }
    }

    // Validate: segment should be alphanumeric with underscores
    if (segment && /^[a-z0-9_]+$/.test(segment)) {
      return segment
    }

    return null
  }

  /**
   * Get all variants for a profile
   */
  async getProfileVariants(profileId: string): Promise<FunnelVariant[]> {
    try {
      const supabase = createServiceSupabaseClient()

      const { data, error } = await supabase
        .from('funnel_variants')
        .select('*')
        .eq('profile_id', profileId)
        .order('segment_key')

      if (error) {
        console.warn(`Variants not found for profile ${profileId}:`, error)
        return []
      }

      return data as FunnelVariant[]
    } catch (err) {
      console.error('Error fetching profile variants:', err)
      return []
    }
  }
}

export const adaptiveFunnelEngine = new AdaptiveFunnelEngine()
