// src/lib/seo-engine.ts
// SEO Intelligence Engine — keyword strategy, content clusters, meta optimization
// For French therapists — all keywords and content in French

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase'

const anthropic = new Anthropic()
const supabase = createClient()
// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SEOKeyword {
  id?: string
  therapist_id: string
  keyword: string
  keyword_type: 'primary' | 'secondary' | 'long_tail' | 'local' | 'question'
  search_volume_estimate: number
  competition_level: 'low' | 'medium' | 'high'
  relevance_score: number // 0-1
  cluster_name: string
  is_pillar: boolean
  current_ranking?: number
  clicks_last_30d?: number
  impressions_last_30d?: number
}

export interface ContentCluster {
  name: string
  pillar: string
  pillarKeyword: SEOKeyword
  satellites: string[]
  keywords: SEOKeyword[]
  internalLinkStrategy: { source: string; target: string; anchor: string }[]
}

export interface SEOStrategy {
  therapist_id: string
  clusters: ContentCluster[]
  priorityKeywords: SEOKeyword[]
  contentGaps: string[]
  seasonalOpportunities: string[]
  generatedAt: Date
}

export interface ArticleSEO {
  metaTitle: string
  metaDescription: string
  slug: string
  targetKeywords: string[]
  headingStructure: { level: number; text: string }[]
  internalLinks: { text: string; url: string }[]
  keywordDensity: Record<string, number>
  estimatedReadingTime: number
}

export interface ContentOutline {
  outline: string[]
  estimatedWordCount: number
  targetQuestions: string[]
  searchIntentType: 'informational' | 'navigational' | 'transactional' | 'commercial'
}

export interface CompetitiveAnalysis {
  gaps: string[]
  opportunities: string[]
  difficulty: 'low' | 'medium' | 'high'
  estimatedTimeToRank: string
}

// ============================================================================
// SPECIALTY KEYWORD MAP — Predefined keyword seeds per therapy specialty
// ============================================================================

