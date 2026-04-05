// src/lib/product-content-bridge.ts
// Bridge entre Digital Products et Content Engine
// Génère du contenu organique qui promeut naturellement les produits sans être trop vendeur

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase'
import { VoiceProfile, generateVoicePrompt } from '@/lib/voice-dna'
import type { ContentType, GeneratedContent, ContentRequest } from '@/lib/content-engine'
import type { ProductType, DigitalProduct } from '@/lib/product-builder'
import { generateContent } from '@/lib/content-engine'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient()

// ============================================================================
// STRATÉGIES DE CONTENU PAR TYPE DE PRODUIT
// ============================================================================

const PRODUCT_CONTENT_STRATEGIES = {
  audio_program: {
    softMention: 'Partager des extraits de sagesse, des story time de création, des transformations clients',
    educationalBridge: 'Enseigner une technique complète du programme, créer un "veux-tu en savoir plus?" moment',
    directPromo: 'Annoncer le lancement, partager les modules, témoignages directs',
    testimonial: 'Histoires de transformation avant/après des clients',
  },
  mini_course: {
    softMention: 'Posts éducatifs "Saviez-vous que...", aperçus de modules sans promotion directe',
    educationalBridge: 'Carrousels "Qui regarde 1/5 du module", cliffhanger pédagogique',
    directPromo: 'Présentation du syllabus, avantages clairs, inscription directe',
    testimonial: 'Résultats d\'apprentissage, compétences acquises par les étudiants',
  },
  live_workshop: {
    softMention: 'Contenu pédagogique préalable au thème du workshop',
    educationalBridge: 'Teasers des sujets couverts, "ce que tu vas apprendre en live"',
    directPromo: 'Invitation au workshop, compte à rebours, FAQ du live',
    testimonial: 'Feedback des participants, moments clés du dernier événement',
  },
  subscription: {
    softMention: 'Infolettre premium, highlights de la communauté, tips gratuites',
    educationalBridge: 'Partager du contenu premium "réservé aux abonnés", invitation douce',
    directPromo: 'Avantages de l\'abonnement, accessibilité, résiliations précédentes',
    testimonial: 'Membres héros, résultats de l\'abonnement, témoignages authentiques',
  },
}

// ============================================================================
// TYPES
// ============================================================================

export type ProductContentStrategy = 'soft_mention' | 'educational_bridge' | 'direct_promo' | 'launch' | 'testimonial'
export type FunnelStage = 'awareness' | 'consideration' | 'decision' | 'retention'

export interface ProductContentRequest {
  therapistId: string
  productId: string
  contentType: ContentType
  strategy: ProductContentStrategy
  funnelStage: FunnelStage
}

export interface LaunchPhase {
  name: string
  weekOffset: number
  theme: string
  contentPieces: {
    contentType: ContentType
    topic: string
    strategy: ProductContentStrategy
    scheduledDay: string
  }[]
}

export interface LaunchSequence {
  productId: string
  productTitle: string
  phases: LaunchPhase[]
  totalContentPieces: number
  estimatedReach: number
}

export interface ProductContentInsights {
  productId: string
  contentGenerated: number
  topPerformingContent: { id: string; type: string; engagement: number }[]
  conversionsByContent: { contentId: string; sales: number }[]
  recommendedNextContent: string[]
}

// ============================================================================
// 1. GÉNÉRER CONTENU PRODUIT
// ============================================================================

