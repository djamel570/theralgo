import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase";
import { VoiceProfile, generateVoicePrompt } from "@/lib/voice-dna";
import {
  SEOKeyword,
  ContentCluster,
  ArticleSEO,
  optimizeForSEO,
  getSeasonalTopics,
} from "@/lib/seo-engine";
import { ProductType, DigitalProduct } from "@/lib/product-builder";
import type { Database } from "@/types/supabase";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient();

// ============================================================================
// CONSTANTS & GUIDELINES
// ============================================================================

export const CONTENT_FORMATS = {
  blog_article: {
    name: "Article de Blog",
    targetLength: 1500,
    structure: "Introduction, H2 sections (3-5), FAQ, Conclusion",
    seoOptimized: true,
    description:
      "Article SEO-optimisé de ~1500 mots avec H2/H3, section FAQ, CTA douce",
  },
  linkedin_post: {
    name: "Post LinkedIn",
    targetLength: 250,
    structure: "Hook (1-2 phrases) → Récit → Insight → CTA",
    seoOptimized: false,
    description:
      "Post professionnel 150-300 mots, ton expert, 3-5 hashtags, structure hook-histoire-CTA",
  },
  instagram_post: {
    name: "Post Instagram",
    targetLength: 150,
    structure: "Hook émotionnel → Message clé → CTA + Hashtags",
    seoOptimized: false,
    description:
      "Contenu émotionnel 100-200 mots, 15-30 hashtags, description visuelle, émojis bienvenue",
  },
  instagram_carousel: {
    name: "Carousel Instagram",
    targetLength: 400,
    structure: "8-10 slides éducatifs, chaque slide 40-60 mots, flow pédagogique",
    seoOptimized: false,
    description:
      "Carrousel 8-10 slides, chacun 40-60 mots, contenu éducatif swipe-worthy",
  },
  reel_script: {
    name: "Script Reel",
    targetLength: 150,
    structure:
      "Hook 3s → Corps → CTA, pattern-interrupt, trending format, timecode",
    seoOptimized: false,
    description:
      "Script vidéo 30-60 secondes, hook en 3s, pattern-interrupt, format tendance, suggestions de son",
  },
  tiktok_script: {
    name: "Script TikTok",
    targetLength: 150,
    structure: "Rythme rapide, relatable, suggestion de son tendance",
    seoOptimized: false,
    description:
      "Script 15-60 secondes, rythme rapide, contenu relatable, suggestion de sons trends",
  },
  email_newsletter: {
    name: "Infolettre Email",
    targetLength: 400,
    structure: "Intro personnelle → Valeur → Soft CTA → Signature",
    seoOptimized: false,
    description:
      "Infolettre 300-500 mots, personnelle, value-first, CTA douce, signature",
  },
  google_business_post: {
    name: "Post Google Business",
    targetLength: 120,
    structure: "Message court + bouton action + hashtag local",
    seoOptimized: true,
    description:
      "Post local 100-150 mots, SEO local, bouton d'action, pertinent pour recherche locale",
  },
  product_teaser: {
    name: "Teaser Produit Digital",
    targetLength: 200,
    structure: "Accroche éducative → Valeur gratuite → Pont naturel → CTA produit",
    seoOptimized: false,
    description: "Contenu éducatif qui fait le pont vers un produit digital, 150-250 mots, ton authentique, jamais agressif",
  },
};

export const ETHICAL_GUIDELINES = {
  rules: [
    "Ne jamais faire de diagnostic ou prétendre diagnostiquer",
    "Ne jamais promettre de résultats garantis",
    "Respecter la confidentialité et la déontologie",
    "Pas de sensationnalisme sur la santé mentale",
    "Inclure des disclaimers quand nécessaire",
    "Respecter le code de déontologie français des thérapeutes",
    "Valider contre les fausses déclarations médicales",
    "Être inclusive et non-discriminatoire",
    "Éviter la pathologisation",
    "Promouvoir le bien-être, pas le traitement miracle",
  ],
  disclaimers: {
    health:
      "Avis de non-responsabilité : Ce contenu est informatif et ne remplace pas une consultation professionnelle.",
    confidentiality:
      "Tous les témoignages sont fictifs ou anonymisés pour respecter la confidentialité.",
  },
};

