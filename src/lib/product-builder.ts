import Anthropic from '@anthropic-ai/sdk'

// Safe JSON parsing helper
function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}

export type ProductType = 'audio_program' | 'mini_course' | 'live_workshop' | 'subscription'

export interface DigitalProduct {
  type: ProductType
  title: string
  subtitle: string
  description: string
  targetAudience: string
  duration: string
  price: { amount: number; currency: 'EUR'; compareAt?: number }
  modules: ProductModule[]
  salesPage: SalesPageContent
  emailSequence: EmailSequence[]
  adCampaign: ProductAdCampaign
  metadata: {
    specialty: string
    segment: string
    estimatedRevenue: { monthly: number; yearly: number }
    productionTimeEstimate: string
  }
}

export interface ProductModule {
  order: number
  title: string
  description: string
  type: 'audio' | 'video' | 'pdf' | 'live_session' | 'exercise'
  duration: string
  script?: string
  exerciseContent?: string
  deliveryDay?: number
}

export interface SalesPageContent {
  headline: string
  subheadline: string
  heroDescription: string
  painPoints: string[]
  benefits: string[]
  whatYouGet: { title: string; description: string }[]
  testimonialPrompts: string[]
  guarantee: string
  faq: { question: string; answer: string }[]
  urgencyElement?: string
  ctaPrimary: string
  ctaSecondary: string
}

export interface EmailSequence {
  order: number
  dayOffset: number
  subject: string
  previewText: string
  body: string
  type: 'welcome' | 'content' | 'reminder' | 'upsell' | 'launch_teaser' | 'launch_offer' | 'last_chance'
}

export interface ProductAdCampaign {
  adVariants: {
    headline: string
    primaryText: string
    description: string
    ctaType: 'SHOP_NOW' | 'LEARN_MORE' | 'SIGN_UP'
    targetSegment: string
  }[]
  suggestedBudget: { daily: number; duration: number }
  targetingNotes: string
}