export async function generateProductContent(
  request: ProductContentRequest,
): Promise<GeneratedContent> {
  // Récupérer le produit depuis la base de données
  const { data: product, error: productError } = await supabase
    .from('digital_products')
    .select('*')
    .eq('id', request.productId)
    .eq('therapist_id', request.therapistId)
    .single()

  if (productError || !product) {
    throw new Error(`Produit non trouvé: ${request.productId}`)
  }

  // Récupérer le profil vocal du thérapeute
  const { data: voiceProfile } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('therapist_id', request.therapistId)
    .single()

  // Construire les instructions Claude basées sur la stratégie
  const strategyInstructions = buildStrategyPrompt(
    request.strategy,
    product.type as ProductType,
    product.title,
    product.description,
  )

  const voiceInstructions = voiceProfile
    ? generateVoicePrompt(voiceProfile as VoiceProfile)
    : 'Ton professionnel et empathique, authentique et bienveillant.'

  const funnelInstructions = buildFunnelPrompt(request.funnelStage)

  const systemPrompt = `Tu es un expert en création de contenu pour thérapeutes. Tu génères du contenu AUTHENTIQUE et ÉDUCATIF.

RÈGLE ABSOLUE: Ne JAMAIS être vendeur ou agressif. Les audiences de thérapeutes détestent cela.
- Le contenu doit apporter de la valeur AVANT toute mention de produit
- Les transitions vers les produits doivent être naturelles et nuancées
- L'intention est d'ÉDUQUER et de CRÉER DU DÉSIR ORGANIQUE, pas de forcer la vente

${voiceInstructions}

${funnelInstructions}

${strategyInstructions}

Génère du contenu qui:
1. Est authentique et utile (ne pas sembler fake ou excessif)
2. Crée une curiosité naturelle pour en savoir plus
3. Inclut un appel à l'action doux et pertinent si approprié
4. Respecte les lignes directrices éthiques des thérapeutes français`

  const contentRequest: ContentRequest = {
    therapistId: request.therapistId,
    contentType: request.contentType,
    topic: product.title,
    intention: request.strategy,
    funnelStage: request.funnelStage,
  }

  return generateContent(contentRequest)
}

// ============================================================================
// 2. CRÉER SÉQUENCE DE LANCEMENT
// ============================================================================

export async function createLaunchSequence(
  therapistId: string,
  productId: string,
  launchDate: Date,
): Promise<LaunchSequence> {
  // Récupérer le produit
  const { data: product, error } = await supabase
    .from('digital_products')
    .select('*')
    .eq('id', productId)
    .eq('therapist_id', therapistId)
    .single()

  if (error || !product) {
    throw new Error(`Produit non trouvé: ${productId}`)
  }

  const phases: LaunchPhase[] = []

  // Semaine -2: Construire l'autorité
  phases.push({
    name: 'Établir l\'autorité',
    weekOffset: -2,
    theme: 'Educational leadership sur le sujet du produit',
    contentPieces: [
      {
        contentType: 'blog_article',
        topic: `Expertise: ${product.title}`,
        strategy: 'soft_mention',
        scheduledDay: 'Lundi',
      },
      {
        contentType: 'linkedin_post',
        topic: `Insight professionnel: ${product.title}`,
        strategy: 'soft_mention',
        scheduledDay: 'Mercredi',
      },
      {
        contentType: 'instagram_carousel',
        topic: `Éducation en 10 points: ${product.title}`,
        strategy: 'educational_bridge',
        scheduledDay: 'Vendredi',
      },
    ],
  })

  // Semaine -1: Révéler le problème
  phases.push({
    name: 'Sensibiliser au problème',
    weekOffset: -1,
    theme: 'Créer une prise de conscience du problème que le produit résout',
    contentPieces: [
      {
        contentType: 'instagram_post',
        topic: 'Problème clé que les clients ne reconnaissent pas',
        strategy: 'awareness',
        scheduledDay: 'Lundi',
      },
      {
        contentType: 'reel_script',
        topic: 'Hook: "Si tu ressens cela, tu n\'es pas seul"',
        strategy: 'soft_mention',
        scheduledDay: 'Mercredi',
      },
      {
        contentType: 'email_newsletter',
        topic: 'Infolettre: Reconnaître le problème',
        strategy: 'soft_mention',
        scheduledDay: 'Jeudi',
      },
      {
        contentType: 'instagram_carousel',
        topic: 'Pourquoi ce problème persiste et comment le résoudre',
        strategy: 'educational_bridge',
        scheduledDay: 'Samedi',
      },
    ],
  })

  // Semaine 0: Lancement
  phases.push({
    name: 'Lancement du produit',
    weekOffset: 0,
    theme: 'Annoncer le produit et créer de l\'excitation',
    contentPieces: [
      {
        contentType: 'blog_article',
        topic: `Annonce officielle: ${product.title}`,
        strategy: 'direct_promo',
        scheduledDay: 'Lundi',
      },
      {
        contentType: 'reel_script',
        topic: 'Annonce du lancement avec émotion',
        strategy: 'direct_promo',
        scheduledDay: 'Lundi',
      },
      {
        contentType: 'email_newsletter',
        topic: 'Email de lancement: Ce qui change pour toi',
        strategy: 'direct_promo',
        scheduledDay: 'Lundi',
      },
      {
        contentType: 'instagram_post',
        topic: 'Célébration du lancement',
        strategy: 'direct_promo',
        scheduledDay: 'Mercredi',
      },
      {
        contentType: 'linkedin_post',
        topic: 'Pourquoi j\'ai créé ce produit',
        strategy: 'direct_promo',
        scheduledDay: 'Vendredi',
      },
    ],
  })

  // Semaine +1: Preuve sociale
  phases.push({
    name: 'Preuve sociale et FAQ',
    weekOffset: 1,
    theme: 'Partager les résultats et répondre aux objections',
    contentPieces: [
      {
        contentType: 'instagram_post',
        topic: 'Premiers résultats des clients',
        strategy: 'testimonial',
        scheduledDay: 'Lundi',
      },
      {
        contentType: 'reel_script',
        topic: 'Témoignage: Transformation d\'un client',
        strategy: 'testimonial',
        scheduledDay: 'Mercredi',
      },
      {
        contentType: 'blog_article',
        topic: `FAQ complète: ${product.title}`,
        strategy: 'direct_promo',
        scheduledDay: 'Jeudi',
      },
      {
        contentType: 'email_newsletter',
        topic: 'Répondre aux questions fréquentes',
        strategy: 'direct_promo',
        scheduledDay: 'Samedi',
      },
    ],
  })

  // Semaine +2: Dernière chance
  phases.push({
    name: 'Dernière chance et bonus',
    weekOffset: 2,
    theme: 'Créer une urgence douce et clôturer la promotion',
    contentPieces: [
      {
        contentType: 'instagram_post',
        topic: 'Bonus exclusif pour les inscriptions tardives',
        strategy: 'direct_promo',
        scheduledDay: 'Lundi',
      },
      {
        contentType: 'email_newsletter',
        topic: 'Dernier appel: Les bonus disparaissent demain',
        strategy: 'direct_promo',
        scheduledDay: 'Mardi',
      },
      {
        contentType: 'instagram_carousel',
        topic: 'Résumé: Pourquoi tu ne veux pas manquer cela',
        strategy: 'direct_promo',
        scheduledDay: 'Jeudi',
      },
    ],
  })

  const totalContentPieces = phases.reduce((total, phase) => total + phase.contentPieces.length, 0)
  const estimatedReach = totalContentPieces * 500 // Estimation conservatrice

  return {
    productId,
    productTitle: product.title,
    phases,
    totalContentPieces,
    estimatedReach,
  }
}