export const SPECIALTY_KEYWORD_MAP: Record<string, string[]> = {
  anxiété: [
    'psychologue anxiété',
    'thérapeute anxiété générale',
    'crise d\'angoisse aide',
    'comment gérer l\'anxiété',
    'thérapie anxiété efficace',
    'anxiété sociale traitement',
    'trouble anxieux spécialiste',
    'anxiété professionnelle',
    'crise de panique thérapie',
    'anxiété enfant psychologue',
    'anxiété de séparation',
    'thérapie cognitive anxiété',
    'gestion stress anxiété',
    'hypnothérapie anxiété',
    'pleine conscience anxiété',
    'meilleur thérapeute anxiété',
    'coaching anxiété',
    'anxiété agoraphobie',
  ],
  dépression: [
    'psychologue dépression',
    'thérapeute dépression sévère',
    'sortir de la dépression aide',
    'symptômes dépression traitement',
    'thérapie dépression majeure',
    'dépression saisonnière',
    'dépression post-partum',
    'dépression adolescent',
    'dépression chronique spécialiste',
    'traitement dépression psychothérapie',
    'dépression et anxiété',
    'aide dépression grave',
    'comment vaincre dépression',
    'thérapie comportementale dépression',
    'coaching dépression',
    'dépression professionnelle',
    'burn-out et dépression',
    'rémission dépression',
  ],
  'burn-out': [
    'thérapeute burn-out professionnel',
    'psychologue burn-out travail',
    'récupération burn-out',
    'symptômes burn-out traitement',
    'sortir du burn-out',
    'coaching burn-out',
    'thérapie burn-out efficace',
    'burn-out parental aide',
    'stress professionnel chronique',
    'épuisement professionnel thérapie',
    'retour travail après burn-out',
    'prévention burn-out',
    'diagnostic burn-out',
    'accompagnement burn-out',
    'thérapie stress professionnel',
    'bien-être au travail',
  ],
  couple: [
    'thérapeute couple',
    'thérapie de couple efficace',
    'psychologue relation amoureuse',
    'crise couple aide',
    'thérapie conjugale conflits',
    'communication couple thérapie',
    'infidélité traitement couple',
    'séparation conseil psychologue',
    'couples spécialiste',
    'thérapie de couple court terme',
    'médiation familiale',
    'relation toxique aide',
    'reconstruction couple',
    'thérapie sexuelle couple',
    'divorce préservation enfants',
    'confiance couple retrouver',
  ],
  enfant: [
    'psychologue enfant',
    'thérapeute enfant comportement',
    'aide enfant anxieux',
    'enfant anxiété scolaire',
    'phobie scolaire thérapie',
    'trouble du comportement enfant',
    'enfant agressif psychologue',
    'retard développement enfant',
    'problèmes apprentissage enfant',
    'enfant hyperactif TDAH',
    'énurésie enfant traitement',
    'traumatisme enfant thérapie',
    'discipline bienveillante coaching',
    'parentalité positive accompagnement',
    'crises colère enfant',
    'enfant surdoué accompagnement',
  ],
  deuil: [
    'thérapeute deuil',
    'psychologue accompagnement deuil',
    'deuil aide professionnelle',
    'deuil enfant suicide',
    'chagrin deuil thérapie',
    'deuil compliqué traitement',
    'décès parent enfant aide',
    'processus deuil normale',
    'deuil anticipé',
    'endeuillé soutien psychologique',
    'trauma deuil',
    'deuil parent enfants',
  ],
  'troubles du comportement alimentaire': [
    'thérapeute TCA anorexie boulimie',
    'psychologue troubles alimentaires',
    'anorexie mentale traitement',
    'boulimie thérapie',
    'hyperphagie binge eating',
    'trouble alimentaire adolescent',
    'orthorexie aide psychologue',
    'image corporelle estime soi',
    'nutrition psychologie',
    'thérapie TCA spécialiste',
    'anorexie en ligne support',
    'boulimie traitement efficace',
  ],
  addiction: [
    'thérapeute addiction alcool',
    'psychologue dépendance drogue',
    'addiction alcool aide',
    'sevrage drogue accompagnement',
    'dépendance nicotine arrêt',
    'dépendance jeux vidéo',
    'addiction internet adolescent',
    'réduction risques addiction',
    'réhabilitation addiction',
    'gestion impulsivité addiction',
    'thérapie motivationnelle addiction',
    'groupe soutien addiction',
  ],
  trauma: [
    'psychologue trauma PTSD',
    'thérapeute trauma choc',
    'EMDR trauma traitement',
    'syndrome stress post-traumatique',
    'trauma enfance adulte',
    'trauma complexe aide',
    'viol agression sexuelle aide',
    'accident traumatique thérapie',
    'maltraitance enfant psychologue',
    'violence conjugale soutien',
    'reconstruction après trauma',
    'thérapie trauma efficace',
  ],
  confiance: [
    'psychologue confiance soi',
    'thérapeute manque confiance',
    'estime soi faible coaching',
    'affirmation de soi thérapie',
    'timidité aide psychologique',
    'peur du jugement thérapie',
    'assertivité training',
    'perfectionnisme accompagnement',
    'imposter syndrome aide',
    'blocages confiance traitement',
    'développement personnel confiance',
    'coach confiance soi',
  ],
}

// ============================================================================
// SEASONAL TOPICS — Trending mental health topics by month in France
// ============================================================================