export class ProductBuilder {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  async generateProduct(params: {
    therapistName: string
    specialty: string
    approach: string
    mainProblem: string
    techniques: string
    city: string
    productType: ProductType
    topic: string
    targetSegment?: string
    priceRange?: 'low' | 'medium' | 'high'
  }): Promise<DigitalProduct> {
    const {
      therapistName,
      specialty,
      approach,
      mainProblem,
      techniques,
      city,
      productType,
      topic,
      targetSegment,
      priceRange = 'medium',
    } = params

    const systemPrompt = `Tu es un expert en création de produits numériques thérapeutiques. Tu crées des produits digitaux complets (programmes audio, mini-cours, ateliers, abonnements) qui se vendent bien auprès des publics thérapeutiques en France.

Tu comprends:
- La psychologie du client thérapeutique (cherche transformation, pas juste information)
- Le positionnement premium des thérapeutes
- Les conversions d'email et la construction de funnel
- La tarification des produits digitaux
- Le copywriting thérapeutique authentique

IMPORTANT: Réponds UNIQUEMENT en JSON valide, sans markdown, sans explications supplémentaires.`

    const productTypeLabel = {
      audio_program: 'Programme audio',
      mini_course: 'Mini-cours',
      live_workshop: 'Atelier live',
      subscription: 'Abonnement mensuel',
    }[productType]

    const priceRanges = {
      low: { min: 19, max: 39, compareMin: 49, compareMax: 79 },
      medium: { min: 47, max: 97, compareMin: 97, compareMax: 197 },
      high: { min: 127, max: 247, compareMin: 247, compareMax: 497 },
    }

    const range = priceRanges[priceRange]
    const estimatedPrice = Math.round((range.min + range.max) / 2)

    const userPrompt = `Génère un ${productTypeLabel} digital complet et prêt à vendre.

PROFIL DU THÉRAPEUTE:
- Nom: ${therapistName}
- Spécialité: ${specialty}
- Approche: ${approach}
- Problème principal résolu: ${mainProblem}
- Techniques utilisées: ${techniques}
- Localisation: ${city}

PRODUIT À CRÉER:
- Type: ${productType}
- Sujet: ${topic}
- Segment cible: ${targetSegment || 'Tous les segments appropriés'}
- Gamme de prix: €${range.min}-${range.max}

Génère une réponse JSON COMPLÈTE avec TOUTES les sections remplies:

{
  "type": "${productType}",
  "title": "Titre vendeur du produit en français",
  "subtitle": "Sous-titre accrocheur (10-15 mots)",
  "description": "Description détaillée pour la page de vente (2-3 paragraphes)",
  "targetAudience": "Description du public cible",
  "duration": "Durée totale du produit (ex: '21 jours', '4 semaines', '6 heures')",
  "price": {
    "amount": ${estimatedPrice},
    "currency": "EUR",
    "compareAt": ${Math.round((range.compareMin + range.compareMax) / 2)}
  },
  "modules": [
    {
      "order": 1,
      "title": "Titre du module",
      "description": "Description du contenu du module",
      "type": "audio|video|pdf|live_session|exercise",
      "duration": "Durée du module (ex: '45 minutes', '2 heures')",
      "deliveryDay": 1
    }
  ],
  "salesPage": {
    "headline": "Titre principal percutant",
    "subheadline": "Sous-titre qui clarifie le bénéfice principal",
    "heroDescription": "Description longue de la transformation (3-4 phrases)",
    "painPoints": ["Problème 1", "Problème 2", "Problème 3", "Problème 4"],
    "benefits": ["Bénéfice 1", "Bénéfice 2", "Bénéfice 3", "Bénéfice 4"],
    "whatYouGet": [
      { "title": "Module 1", "description": "Ce qu'on apprend et fait" },
      { "title": "Module 2", "description": "Ce qu'on apprend et fait" }
    ],
    "testimonialPrompts": [
      "Format de témoignage 1 (avant/après, transformation spécifique)",
      "Format de témoignage 2 (résultat quantifié)"
    ],
    "guarantee": "Satisfait ou remboursé sous 14 jours",
    "faq": [
      { "question": "Q1?", "answer": "Réponse qui rassure et vend" },
      { "question": "Q2?", "answer": "Réponse qui rassure et vend" }
    ],
    "urgencyElement": "Élément de scarcité ou urgence (optionnel)",
    "ctaPrimary": "Accéder au produit →",
    "ctaSecondary": "Voir un aperçu gratuit"
  },
  "emailSequence": [
    {
      "order": 1,
      "dayOffset": -3,
      "subject": "Sujet percutant",
      "previewText": "Avant-texte",
      "body": "<p>Corps du mail en HTML</p>",
      "type": "launch_teaser"
    }
  ],
  "adCampaign": {
    "adVariants": [
      {
        "headline": "Titre pub très court",
        "primaryText": "Texte principal (125 caractères max)",
        "description": "Description longue",
        "ctaType": "SHOP_NOW",
        "targetSegment": "Segment cible"
      }
    ],
    "suggestedBudget": {
      "daily": 10,
      "duration": 30
    },
    "targetingNotes": "Notes sur le ciblage recommandé"
  },
  "metadata": {
    "specialty": "${specialty}",
    "segment": "${targetSegment || 'Mixed'}",
    "estimatedRevenue": {
      "monthly": ${estimatedPrice * 5},
      "yearly": ${estimatedPrice * 60}
    },
    "productionTimeEstimate": "Temps estimé pour produire le contenu"
  }
}`

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const data = safeJsonParse<DigitalProduct>(text, {
      type: 'audio_program',
      title: 'Produit non généré',
      subtitle: '',
      description: '',
      targetAudience: '',
      duration: '',
      price: { amount: 0, currency: 'EUR' },
      modules: [],
      salesPage: { headline: '', subheadline: '', heroDescription: '', painPoints: [], benefits: [], whatYouGet: [], testimonialPrompts: [], guarantee: '', faq: [], ctaPrimary: '', ctaSecondary: '' },
      emailSequence: [],
      adCampaign: { adVariants: [], suggestedBudget: { daily: 0, duration: 0 }, targetingNotes: '' },
      metadata: { specialty: '', segment: '', estimatedRevenue: { monthly: 0, yearly: 0 }, productionTimeEstimate: '' },
    })
    return data
  }