// ============================================================================
// 3. GÉNÉRER TEASER ÉDUCATIF
// ============================================================================

export async function generateEducationalTeaser(
  therapistId: string,
  productId: string,
  moduleIndex: number,
): Promise<GeneratedContent> {
  // Récupérer le produit (avec structure de modules si disponible)
  const { data: product, error } = await supabase
    .from('digital_products')
    .select('*')
    .eq('id', productId)
    .eq('therapist_id', therapistId)
    .single()

  if (error || !product) {
    throw new Error(`Produit non trouvé: ${productId}`)
  }

  const systemPrompt = `Tu es un expert en création de contenu éducatif pour thérapeutes.

Ton objectif: Créer un contenu qui enseigne environ 20% du contenu d'un module, créant ainsi un désir naturel d'en savoir plus.

RÈGLE CLÉE: Pas de vente agressive. Le contenu doit être tellement utile que les gens voudront naturellement accéder au reste du module.

Structure type:
1. Hook: Accroche le lecteur avec un problème ou une question pertinente
2. Contenu éducatif: Enseigne un concept ou technique spécifique
3. Limitation naturelle: "Mais ce n'est que le début..."
4. CTA doux: "Si ce sujet te parle, j'ai créé [produit] pour aller plus loin"

Génère du contenu Instagram ou Blog (selon le type) qui apporte une vraie valeur.`

  const contentRequest: ContentRequest = {
    therapistId,
    contentType: 'instagram_carousel',
    topic: `Teaser module ${moduleIndex + 1}: ${product.title}`,
    intention: 'educational_bridge',
    funnelStage: 'awareness',
    customInstructions: `Module Index: ${moduleIndex}. Enseigne 20% du contenu du module, crée un désir d'en savoir plus.`,
  }

  return generateContent(contentRequest)
}