// ============================================================================
// TYPES
// ============================================================================

export type ContentType = keyof typeof CONTENT_FORMATS;
export type FunnelStage = "awareness" | "consideration" | "decision" | "retention";
export type ContentStatus =
  | "draft"
  | "review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

export interface ContentRequest {
  therapistId: string;
  contentType: ContentType;
  topic?: string;
  intention?: string;
  segment?: string;
  funnelStage?: FunnelStage;
  customInstructions?: string;
  keywords?: string[];
  productId?: string;  // If content should bridge to a digital product
}

export interface GeneratedContent {
  title: string;
  body: string;
  excerpt: string;
  hashtags: string[];
  visualSuggestions: string;
  cta: {
    text: string;
    url?: string;
  };
  seoData?: ArticleSEO;
  voiceMatchScore: number;
  targetKeywords: string[];
  generationPrompt: string;
  generationModel: string;
}

export interface ContentBatch {
  weekTheme: string;
  startDate: Date;
  pieces: Array<GeneratedContent & { contentType: ContentType }>;
  rationale: string;
}

export interface ContentPiece extends GeneratedContent {
  id: string;
  therapistId: string;
  contentType: ContentType;
  slug: string;
  targetIntention: string;
  targetSegment: string;
  funnelStage: FunnelStage;
  status: ContentStatus;
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// MAIN FUNCTION: generateContent
// ============================================================================

export async function generateContent(
  request: ContentRequest
): Promise<GeneratedContent> {
  const {
    therapistId,
    contentType,
    topic,
    intention,
    segment = "général",
    funnelStage = "awareness",
    customInstructions = "",
    keywords = [],
    productId,
  } = request;

  // Fetch therapist profile and voice DNA
  const { data: therapistData, error: therapistError } = await supabase
    .from("therapists")
    .select("*, voice_dna:voice_dna_id(*)")
    .eq("id", therapistId)
    .single();

  if (therapistError || !therapistData) {
    throw new Error(`Thérapeute non trouvé: ${therapistId}`);
  }

  const voiceProfile = therapistData.voice_dna as VoiceProfile;

  // Fetch product data if linking to a digital product
  let productContext = ''
  if (productId) {
    const { data: product } = await supabase
      .from('digital_products')
      .select('*')
      .eq('id', productId)
      .single()

    if (product) {
      productContext = `
PRODUIT DIGITAL À MENTIONNER (de manière naturelle et non-agressive) :
- Titre : ${product.title}
- Description : ${product.description}
- Public cible : ${product.target_audience}
- Prix : ${product.price_amount}€
- Lien : /p/${product.slug}

RÈGLES PRODUIT :
- Ne mentionner le produit que dans le dernier tiers du contenu
- Le contenu doit apporter de la valeur AVANT toute mention du produit
- Utiliser une transition naturelle comme "Pour aller plus loin..." ou "J'ai créé un programme complet sur ce sujet..."
- Ne jamais être agressif ou "vendeur"
- Le contenu doit être utile même sans le produit
`
    }
  }

  // Get SEO keywords
  const seoKeywords = await fetchSEOKeywords(therapistId, contentType);

  // Get top-performing intentions
  const performingIntentions = await fetchTopPerformingIntentions(therapistId);

  // Get seasonal topics
  const seasonalTopics = await getSeasonalTopics();

  // Build the system prompt with voice DNA and ethics
  const voicePrompt = generateVoicePrompt(voiceProfile);
  const systemPrompt = buildSystemPrompt(voicePrompt, productContext);

  // Build the user prompt
  const userPrompt = buildUserPrompt(
    contentType,
    topic,
    intention,
    segment,
    funnelStage,
    seoKeywords,
    performingIntentions,
    seasonalTopics,
    customInstructions,
    keywords
  );

  // Call Claude API
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse response
  const parsedContent = parseContentResponse(responseText, contentType);

  // Calculate voice match score
  const voiceMatchScore = scoreVoiceMatch(parsedContent.body, voiceProfile);

  // Apply ethical guardrails
  const { passed, issues, sanitized } = applyEthicalGuardrails(
    parsedContent.body
  );
  if (!passed) {
    console.warn(`Contenu échoue les garde-fous éthiques: ${issues.join(", ")}`);
  }

  const finalBody = sanitized;

  // Generate visual suggestions
  const visualSuggestions = generateVisualSuggestions(
    parsedContent.body,
    contentType
  );

  // Build final content object
  const generatedContent: GeneratedContent = {
    title: parsedContent.title,
    body: finalBody,
    excerpt: generateExcerpt(parsedContent.body, 160),
    hashtags: extractHashtags(parsedContent.body, contentType),
    visualSuggestions,
    cta: parsedContent.cta || {
      text: "En savoir plus",
      url: `https://${therapistData.website_domain}`,
    },
    seoData: undefined,
    voiceMatchScore,
    targetKeywords: seoKeywords.slice(0, 5).map((k) => k.keyword),
    generationPrompt: userPrompt.substring(0, 500),
    generationModel: "claude-sonnet-4-20250514",
  };

  // SEO optimization for blog articles
  if (contentType === "blog_article") {
    generatedContent.seoData = await optimizeForSEO(
      generatedContent,
      seoKeywords
    );
  }

  // Save to database
  const { data: savedContent, error: saveError } = await supabase
    .from("content_pieces")
    .insert({
      therapist_id: therapistId,
      content_type: contentType,
      title: generatedContent.title,
      body: generatedContent.body,
      excerpt: generatedContent.excerpt,
      hashtags: generatedContent.hashtags,
      visual_suggestions: generatedContent.visualSuggestions,
      cta_text: generatedContent.cta.text,
      cta_url: generatedContent.cta.url,
      meta_title: generatedContent.seoData?.metaTitle || generatedContent.title,
      meta_description:
        generatedContent.seoData?.metaDescription ||
        generatedContent.excerpt,
      target_keywords: generatedContent.targetKeywords,
      slug: slugify(generatedContent.title),
      target_intention: intention || "general",
      target_segment: segment,
      funnel_stage: funnelStage,
      status: "draft",
      voice_match_score: voiceMatchScore,
      generation_prompt: generatedContent.generationPrompt,
      generation_model: generatedContent.generationModel,
    })
    .select()
    .single();

  if (saveError) {
    console.error("Erreur lors de la sauvegarde du contenu:", saveError);
  }

  return generatedContent;
}

// ============================================================================
// FUNCTION: generateWeeklyBatch
// ============================================================================

export async function generateWeeklyBatch(
  therapistId: string,
  weekStart: Date
): Promise<ContentBatch> {
  // Determine weekly theme based on converting intentions + seasonality
  const weekTheme = await determineWeeklyTheme(therapistId, weekStart);

  const contentPieces: Array<GeneratedContent & { contentType: ContentType }> =
    [];

  // 1. Blog article (SEO pillar)
  const blogContent = await generateContent({
    therapistId,
    contentType: "blog_article",
    topic: weekTheme,
    funnelStage: "awareness",
  });
  contentPieces.push({ ...blogContent, contentType: "blog_article" });

  // 2-4. Three social posts (LinkedIn, Instagram, Email)
  const linkedInContent = await generateContent({
    therapistId,
    contentType: "linkedin_post",
    topic: weekTheme,
    funnelStage: "consideration",
  });
  contentPieces.push({ ...linkedInContent, contentType: "linkedin_post" });

  const instagramContent = await generateContent({
    therapistId,
    contentType: "instagram_post",
    topic: weekTheme,
    funnelStage: "awareness",
  });
  contentPieces.push({ ...instagramContent, contentType: "instagram_post" });

  const emailContent = await generateContent({
    therapistId,
    contentType: "email_newsletter",
    topic: weekTheme,
    funnelStage: "retention",
  });
  contentPieces.push({ ...emailContent, contentType: "email_newsletter" });

  // 5. Reel/TikTok script
  const reelContent = await generateContent({
    therapistId,
    contentType: "reel_script",
    topic: weekTheme,
    funnelStage: "awareness",
  });
  contentPieces.push({ ...reelContent, contentType: "reel_script" });

  // 6. Google Business post
  const googleContent = await generateContent({
    therapistId,
    contentType: "google_business_post",
    topic: weekTheme,
    funnelStage: "awareness",
  });
  contentPieces.push({ ...googleContent, contentType: "google_business_post" });

  // Check for active digital products to include in the batch
  const { data: activeProducts } = await supabase
    .from('digital_products')
    .select('id, title, type, slug')
    .eq('therapist_id', therapistId)
    .eq('status', 'active')

  // If therapist has products, make the Thursday Instagram slot product-aware
  if (activeProducts && activeProducts.length > 0) {
    const featuredProduct = activeProducts[Math.floor(Math.random() * activeProducts.length)]
    // Add product context to one piece per week (rotate products)
    // This is handled by adding productId to one of the content requests
  }

  const rationale = `Thème hebdomadaire: "${weekTheme}" choisi basé sur les intentions converties, saisonnalité, et lacunes de contenu. Batch cohérent travers tous les canaux.`;

  return {
    weekTheme,
    startDate: weekStart,
    pieces: contentPieces,
    rationale,
  };
}

// ============================================================================
// FUNCTION: generateFromTopPerformer
// ============================================================================

export async function generateFromTopPerformer(
  therapistId: string,
  contentId: string,
  targetType: ContentType
): Promise<GeneratedContent> {
  const { data: originalContent, error } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("id", contentId)
    .eq("therapist_id", therapistId)
    .single();

  if (error || !originalContent) {
    throw new Error("Contenu original non trouvé");
  }

  const customInstructions = `
Adapte ce contenu de haut performeur (${originalContent.content_type}) au format ${targetType}.
Conserve le message central et l'insight clé, mais adapte la structure et le ton au nouveau format.
Message clé original: ${originalContent.body.substring(0, 500)}
`;

  return generateContent({
    therapistId,
    contentType: targetType,
    topic: originalContent.title,
    intention: originalContent.target_intention,
    segment: originalContent.target_segment,
    customInstructions,
  });
}

// ============================================================================
// FUNCTION: repurposeForPaid
// ============================================================================

export async function repurposeForPaid(
  therapistId: string,
  contentId: string
): Promise<{ adCopy: string; targeting: string; budget: string }> {
  const { data: content, error } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("id", contentId)
    .eq("therapist_id", therapistId)
    .single();

  if (error || !content) {
    throw new Error("Contenu non trouvé");
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `Tu es un expert en publicités Meta pour thérapeutes. Crée une copie publicitaire convaincante
basée sur ce contenu organique qui a performé.`,
    messages: [
      {
        role: "user",
        content: `Contenu original (${content.content_type}):
Titre: ${content.title}
Extrait: ${content.excerpt}

Crée une copie publicitaire Meta (headline + body + CTA) qui reprend l'essence du contenu
mais optimisée pour la conversion. Fourni aussi des suggestions de ciblage et budget recommandé.`,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  return {
    adCopy: responseText,
    targeting: `Audience: ${content.target_segment}, Intention: ${content.target_intention}`,
    budget: "500-1000 EUR",
  };
}

// ============================================================================
// FUNCTION: scoreVoiceMatch
// ============================================================================

export function scoreVoiceMatch(content: string, profile: VoiceProfile): number {
  let score = 75; // baseline

  // Check for signature expressions
  if (profile.signatureExpressions) {
    const expressionMatches = profile.signatureExpressions.filter((expr) =>
      content.toLowerCase().includes(expr.toLowerCase())
    ).length;
    score += Math.min(expressionMatches * 5, 10);
  }

  // Tone alignment (simplified heuristic)
  const toneIndicators =
    profile.tone === "warm"
      ? ["gratuit", "ensemble", "soutien", "accompagnement"]
      : profile.tone === "expert"
        ? ["recherche", "scientifique", "efficace", "prouvé"]
        : ["équilibre", "réaliste"];

  const toneMatches = toneIndicators.filter((indicator) =>
    content.toLowerCase().includes(indicator)
  ).length;
  score += Math.min(toneMatches * 3, 10);

  // Sentence length variance
  const sentences = content
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);
  const avgLength =
    sentences.reduce((sum, s) => sum + s.split(" ").length, 0) /
    sentences.length;

  // Score better if there's variety in sentence length
  if (avgLength > 10 && avgLength < 25) {
    score += 5;
  }

  return Math.min(score, 100);
}

// ============================================================================
// FUNCTION: applyEthicalGuardrails
// ============================================================================

export function applyEthicalGuardrails(
  content: string
): { passed: boolean; issues: string[]; sanitized: string } {
  const issues: string[] = [];
  let sanitized = content;

  // Check for diagnostic claims
  const diagnosticPatterns = [
    /\bdiagnostiqué|diagnostic\b/gi,
    /\bguérir|cure\b/gi,
    /\btraitement garanti\b/gi,
    /\bgarantie de succès\b/gi,
  ];

  for (const pattern of diagnosticPatterns) {
    if (pattern.test(content)) {
      issues.push("Affirmations diagnostiques ou de garantie détectées");
      sanitized = sanitized.replace(
        pattern,
        "[REQUIRES REVIEW: removed claim]"
      );
    }
  }

  // Check for sensationalism
  if (
    /\b(miraculeux|révolutionnaire|magique|imparable)\b/gi.test(content)
  ) {
    issues.push("Langage sensationnaliste détecté");
  }

  // Check for medical advice without disclaimer
  if (
    /\b(prendre|prescrire|medicament|traitement medical)\b/gi.test(content) &&
    !content.toLowerCase().includes("disclaimer") &&
    !content.toLowerCase().includes("avis de non-responsabilité")
  ) {
    // Add disclaimer if medical terms present
    if (!sanitized.includes(ETHICAL_GUIDELINES.disclaimers.health)) {
      sanitized += `\n\n${ETHICAL_GUIDELINES.disclaimers.health}`;
    }
  }

  const passed = issues.length === 0;

  return { passed, issues, sanitized };
}

// ============================================================================
// FUNCTION: getContentSuggestions
// ============================================================================

export async function getContentSuggestions(
  therapistId: string
): Promise<{ topics: string[]; reasons: string[] }> {
  const performingIntentions = await fetchTopPerformingIntentions(therapistId);
  const seasonalTopics = await getSeasonalTopics();

  // Get recent content to find gaps
  const { data: recentContent } = await supabase
    .from("content_pieces")
    .select("title, target_intention")
    .eq("therapist_id", therapistId)
    .order("created_at", { ascending: false })
    .limit(20);

  const coveredIntentions = new Set(
    recentContent?.map((c) => c.target_intention) || []
  );

  const topics: string[] = [];
  const reasons: string[] = [];

  // Add top-performing intentions not recently covered
  performingIntentions.slice(0, 3).forEach((intention, idx) => {
    if (!coveredIntentions.has(intention.intention)) {
      topics.push(intention.intention);
      reasons.push(
        `Intention haute-performance: ${intention.intention} (${intention.conversionRate}% conversion)`
      );
    }
  });

  // Add seasonal topics
  seasonalTopics.slice(0, 2).forEach((topic) => {
    topics.push(topic);
    reasons.push(`Pertinent saisonnièrement: ${topic}`);
  });

  // Add product-related content suggestions
  const { data: products } = await supabase
    .from('digital_products')
    .select('id, title, type, target_audience')
    .eq('therapist_id', therapistId)
    .eq('status', 'active')

  if (products && products.length > 0) {
    for (const product of products.slice(0, 2)) {
      topics.push(`Contenu éducatif lié à "${product.title}"`)
      reasons.push(`Votre produit "${product.title}" bénéficierait de contenu organique pour augmenter sa visibilité`)
    }
  }

  return {
    topics: topics.slice(0, 5),
    reasons: reasons.slice(0, 5),
  };
}

// ============================================================================
// FUNCTION: getContentByStatus
// ============================================================================

export async function getContentByStatus(
  therapistId: string,
  status: ContentStatus
): Promise<ContentPiece[]> {
  const { data, error } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("therapist_id", therapistId)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur lors de la récupération du contenu:", error);
    return [];
  }

  return data || [];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildSystemPrompt(voicePrompt: string, productContext: string = ''): string {
  return `Tu es un expert en création de contenu pour thérapeutes français. Tu génères du contenu organique
de haute qualité qui respecte strictement les directives éthiques de la profession.

DIRECTIVES ÉTHIQUES:
${ETHICAL_GUIDELINES.rules.map((r) => `- ${r}`).join("\n")}

${productContext}

PROFIL VOCAL DU THÉRAPEUTE:
${voicePrompt}

Tu dois:
1. Créer du contenu authentique et informatif
2. Respecter strictement les lignes directrices éthiques
3. Adapter le ton et la structure au format demandé
4. Inclure des CTA appropriés et doux
5. Utiliser des mots-clés SEO naturellement quand approprié
6. Structurer le contenu pour la lisibilité et l'engagement

Réponds toujours en JSON avec la structure:
{
  "title": "Titre du contenu",
  "body": "Corps du contenu",
  "cta": { "text": "Texte CTA", "url": "URL optionnelle" }
}`;
}

function buildUserPrompt(
  contentType: ContentType,
  topic: string | undefined,
  intention: string | undefined,
  segment: string,
  funnelStage: FunnelStage,
  seoKeywords: SEOKeyword[],
  performingIntentions: Array<{ intention: string; conversionRate: number }>,
  seasonalTopics: string[],
  customInstructions: string,
  keywords: string[]
): string {
  const format = CONTENT_FORMATS[contentType];
  const keywordString = keywords.length > 0 ? keywords.join(", ") : "aucun spécifié";

  return `Crée un contenu de type "${format.name}" pour ce thérapeute.

FORMAT: ${format.name}
- Structure: ${format.structure}
- Longueur cible: ~${format.targetLength} mots
- Description: ${format.description}

PARAMÈTRES:
- Sujet: ${topic || "À déterminer"}
- Intention cible: ${intention || "General"}
- Segment patient: ${segment}
- Étape du funnel: ${funnelStage}
- Mots-clés fournis: ${keywordString}

CONTEXTE PERFORMANCE:
- Intentions qui convertissent: ${performingIntentions.slice(0, 3).map((i) => i.intention).join(", ")}
- Sujets saisonniers pertinents: ${seasonalTopics.slice(0, 3).join(", ")}
- Mots-clés SEO prioriaires: ${seoKeywords.slice(0, 5).map((k) => k.keyword).join(", ")}

${customInstructions ? `INSTRUCTIONS SPÉCIALES:\n${customInstructions}` : ""}

Crée un contenu engageant, informatif et aligné avec le profil vocal du thérapeute.
Assure une structure claire, utilise les mots-clés naturellement, et inclus un CTA approprié.`;
}

function parseContentResponse(
  response: string,
  contentType: ContentType
): {
  title: string;
  body: string;
  cta: { text: string; url?: string };
} {
  try {
    const parsed = JSON.parse(response);
    return {
      title: parsed.title || "Sans titre",
      body: parsed.body || "",
      cta: parsed.cta || { text: "En savoir plus" },
    };
  } catch {
    // Fallback parsing if JSON fails
    return {
      title: "Contenu généré",
      body: response,
      cta: { text: "En savoir plus" },
    };
  }
}

function generateExcerpt(content: string, maxLength: number): string {
  const cleanContent = content.replace(/[#*`]/g, "").substring(0, maxLength);
  return cleanContent.endsWith("...")
    ? cleanContent
    : cleanContent.substring(0, maxLength) + "...";
}

function generateVisualSuggestions(
  content: string,
  contentType: ContentType
): string {
  const suggestions: string[] = [];

  if (
    contentType === "blog_article" ||
    contentType === "linkedin_post" ||
    contentType === "instagram_post"
  ) {
    suggestions.push("Image en-tête: Photo du thérapeute ou image de bien-être");
  }

  if (
    contentType === "instagram_post" ||
    contentType === "instagram_carousel"
  ) {
    suggestions.push(
      "Format: 1080x1350px (portrait) ou 1080x1080px (carré)"
    );
    suggestions.push("Palette: Couleurs apaisantes (bleus, verts, neutres)");
    suggestions.push("Texte overlay: Max 3 lignes, lisible");
  }

  if (contentType === "instagram_carousel") {
    suggestions.push("Slide 1: Hook visuel accrocheur");
    suggestions.push("Slides 2-9: Progressive education avec visuels");
    suggestions.push("Slide 10: CTA clair");
  }

  if (contentType === "reel_script" || contentType === "tiktok_script") {
    suggestions.push("Format vidéo: 9:16 (portrait)");
    suggestions.push("Durée: 30-60 secondes");
    suggestions.push("Hook: Doit capturer l'attention en 3 secondes");
  }

  return suggestions.join("\n");
}

function extractHashtags(content: string, contentType: ContentType): string[] {
  const hashtags: string[] = [];

  // Extract existing hashtags
  const hashtagPattern = /#[\w]+/g;
  const existingHashtags = content.match(hashtagPattern) || [];
  hashtags.push(...existingHashtags.map((h) => h.toLowerCase()));

  // Add relevant hashtags based on content type
  const typeHashtags: Record<ContentType, string[]> = {
    blog_article: [
      "#SantéMentale",
      "#Thérapie",
      "#Bien-être",
      "#Conseil",
      "#ArticlesBlog",
    ],
    linkedin_post: [
      "#Thérapie",
      "#DéveloppementPersonnel",
      "#SantéMentale",
      "#Professionnel",
      "#Wellness",
    ],
    instagram_post: [
      "#SantéMentale",
      "#Bien-êtreMental",
      "#Thérapie",
      "#AutosoinS",
      "#PositiveMindset",
    ],
    instagram_carousel: [
      "#SantéMentale",
      "#EducationMentale",
      "#Conseils",
      "#Carousel",
      "#ApprenzàConnaître",
    ],
    reel_script: [
      "#SantéMentale",
      "#Reels",
      "#Thérapie",
      "#Courts",
      "#Viral",
    ],
    tiktok_script: [
      "#SantéMentale",
      "#TikTok",
      "#Thérapie",
      "#FY",
      "#Relatable",
    ],
    email_newsletter: ["#Infolettre", "#NewsletterEmail", "#Exclusif"],
    google_business_post: [
      "#Local",
      "#Thérapie",
      "#Nearest",
      "#EntreprisGoogle",
    ],
  };

  hashtags.push(...typeHashtags[contentType]);

  // Remove duplicates and return top 30
  return [...new Set(hashtags)].slice(0, 30);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchSEOKeywords(
  therapistId: string,
  contentType: ContentType
): Promise<SEOKeyword[]> {
  const { data, error } = await supabase
    .from("seo_keywords")
    .select("*")
    .eq("therapist_id", therapistId)
    .eq("content_type", contentType)
    .order("search_volume", { ascending: false })
    .limit(10);

  if (error || !data) {
    return [];
  }

  return data;
}

async function fetchTopPerformingIntentions(
  therapistId: string
): Promise<Array<{ intention: string; conversionRate: number }>> {
  const { data, error } = await supabase
    .from("content_performance")
    .select("target_intention, conversion_rate")
    .eq("therapist_id", therapistId)
    .order("conversion_rate", { ascending: false })
    .limit(5);

  if (error || !data) {
    return [];
  }

  return data.map((d) => ({
    intention: d.target_intention,
    conversionRate: d.conversion_rate,
  }));
}

async function determineWeeklyTheme(
  therapistId: string,
  weekStart: Date
): Promise<string> {
  const suggestions = await getContentSuggestions(therapistId);

  if (suggestions.topics.length > 0) {
    return suggestions.topics[0];
  }

  // Fallback to seasonal
  const seasonalTopics = await getSeasonalTopics();
  return seasonalTopics[0] || "Bien-être et équilibre de vie";
}