  async generateProductOutline(params: {
    specialty: string
    productType: ProductType
    topic: string
    duration?: string
  }): Promise<{
    title: string
    modules: Pick<ProductModule, 'order' | 'title' | 'description' | 'type' | 'duration'>[]
  }> {
    const { specialty, productType, topic, duration } = params

    const systemPrompt = `Tu es un expert en structure de produits numériques thérapeutiques. Tu crées des structures de modules claires et vendables.

IMPORTANT: Réponds UNIQUEMENT en JSON valide, sans markdown.`

    const productTypeLabel = {
      audio_program: 'Programme audio',
      mini_course: 'Mini-cours',
      live_workshop: 'Atelier live',
      subscription: 'Abonnement mensuel',
    }[productType]

    const userPrompt = `Crée la structure de modules pour un ${productTypeLabel} sur le thème "${topic}" en ${specialty}.
${duration ? `Durée totale: ${duration}` : ''}

Réponds en JSON strict:
{
  "title": "Titre du produit",
  "modules": [
    {
      "order": 1,
      "title": "Titre du module",
      "description": "Description brève du contenu",
      "type": "audio|video|pdf|live_session|exercise",
      "duration": "Durée estimée"
    }
  ]
}`

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const data = safeJsonParse(text, { title: '', modules: [] })
    return data
  }

  async generateModuleScripts(params: {
    product: DigitalProduct
    moduleIndices: number[]
    therapistVoice?: string
  }): Promise<ProductModule[]> {
    const { product, moduleIndices, therapistVoice } = params

    const systemPrompt = `Tu es un scénariste expérimenté créant des scripts authentiques pour produits thérapeutiques.

Les scripts sont:
- Conversationnels et naturels (comme parler à un ami)
- Orientés vers la transformation, pas juste l'information
- Remplis d'exemples concrets et relatables
- Structurés avec une progression claire

IMPORTANT: Réponds UNIQUEMENT en JSON valide.`

    const modulesToGenerate = product.modules.filter((_, i) => moduleIndices.includes(i))

    const userPrompt = `Génère les scripts complets pour ces modules:

PRODUIT: ${product.title}
SPÉCIALITÉ: ${product.metadata.specialty}
${therapistVoice ? `STYLE DE COMMUNICATION: ${therapistVoice}` : ''}

MODULES À CRÉER:
${modulesToGenerate.map(m => `- Module ${m.order}: ${m.title} (${m.type}, ${m.duration})`).join('\n')}

Réponds en JSON array:
[
  {
    "order": 1,
    "title": "Titre du module",
    "description": "Description",
    "type": "audio|video|pdf|live_session|exercise",
    "duration": "Durée",
    "script": "Scénario complet et détaillé en français naturel (2000+ caractères minimum pour être utile)"
  }
]`

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const scripts = safeJsonParse<ProductModule[]>(text, [])
    return scripts
  }

  async generateSalesPage(params: {
    product: DigitalProduct
    specialty: string
    therapistName: string
  }): Promise<SalesPageContent> {
    const { product, specialty, therapistName } = params

    const systemPrompt = `Tu es un expert en copywriting pour produits thérapeutiques. Tu crées des pages de vente qui convertissent en utilisant:
- L'établissement du problème
- L'empathie authentique
- La preuve d'efficacité
- L'urgence douce
- Les garanties rassurantes

IMPORTANT: Réponds UNIQUEMENT en JSON valide.`

    const userPrompt = `Crée une page de vente pour ce produit:

PRODUIT: ${product.title}
THÉRAPEUTE: ${therapistName}
SPÉCIALITÉ: ${specialty}
DESCRIPTION: ${product.description}
MODULES: ${product.modules.map(m => m.title).join(', ')}
PRIX: €${product.price.amount}

Réponds en JSON:
{
  "headline": "Titre principal percutant",
  "subheadline": "Sous-titre qui clarifie le bénéfice",
  "heroDescription": "Description longue du bénéfice (3-4 phrases émotionnelles)",
  "painPoints": ["Problème 1", "Problème 2", "Problème 3", "Problème 4"],
  "benefits": ["Bénéfice 1", "Bénéfice 2", "Bénéfice 3", "Bénéfice 4"],
  "whatYouGet": [{ "title": "Module", "description": "Ce qu'on apprend" }],
  "testimonialPrompts": ["Format de témoignage suggéré"],
  "guarantee": "Politique de remboursement rassurante",
  "faq": [{ "question": "Q?", "answer": "Réponse vendable" }],
  "ctaPrimary": "Texte du bouton principal",
  "ctaSecondary": "Texte du bouton secondaire"
}`

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const data = safeJsonParse<SalesPageContent>(text, {
      headline: '', subheadline: '', heroDescription: '', painPoints: [], benefits: [], whatYouGet: [], testimonialPrompts: [], guarantee: '', faq: [], ctaPrimary: '', ctaSecondary: ''
    })
    return data
  }