// ============================================================================
// 4. GÉNÉRER CONTENU DE PREUVE SOCIALE
// ============================================================================

export async function generateSocialProofContent(
  therapistId: string,
  productId: string,
): Promise<GeneratedContent> {
  // Récupérer les ventes du produit
  const { data: purchases, error: purchasesError } = await supabase
    .from('purchases')
    .select('count')
    .eq('product_id', productId)

  const salesCount = purchases?.length || 0

  const { data: product } = await supabase
    .from('digital_products')
    .select('*')
    .eq('id', productId)
    .single()

  const systemPrompt = `Tu es un expert en creation de contenu de preuve sociale pour thérapeutes.

Crée du contenu authentique qui:
- Célèbre le nombre de clients ayant rejoint (${salesCount} personnes)
- Partage des résultats réels sans exagérer
- Crée une FOMO positive ("Toi aussi tu pourrais...")
- Reste authentique et humble

Génère un post Instagram ou LinkedIn qui montre l'impact du produit sans être trop vendeur.`

  const contentRequest: ContentRequest = {
    therapistId,
    contentType: 'instagram_post',
    topic: `Preuve sociale: ${salesCount} personnes avec ${product?.title}`,
    intention: 'testimonial',
    funnelStage: 'consideration',
    customInstructions: `${salesCount} clients ont déjà rejoint. Crée un sentiment d'authenticité et de communauté.`,
  }

  return generateContent(contentRequest)
}

// ============================================================================
// 5. OBTENIR INSIGHTS DE CONTENU PRODUIT
// ============================================================================

export async function getProductContentInsights(
  therapistId: string,
  productId: string,
): Promise<ProductContentInsights> {
  // Récupérer le contenu généré pour ce produit
  const { data: contentPieces } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('therapist_id', therapistId)
    .like('metadata', `%"productId":"${productId}"%`)

  // Récupérer les ventes liées au produit
  const { data: purchases } = await supabase
    .from('purchases')
    .select('content_id, id')
    .eq('product_id', productId)

  const contentIds = contentPieces?.map((c) => c.id) || []
  const conversionsByContent = (purchases || []).map((p) => ({
    contentId: p.content_id || 'unknown',
    sales: 1,
  }))

  // Grouper les conversions par contenu
  const conversionsMap: Record<string, number> = {}
  conversionsByContent.forEach((c) => {
    conversionsMap[c.contentId] = (conversionsMap[c.contentId] || 0) + c.sales
  })

  const topPerforming = (contentPieces || [])
    .sort((a, b) => (conversionsMap[b.id] || 0) - (conversionsMap[a.id] || 0))
    .slice(0, 3)
    .map((c) => ({
      id: c.id,
      type: c.content_type,
      engagement: conversionsMap[c.id] || 0,
    }))

  return {
    productId,
    contentGenerated: contentPieces?.length || 0,
    topPerformingContent: topPerforming,
    conversionsByContent: Object.entries(conversionsMap).map(([contentId, sales]) => ({
      contentId,
      sales,
    })),
    recommendedNextContent: generateContentRecommendations(
      contentPieces || [],
      conversionsMap,
    ),
  }
}

// ============================================================================
// 6. SUGGÉRER CONTENU PRODUIT
// ============================================================================

export async function suggestProductContent(
  therapistId: string,
): Promise<
  { productId: string; productTitle: string; suggestions: SuggestionItem[] }[]
> {
  // Récupérer tous les produits du thérapeute
  const { data: products } = await supabase
    .from('digital_products')
    .select('*')
    .eq('therapist_id', therapistId)

  const suggestions = []

  for (const product of products || []) {
    const insights = await getProductContentInsights(therapistId, product.id)

    // Baser les suggestions sur les gaps de contenu et performance
    const suggestions_for_product = generateSmartSuggestions(
      product,
      insights,
    )

    suggestions.push({
      productId: product.id,
      productTitle: product.title,
      suggestions: suggestions_for_product,
    })
  }

  return suggestions
}

interface SuggestionItem {
  contentType: ContentType
  topic: string
  strategy: ProductContentStrategy
  reason: string
}

// ============================================================================
// 7. CRÉER PONT AVEC CONTENU EXISTANT
// ============================================================================