export const SEASONAL_TOPICS: Record<number, { topics: string[]; hooks: string[]; keywords: string[] }> = {
  1: {
    topics: ['Bonnes résolutions', 'Dépression hivernale', 'Anxiété nouvelle année'],
    hooks: ['Comment tenir ses objectifs', 'Vaincre la dépression saisonnière', 'Gérer l\'anxiété du changement'],
    keywords: ['résolutions psychologie', 'dépression hivernale traitement', 'anxiété janvier motivation'],
  },
  2: {
    topics: ['Saint-Valentin et relations', 'Solitude psychologique', 'Renouveau personnel'],
    hooks: ['Célibataire et heureux', 'Confiance en amour', 'Reconstruire après rupture'],
    keywords: ['relation amoureuse confiance', 'dépression solitude février', 'thérapie couple'],
  },
  3: {
    topics: ['Printemps et optimisme', 'Énergie nouvelle', 'Sorties dépression'],
    hooks: ['Retrouver l\'énergie', 'Changement de saison psychologie', 'Renouveau personnel'],
    keywords: ['dépression saisonnière printemps', 'retrouver énergie psychologue', 'optimisme thérapie'],
  },
  4: {
    topics: ['Pâques et famille', 'Anxiété familles', 'Bienveillance parentale'],
    hooks: ['Gestion conflits familiaux', 'Enfants anxieux Pâques', 'Parentalité positive'],
    keywords: ['famille anxiété réunion', 'enfant conflits parents', 'bienveillance parentalité'],
  },
  5: {
    topics: ['Été approche', 'Préparation vacances', 'Anxiété des voyages'],
    hooks: ['Préparer vacances sereinement', 'Anxiété voyage phobie', 'Famille vacances conflit'],
    keywords: ['anxiété vacances voyage', 'stress plage social', 'préparation été psychologie'],
  },
  6: {
    topics: ['Bac et examens', 'Anxiété scolaire', 'Stress adolescents'],
    hooks: ['Gestion stress examen', 'Anxiété bachotage', 'Support adolescent bac'],
    keywords: ['anxiété examen bac', 'stress étudiant aide', 'confiance scolaire adolescent'],
  },
  7: {
    topics: ['Vacances', 'Bien-être estival', 'Déconnexion digitale'],
    hooks: ['Bénéfices vacances santé mentale', 'Déconnexion numérique', 'Relaxation été'],
    keywords: ['bien-être vacances estivales', 'déconnexion numérique santé', 'stress travail pause'],
  },
  8: {
    topics: ['Fin vacances', 'Syndrome retour', 'Préparation rentrée'],
    hooks: ['Gérer le retour', 'Anxiété fin vacances', 'Préparer la rentrée'],
    keywords: ['syndrome retour vacances', 'anxiété fin août', 'préparer rentrée scolaire'],
  },
  9: {
    topics: ['Rentrée scolaire', 'Anxiété enfants', 'Stress professionnel rentrée'],
    hooks: ['Aider enfant anxieux rentrée', 'Phobie scolaire septembre', 'Gestion stress rentrée'],
    keywords: ['anxiété rentrée scolaire enfant', 'phobie école aide', 'stress rentrée professonel'],
  },
  10: {
    topics: ['Automne et humeur', 'Halloween anxiété', 'Préparation hiver'],
    hooks: ['Dépression automne', 'Peurs Halloween enfant', 'Préparer hiver psychologie'],
    keywords: ['dépression automne saisonnière', 'peur halloween enfant', 'anxiété automne traitement'],
  },
  11: {
    topics: ['Préparation hiver', 'Dépression saisonnière', 'Gratitude et bien-être'],
    hooks: ['Lumière hiver santé mentale', 'Combattre dépression novembre', 'Gratitude psychologie'],
    keywords: ['luminothérapie dépression hiver', 'dépression novembre saisonnière', 'gratitude bien-être'],
  },
  12: {
    topics: ['Noël stress famille', 'Dépression hivernale', 'Solitude fêtes'],
    hooks: ['Noël sans famille', 'Gestion stress réunion famille', 'Solitude durant fêtes'],
    keywords: ['stress noël famille', 'dépression décembre hivernale', 'solitude fêtes aide'],
  },
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Generate a complete SEO strategy for a therapist
 * Uses Claude AI + specialty keyword map + city location
 */
export async function generateKeywordStrategy(
  therapistId: string,
  specialty: string,
  city: string,
  approach: string
): Promise<SEOStrategy> {
  const seedKeywords = SPECIALTY_KEYWORD_MAP[specialty.toLowerCase()] || []
  const currentMonth = new Date().getMonth() + 1
  const seasonal = SEASONAL_TOPICS[currentMonth]

  const prompt = `Tu es un expert SEO spécialisé dans le marketing digital pour les thérapeutes en France.

Specialty: ${specialty}
Ville: ${city}
Approche thérapeutique: ${approach}

Mots-clés seeds: ${seedKeywords.join(', ')}

Sujets saisonniers actuels: ${seasonal.topics.join(', ')}

Génère une stratégie SEO complète en JSON avec:
1. 3-4 clusters thématiques de contenu (pilier + satellites)
2. 15-20 mots-clés prioritaires avec estimations volume recherche et difficulté
3. 5-8 gaps de contenu identifiés
4. 3-5 opportunités saisonnières

Format JSON:
{
  "clusters": [
    {
      "name": "string",
      "pillarKeyword": "string",
      "satelliteKeywords": ["string"]
    }
  ],
  "priorityKeywords": [
    {
      "keyword": "string",
      "type": "primary|secondary|long_tail|local|question",
      "estimatedSearchVolume": number,
      "competitionLevel": "low|medium|high",
      "relevanceScore": 0-1
    }
  ],
  "contentGaps": ["string"],
  "seasonalOpportunities": ["string"]
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  const strategyData = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  // Build and save keywords to database
  const keywords: SEOKeyword[] = []

  for (const cluster of strategyData.clusters || []) {
    const pillarKeyword: SEOKeyword = {
      therapist_id: therapistId,
      keyword: cluster.pillarKeyword,
      keyword_type: 'primary',
      search_volume_estimate: 500 + Math.random() * 1500,
      competition_level: 'medium',
      relevance_score: 0.95,
      cluster_name: cluster.name,
      is_pillar: true,
    }
    keywords.push(pillarKeyword)

    for (const satellite of cluster.satelliteKeywords || []) {
      const satelliteKeyword: SEOKeyword = {
        therapist_id: therapistId,
        keyword: satellite,
        keyword_type: 'secondary',
        search_volume_estimate: 200 + Math.random() * 800,
        competition_level: 'medium',
        relevance_score: 0.8,
        cluster_name: cluster.name,
        is_pillar: false,
      }
      keywords.push(satelliteKeyword)
    }
  }

  // Add priority keywords from strategy
  for (const kw of strategyData.priorityKeywords || []) {
    const keyword: SEOKeyword = {
      therapist_id: therapistId,
      keyword: kw.keyword,
      keyword_type: kw.type,
      search_volume_estimate: kw.estimatedSearchVolume || 300,
      competition_level: kw.competitionLevel || 'medium',
      relevance_score: kw.relevanceScore || 0.85,
      cluster_name: strategyData.clusters[0]?.name || 'General',
      is_pillar: kw.type === 'primary',
    }
    keywords.push(keyword)
  }

  // Save to database
  if (keywords.length > 0) {
    await supabase.from('seo_keywords').upsert(
      keywords.map((kw) => ({
        ...kw,
        therapist_id: therapistId,
      })),
      { onConflict: 'therapist_id,keyword' }
    )
  }

  // Build content clusters with internal linking
  const clusters = buildContentClusters(keywords)

  return {
    therapist_id: therapistId,
    clusters,
    priorityKeywords: keywords.filter((kw) => kw.keyword_type === 'primary').slice(0, 10),
    contentGaps: strategyData.contentGaps || [],
    seasonalOpportunities: strategyData.seasonalOpportunities || [],
    generatedAt: new Date(),
  }
}

/**
 * Group keywords into thematic clusters with internal linking strategy
 */
export function buildContentClusters(keywords: SEOKeyword[]): ContentCluster[] {
  const clusterMap = new Map<string, SEOKeyword[]>()

  for (const kw of keywords) {
    if (!clusterMap.has(kw.cluster_name)) {
      clusterMap.set(kw.cluster_name, [])
    }
    clusterMap.get(kw.cluster_name)!.push(kw)
  }

  const clusters: ContentCluster[] = []

  for (const [clusterName, clusterKeywords] of clusterMap.entries()) {
    const pillar = clusterKeywords.find((k) => k.is_pillar)
    if (!pillar) continue

    const satellites = clusterKeywords
      .filter((k) => !k.is_pillar)
      .map((k) => k.keyword)

    // Generate internal linking strategy
    const internalLinkStrategy = satellites
      .slice(0, 5)
      .map((satellite, idx) => ({
        source: satellite,
        target: pillar.keyword,
        anchor: `lire plus sur ${pillar.keyword}`,
      }))

    clusters.push({
      name: clusterName,
      pillar: pillar.keyword,
      pillarKeyword: pillar,
      satellites,
      keywords: clusterKeywords,
      internalLinkStrategy,
    })
  }

  return clusters
}

/**
 * Get seasonal topics for current or specified month
 */
export function getSeasonalTopics(month?: number): {
  topics: string[]
  hooks: string[]
  keywords: string[]
} {
  const m = month || new Date().getMonth() + 1
  return (
    SEASONAL_TOPICS[m] || {
      topics: [],
      hooks: [],
      keywords: [],
    }
  )
}

/**
 * Optimize content for SEO with meta tags, headings, and keyword integration
 */
export async function optimizeForSEO(
  content: string,
  targetKeywords: string[],
  contentType: string
): Promise<ArticleSEO> {
  const prompt = `Tu es un expert SEO. Analyse ce contenu et optimise-le.

Contenu: ${content.substring(0, 1000)}...
Mots-clés cibles: ${targetKeywords.join(', ')}
Type de contenu: ${contentType}

Génère une optimisation JSON avec:
1. Meta title (<60 caractères)
2. Meta description (<155 caractères)
3. Slug URL
4. Structure des headings (H1, H2, H3...)
5. Suggestions liens internes
6. Densité mots-clés

Format JSON:
{
  "metaTitle": "string",
  "metaDescription": "string",
  "slug": "string",
  "headings": [
    {"level": 1, "text": "string"}
  ],
  "internalLinks": [
    {"text": "string", "url": "string"}
  ],
  "keywordDensity": {"keyword": percentage}
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  const seoData = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  const estimatedReadingTime = Math.ceil(content.split(/\s+/).length / 200)

  return {
    metaTitle: seoData.metaTitle || 'Titre optimisé',
    metaDescription: seoData.metaDescription || 'Description optimisée',
    slug: seoData.slug || content.toLowerCase().replace(/\s+/g, '-').substring(0, 50),
    targetKeywords,
    headingStructure: seoData.headings || [],
    internalLinks: seoData.internalLinks || [],
    keywordDensity: seoData.keywordDensity || {},
    estimatedReadingTime,
  }
}

/**
 * Generate detailed article outline optimized for SEO
 */
export async function generateArticleOutline(
  keyword: SEOKeyword,
  cluster: ContentCluster,
  voicePrompt: string
): Promise<ContentOutline> {
  const prompt = `Tu es expert en création de contenu SEO pour thérapeutes en France.

Mot-clé principal: ${keyword.keyword}
Type: ${keyword.keyword_type}
Cluster: ${cluster.name}
Consignes de style: ${voicePrompt}

Génère un plan d'article optimisé SEO en JSON avec:
1. Structure complète de l'article (H1, H2, H3...)
2. 6-10 questions "People Also Ask"
3. Estimation nombre de mots
4. Type d'intent de recherche

Format JSON:
{
  "outline": ["string"],
  "targetQuestions": ["string"],
  "estimatedWordCount": number,
  "searchIntentType": "informational|navigational|transactional|commercial"
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  const outlineData = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  return {
    outline: outlineData.outline || [],
    estimatedWordCount: outlineData.estimatedWordCount || 1500,
    targetQuestions: outlineData.targetQuestions || [],
    searchIntentType: outlineData.searchIntentType || 'informational',
  }
}

/**
 * Analyze competitive landscape and identify opportunities
 */
export async function analyzeCompetition(
  specialty: string,
  city: string
): Promise<CompetitiveAnalysis> {
  const seedKeywords = SPECIALTY_KEYWORD_MAP[specialty.toLowerCase()] || []

  const prompt = `Tu es analyste SEO spécialisé dans le marché des thérapeutes en France.

Spécialité: ${specialty}
Ville: ${city}
Mots-clés principaux: ${seedKeywords.slice(0, 5).join(', ')}

Analyse le paysage concurrentiel et identifie:
1. 5-8 gaps de contenu (topics non couverts)
2. 5-8 opportunités SEO (niches underserved)
3. Difficulté générale (low|medium|high)
4. Estimation temps pour ranker (en mois)

Format JSON:
{
  "gaps": ["string"],
  "opportunities": ["string"],
  "difficulty": "low|medium|high",
  "estimatedTimeToRank": "string"
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  const analysisData = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  return {
    gaps: analysisData.gaps || [],
    opportunities: analysisData.opportunities || [],
    difficulty: analysisData.difficulty || 'medium',
    estimatedTimeToRank: analysisData.estimatedTimeToRank || '3-6 mois',
  }
}

/**
 * Fetch all keywords for a therapist from database
 */
export async function getKeywordsForTherapist(therapistId: string): Promise<SEOKeyword[]> {
  const { data, error } = await supabase
    .from('seo_keywords')
    .select('*')
    .eq('therapist_id', therapistId)

  if (error) {
    console.error('Error fetching keywords:', error)
    return []
  }

  return (data || []) as SEOKeyword[]
}

/**
 * Update keyword performance metrics from external sources
 */
export async function updateKeywordPerformance(
  therapistId: string,
  keywordId: string,
  metrics: Partial<SEOKeyword>
): Promise<void> {
  const { error } = await supabase
    .from('seo_keywords')
    .update(metrics)
    .eq('id', keywordId)
    .eq('therapist_id', therapistId)

  if (error) {
    console.error('Error updating keyword:', error)
  }
}