  async generateEmailSequence(params: {
    product: DigitalProduct
    therapistName: string
    launchDate?: string
    hasExistingAudience: boolean
  }): Promise<EmailSequence[]> {
    const { product, therapistName, launchDate, hasExistingAudience } = params

    const systemPrompt = `Tu es un expert en email marketing pour produits thérapeutiques. Tu crées des séquences de lancement qui vendent sans être intrusives, en restant authentiques.

Les emails ont:
- Des sujets percutants qui créent curiosité ou urgence
- Un ton conversationnel de thérapeute
- Une progression: teasing → bénéfice → social proof → urgence

IMPORTANT: Réponds UNIQUEMENT en JSON valide.`

    const userPrompt = `Crée une séquence d'email pour lancer ce produit:

PRODUIT: ${product.title}
THÉRAPEUTE: ${therapistName}
PRIX: €${product.price.amount}
AUDIENCE EXISTANTE: ${hasExistingAudience ? 'Oui' : 'Non (cold list)'}
${launchDate ? `DATE DE LANCEMENT: ${launchDate}` : ''}

Génère une séquence de 6-8 emails (avant et après le lancement).

Réponds en JSON array:
[
  {
    "order": 1,
    "dayOffset": -5,
    "subject": "Sujet de l'email",
    "previewText": "Avant-texte de 40-50 caractères",
    "body": "<p>Corps du mail en HTML</p><p>Peut être long et détaillé</p>",
    "type": "launch_teaser|launch_offer|last_chance|welcome|content|reminder|upsell"
  }
]`

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const data = safeJsonParse<EmailSequence[]>(text, [])
    return data
  }

  async suggestPricing(params: {
    productType: ProductType
    specialty: string
    modulesCount: number
    totalDuration: string
    city: string
  }): Promise<{
    recommended: number
    range: { min: number; max: number }
    compareAt: number
    reasoning: string
  }> {
    const { productType, specialty, modulesCount, totalDuration, city } = params

    const systemPrompt = `Tu es un expert en tarification de produits numériques thérapeutiques en France. Tu considères:
- Le type de produit et sa valeur perçue
- La spécialité du thérapeute (certaines sont plus chères)
- La localisation géographique
- La durée et nombre de modules
- Le marché français (moins cher que US, mais en hausse)

IMPORTANT: Réponds UNIQUEMENT en JSON valide.`

    const userPrompt = `Suggère une tarification pour ce produit:

TYPE: ${productType}
SPÉCIALITÉ: ${specialty}
MODULES: ${modulesCount}
DURÉE TOTALE: ${totalDuration}
LOCALISATION: ${city}

Réponds en JSON:
{
  "recommended": 67,
  "range": { "min": 47, "max": 97 },
  "compareAt": 127,
  "reasoning": "Explique ta logique de tarification en 2-3 phrases"
}`

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const data = safeJsonParse(text, { recommended: 0, range: { min: 0, max: 0 }, compareAt: 0, reasoning: '' })
    return data
  }

  async generateAdCampaign(params: {
    product: DigitalProduct
    therapistName: string
    city: string
    budget: number
  }): Promise<ProductAdCampaign> {
    const { product, therapistName, city, budget } = params

    const systemPrompt = `Tu es un expert en publicité Meta pour produits thérapeutiques. Tu crées des annonces qui respectent les policies Meta tout en convertissant bien.

Les variantes:
- Testent des hooks différents (urgence, curiosité, social proof, transformation)
- Sont courtes et directes
- Incluent un CTA clair

IMPORTANT: Réponds UNIQUEMENT en JSON valide.`

    const userPrompt = `Crée une campagne publicitaire pour ce produit:

PRODUIT: ${product.title}
THÉRAPEUTE: ${therapistName}
LOCALISATION: ${city}
PRIX: €${product.price.amount}
BUDGET: €${budget}

Réponds en JSON:
{
  "adVariants": [
    {
      "headline": "Titre très court (max 30 caractères)",
      "primaryText": "Texte principal (max 125 caractères)",
      "description": "Description longue (peut être plus détaillée)",
      "ctaType": "SHOP_NOW|LEARN_MORE|SIGN_UP",
      "targetSegment": "Segment cible spécifique"
    }
  ],
  "suggestedBudget": {
    "daily": 10,
    "duration": 30
  },
  "targetingNotes": "Notes sur comment cibler (localisation, intérêts, démographies, etc)"
}`

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const data = safeJsonParse<ProductAdCampaign>(text, {
      adVariants: [],
      suggestedBudget: { daily: 0, duration: 0 },
      targetingNotes: ''
    })
    return data
  }
}