export async function bridgeExistingContent(
  therapistId: string,
  contentId: string,
  productId: string,
): Promise<GeneratedContent> {
  // Récupérer le contenu existant
  const { data: existingContent } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('id', contentId)
    .eq('therapist_id', therapistId)
    .single()

  if (!existingContent) {
    throw new Error(`Contenu non trouvé: ${contentId}`)
  }

  const { data: product } = await supabase
    .from('digital_products')
    .select('*')
    .eq('id', productId)
    .single()

  const systemPrompt = `Tu es un expert en création de contenu qui crée des ponts naturels vers les produits.

Ton objectif: Prendre un contenu éducatif existant et créer une version qui:
1. Garde toute la valeur éducative originale
2. Ajoute une transition NATURELLE vers le produit
3. Propose "Aller plus loin avec [produit]"
4. Reste authentique, jamais forcé

Style de transition idéale:
"Vous avez aimé cet article ? Si ce sujet vous parle profondément, j'ai créé [produit] pour explorer cela plus en détail avec vous."

Génère une version bridgée du contenu existant.`

  const contentRequest: ContentRequest = {
    therapistId,
    contentType: existingContent.content_type as ContentType,
    topic: existingContent.title,
    intention: 'educational_bridge',
    funnelStage: 'consideration',
    customInstructions: `Produit cible: ${product?.title}. Ajoute un pont naturel à la fin.`,
  }

  return generateContent(contentRequest)
}

// ============================================================================
// 8. GÉNÉRER SÉQUENCE D'EMAILS DE NURTURE
// ============================================================================

export async function generateEmailNurture(
  therapistId: string,
  productId: string,
  sequenceLength: number = 5,
): Promise<GeneratedContent[]> {
  const { data: product } = await supabase
    .from('digital_products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!product) {
    throw new Error(`Produit non trouvé: ${productId}`)
  }

  const emailSequences = [
    {
      order: 1,
      topic: 'Valeur pure - pas de mention de produit',
      strategy: 'soft_mention' as ProductContentStrategy,
      stage: 'awareness' as FunnelStage,
    },
    {
      order: 2,
      topic: 'Valeur avec une mention subtile',
      strategy: 'soft_mention',
      stage: 'awareness',
    },
    {
      order: 3,
      topic: 'Pont éducatif vers le produit',
      strategy: 'educational_bridge',
      stage: 'consideration',
    },
    {
      order: 4,
      topic: 'Soft pitch avec preuve sociale',
      strategy: 'testimonial',
      stage: 'consideration',
    },
    {
      order: 5,
      topic: 'Offre directe avec garantie',
      strategy: 'direct_promo',
      stage: 'decision',
    },
  ]

  const emails: GeneratedContent[] = []

  for (const emailConfig of emailSequences.slice(0, sequenceLength)) {
    const email = await generateContent({
      therapistId,
      contentType: 'email_newsletter',
      topic: emailConfig.topic,
      intention: emailConfig.strategy,
      funnelStage: emailConfig.stage,
      customInstructions: `Email ${emailConfig.order}/${sequenceLength} de la séquence de nurture pour ${product.title}. Stratégie: ${emailConfig.strategy}`,
    })

    emails.push(email)
  }

  return emails
}

// ============================================================================
// FONCTIONS HELPER
// ============================================================================

function buildStrategyPrompt(
  strategy: ProductContentStrategy,
  productType: ProductType,
  productTitle: string,
  productDescription: string,
): string {
  const strategyGuides: Record<ProductContentStrategy, string> = {
    soft_mention: `STRATÉGIE: Soft Mention
- L'accent est 100% sur la valeur éducative
- Le produit est mentionné naturellement EN FIN, si du tout
- Créer du désir par l'éducation, pas par la vente
- Exemple: "Si ce sujet te fascine, j'ai créé..."`,

    educational_bridge: `STRATÉGIE: Pont Éducatif
- Enseigne une partie utile et authentique du contenu du produit
- Crée un moment "veux-tu en savoir plus?"
- Montre la valeur du produit par son contenu
- Transition: "Mais c'est juste le début. Si tu veux explorer cela davantage..."`,

    direct_promo: `STRATÉGIE: Promotion Directe
- Announce clairement le produit et ses bénéfices
- Utilise des données réelles (nombre de clients, résultats)
- CTA direct et clair
- Reste authentique même en étant direct
- Adresse les objections communes`,

    launch: `STRATÉGIE: Lancement
- Crée de l'excitation et de l'anticipation
- Partage POURQUOI tu as créé ce produit
- Inclue des détails tangibles (prix, format, accès)
- Offre éventuellement un bonus de lancement
- Urgence douce (places limitées, bonus tempo)`,

    testimonial: `STRATÉGIE: Témoignage
- Partage des résultats réels et transformations
- Utilise des chiffres si disponibles
- Montre l'avant/après
- Humanise le produit à travers des histoires
- Crée une FOMO positive ("Tu pourrais être le prochain")`,
  }

  return strategyGuides[strategy] || ''
}

function buildFunnelPrompt(stage: FunnelStage): string {
  const funnelGuides: Record<FunnelStage, string> = {
    awareness: `ÉTAPE DU FUNNEL: Awareness (Sensibilisation)
- L'audience ne sait pas qu'il y a un problème
- Pas de mention de produit (ou très subtile)
- Focus sur l'éducation et la révélation
- Objectif: "Ah, c'est donc pour ça que je ressens ça"`,

    consideration: `ÉTAPE DU FUNNEL: Consideration (Réflexion)
- L'audience sait qu'il y a un problème
- Maintenant elle explore des solutions
- Montre comment tu peux l'aider
- Soft CTA vers le produit`,

    decision: `ÉTAPE DU FUNNEL: Decision (Décision)
- L'audience est prête à acheter
- Montre clairement comment tu résous le problème
- Adresse les dernières objections
- CTA direct et motivant`,

    retention: `ÉTAPE DU FUNNEL: Retention (Fidélisation)
- Pour les clients existants
- Maximise la valeur qu'ils reçoivent
- Crée un sentiment de communauté
- Upsell naturel vers autres produits`,
  }

  return funnelGuides[stage] || ''
}

function generateContentRecommendations(
  contentPieces: any[],
  conversionsMap: Record<string, number>,
): string[] {
  // Identifier les gaps basés sur les types de contenu et la performance
  const contentTypes = contentPieces.map((c) => c.content_type)
  const topTypes = ['blog_article', 'instagram_carousel', 'email_newsletter']

  const missingTypes = topTypes.filter((t) => !contentTypes.includes(t))
  const recommendations: string[] = []

  if (missingTypes.length > 0) {
    recommendations.push(
      `Crée plus de contenu ${missingTypes[0]} - c'est un format hautement performant`,
    )
  }

  const totalConversions = Object.values(conversionsMap).reduce((a, b) => a + b, 0)
  if (totalConversions === 0) {
    recommendations.push('Amplifie la portée du contenu via des campagnes payantes')
  }

  recommendations.push('Testa un contenu de preuve sociale avec des chiffres réels')

  return recommendations
}

function generateSmartSuggestions(
  product: any,
  insights: ProductContentInsights,
): SuggestionItem[] {
  const suggestions: SuggestionItem[] = []

  // Suggestion 1: Si peu de contenu généré
  if (insights.contentGenerated < 3) {
    suggestions.push({
      contentType: 'blog_article',
      topic: `Guide complet: ${product.title}`,
      strategy: 'educational_bridge',
      reason: 'Crée une autorité autour du produit avec du contenu SEO',
    })
  }

  // Suggestion 2: Teaser educational
  suggestions.push({
    contentType: 'instagram_carousel',
    topic: `5 points clés de ${product.title}`,
    strategy: 'educational_bridge',
    reason: 'Montre la valeur via contenu éducatif swipeable',
  })

  // Suggestion 3: Testimonial ou social proof
  if (insights.conversionsByContent.length > 0) {
    suggestions.push({
      contentType: 'reel_script',
      topic: 'Transformation d\'un client',
      strategy: 'testimonial',
      reason: 'Les vidéos créent de l\'engagement et de la confiance',
    })
  } else {
    suggestions.push({
      contentType: 'instagram_post',
      topic: 'FAQ: Questions communes sur ' + product.title,
      strategy: 'direct_promo',
      reason: 'Adresse les objections avant qu\'elles ne bloquent les ventes',
    })
  }

  return suggestions
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ProductContentRequest,
  LaunchPhase,
  LaunchSequence,
  ProductContentInsights,
  ProductContentStrategy,
  FunnelStage,
}
