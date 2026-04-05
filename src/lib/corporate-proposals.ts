import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalRequest {
  therapistId: string;
  clientId?: string; // existing client, or provide company info
  companyName?: string;
  industry?: string;
  companySize?: string; // "small" (1-50), "medium" (51-250), "large" (251-1000), "enterprise" (1000+)
  contactName?: string;
  contactRole?: string;
  specificNeeds?: string; // "stress management", "team cohesion", "burnout prevention"
  budget?: string; // "5000-10000€"
  preferredFormat?: string; // "workshops", "individual sessions", "program"
  employeeCount?: number;
}

export interface GeneratedProposal {
  title: string;
  executiveSummary: string;
  companyContext: string;
  proposedServices: {
    type: string;
    description: string;
    frequency: string;
    price: number;
  }[];
  methodology: string;
  timeline: { phase: string; duration: string; activities: string[] }[];
  pricing: {
    packages: {
      name: string;
      price: number;
      includes: string[];
      recommended?: boolean;
    }[];
  };
  roiAnalysis: {
    absenteeismReduction: string;
    turnoverSavings: string;
    productivityGain: string;
    totalROI: string;
  };
  proposedKPIs: {
    kpi: string;
    baseline: string;
    target: string;
    measurement: string;
  }[];
  therapistBio: string;
}

export interface ProposalStats {
  total: number;
  sent: number;
  accepted: number;
  rejected: number;
  conversionRate: number;
  avgValue: number;
}

// ============================================================================
// CONSTANTS & BENCHMARKS
// ============================================================================

const ROI_BENCHMARKS = {
  absenteeismReduction: {
    // € saved per employee per year through absenteeism reduction
    small: 2100, // 3,500 avg cost × 0.30 reduction × 2 (wellness impact)
    medium: 2100,
    large: 2500, // larger orgs benefit more from scale
    enterprise: 2800,
  },
  turnoverReduction: {
    // Cost of turnover per employee
    small: 15000, // 6 months salary, lower avg salary
    medium: 22000,
    large: 28000,
    enterprise: 35000,
  },
  productivityGain: {
    // € per employee per year
    small: 1500,
    medium: 2000,
    large: 2500,
    enterprise: 3000,
  },
  roiMultiplier: 5.5, // €5.50 return per €1 invested (WHO/Deloitte)
};

const PRICING_GUIDE = {
  workshopHourly: 800, // €800 per hour delivered workshop
  sessionHourly: 120, // €120 per individual session
  facilitationDaily: 1200, // €1200 per day facilitation
  programMonthly: 2500, // Base monthly program fee
  followUpSession: 150,
};

const COMPANY_SIZE_EMPLOYEES = {
  small: { min: 1, max: 50, avg: 25 },
  medium: { min: 51, max: 250, avg: 150 },
  large: { min: 251, max: 1000, avg: 600 },
  enterprise: { min: 1001, max: 10000, avg: 5000 },
};

// ============================================================================
// MAIN FUNCTION: Generate Proposal
// ============================================================================

export async function generateProposal(
  request: ProposalRequest
): Promise<GeneratedProposal> {
  const supabase = createClient();
  const client = new Anthropic();

  // 1. Fetch therapist profile
  const { data: therapist, error: therapistError } = await supabase
    .from("therapists")
    .select("*")
    .eq("id", request.therapistId)
    .single();

  if (therapistError || !therapist) {
    throw new Error(`Therapist not found: ${request.therapistId}`);
  }

  // 2. Fetch client data if provided
  let clientData = null;
  if (request.clientId) {
    const { data } = await supabase
      .from("corporate_clients")
      .select("*")
      .eq("id", request.clientId)
      .single();
    clientData = data;
  }

  // Build company context from request or client data
  const companyName = request.companyName || clientData?.company_name || "Entreprise";
  const industry = request.industry || clientData?.industry || "Services";
  const companySize = request.companySize || clientData?.company_size || "medium";
  const employeeCount = request.employeeCount || COMPANY_SIZE_EMPLOYEES[companySize].avg;

  // 3. Calculate ROI projections
  const roiData = calculateROI(companySize, industry, employeeCount);

  // 4. Generate pricing packages
  const services = [request.preferredFormat || "workshops", "follow-up sessions"];
  const duration = request.budget ? extractDurationFromBudget(request.budget) : "6 months";
  const { packages } = generatePricingPackages(
    services,
    duration,
    employeeCount,
    request.preferredFormat === "individual sessions" ? "monthly" : "quarterly"
  );

  // 5. Build detailed context for Claude
  const proposalContext = `
CONTEXTE ENTREPRISE:
- Entreprise: ${companyName}
- Secteur: ${industry}
- Taille: ${companySize} (≈${employeeCount} collaborateurs)
- Besoins spécifiques: ${request.specificNeeds || "Bien-être général et prévention du burnout"}
- Budget: ${request.budget || "À discuter"}
- Format préféré: ${request.preferredFormat || "Programme mixte"}

THÉRAPEUTE:
- Nom: ${therapist.name}
- Spécialité: ${therapist.specialty}
- Approche: ${therapist.approach}
- Localisation: ${therapist.city}

ROI PROJECTIONS (base ${employeeCount} collaborateurs):
- Réduction absentéisme: ${roiData.absenteeismSavings.toLocaleString("fr-FR")}€/an
- Économies turnover: ${roiData.turnoverSavings.toLocaleString("fr-FR")}€/an
- Gains productivité: ${roiData.productivityGains.toLocaleString("fr-FR")}€/an
- ROI total annuel: ${roiData.totalROI.toLocaleString("fr-FR")}€ (multiplicateur ${roiData.roiMultiplier}x)
`;

  // 6. Call Claude to generate proposal sections
  const prompt = `Tu es un expert en rédaction de propositions commerciales B2B pour des programmes de bien-être en entreprise.
Génère une proposition professionnelle, convaincante et data-driven pour un client corporate.

${proposalContext}

Génère une réponse JSON stricte avec cette structure:
{
  "title": "Titre court et percutant",
  "executiveSummary": "1 paragraphe résumé exécutif (max 4 lignes)",
  "companyContext": "Analyse du contexte de l'entreprise et des enjeux (2-3 paragraphes)",
  "methodology": "Description de l'approche et cadre thérapeutique (2 paragraphes)",
  "proposedServices": [
    { "type": "nom du service", "description": "description détaillée", "frequency": "fréquence", "price": nombre }
  ],
  "timeline": [
    { "phase": "nom phase", "duration": "durée", "activities": ["activité 1", "activité 2"] }
  ],
  "proposedKPIs": [
    { "kpi": "nom KPI", "baseline": "baseline initiale", "target": "cible", "measurement": "méthode de mesure" }
  ],
  "therapistBio": "Biographie du thérapeute incluant expériences pertinentes (150 mots)"
}

CONSIGNES:
- Ton professionnel, persuasif mais pas agressif
- Tous les montants de prix en euros
- Les KPIs doivent être mesurables et réalistes
- La timeline doit s'étendre sur 6-12 mois
- Inclure des références à la data (études, benchmarks)
- Adapter les services proposés aux besoins spécifiques mentionnés
- Proposer 3-5 services distincts avec prix détaillé`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Parse Claude response
  let generatedContent: Partial<GeneratedProposal> = {};
  if (message.content[0]?.type === "text") {
    try {
      // Extract JSON from response
      const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse Claude response:", e);
    }
  }

  // 7. Assemble final proposal with validated pricing and ROI
  const finalProposal: GeneratedProposal = {
    title: generatedContent.title || "Proposition de Programme de Bien-être",
    executiveSummary:
      generatedContent.executiveSummary ||
      "Programme tailored sur mesure pour améliorer le bien-être et la performance.",
    companyContext:
      generatedContent.companyContext ||
      `${companyName} opère dans le secteur ${industry} avec environ ${employeeCount} collaborateurs.`,
    proposedServices: generatedContent.proposedServices || [
      {
        type: "Ateliers de gestion du stress",
        description: "Sessions interactives de 2h",
        frequency: "Mensuel",
        price: 1200,
      },
    ],
    methodology:
      generatedContent.methodology ||
      "Approche intégrative combinant techniques cognitivo-comportementales et pleine conscience.",
    timeline: generatedContent.timeline || [
      {
        phase: "Diagnostic et planification",
        duration: "2 semaines",
        activities: ["Entretiens exploratoires", "Définition des objectifs"],
      },
    ],
    pricing: { packages },
    roiAnalysis: {
      absenteeismReduction: `Réduction de l'absentéisme: -${Math.round(25)}% → ${roiData.absenteeismSavings.toLocaleString("fr-FR")}€/an économisés`,
      turnoverSavings: `Réduction du turnover: -${Math.round(20)}% → ${roiData.turnoverSavings.toLocaleString("fr-FR")}€/an économisés`,
      productivityGain: `Gain de productivité: +${Math.round(12)}% → ${roiData.productivityGains.toLocaleString("fr-FR")}€/an générés`,
      totalROI: `ROI TOTAL: ${roiData.totalROI.toLocaleString("fr-FR")}€/an (multiplicateur ${roiData.roiMultiplier}x sur investissement)`,
    },
    proposedKPIs: generatedContent.proposedKPIs || [
      {
        kpi: "Taux d'absentéisme",
        baseline: "À mesurer",
        target: "-25%",
        measurement: "Données RH mensuelles",
      },
    ],
    therapistBio: generatedContent.therapistBio || therapist.bio || "",
  };

  // 8. Save to database
  const { data: saved, error: saveError } = await supabase
    .from("corporate_proposals")
    .insert([
      {
        therapist_id: request.therapistId,
        client_id: request.clientId || null,
        title: finalProposal.title,
        executive_summary: finalProposal.executiveSummary,
        company_context: finalProposal.companyContext,
        proposed_services: finalProposal.proposedServices,
        methodology: finalProposal.methodology,
        timeline: finalProposal.timeline,
        pricing: finalProposal.pricing,
        roi_analysis: finalProposal.roiAnalysis,
        therapist_bio: finalProposal.therapistBio,
        proposed_kpis: finalProposal.proposedKPIs,
        status: "draft",
        generation_prompt: prompt,
        generation_model: "claude-sonnet-4-20250514",
      },
    ])
    .select()
    .single();

  if (saveError) {
    console.error("Failed to save proposal:", saveError);
  }

  return finalProposal;
}

// ============================================================================
// Calculate ROI
// ============================================================================

export function calculateROI(
  companySize: string,
  industry: string,
  employeeCount: number = 150
): {
  absenteeismSavings: number;
  turnoverSavings: number;
  productivityGains: number;
  totalROI: number;
  roiMultiplier: number;
} {
  const size = (companySize || "medium").toLowerCase() as keyof typeof ROI_BENCHMARKS.absenteeismReduction;
  const validSize = size in ROI_BENCHMARKS.absenteeismReduction ? size : "medium";

  // Industry adjustments
  const industryMultiplier = getIndustryMultiplier(industry);

  const absenteeismBenchmark = ROI_BENCHMARKS.absenteeismReduction[validSize];
  const turnoverBenchmark = ROI_BENCHMARKS.turnoverReduction[validSize];
  const productivityBenchmark = ROI_BENCHMARKS.productivityGain[validSize];

  // Account for turnover affecting only a percentage (avg 15% turnover rate)
  const turnoverAffectedEmployees = Math.ceil(employeeCount * 0.15);

  const absenteeismSavings = Math.round(
    absenteeismBenchmark * employeeCount * industryMultiplier
  );
  const turnoverSavings = Math.round(
    turnoverBenchmark * turnoverAffectedEmployees * 0.2 * industryMultiplier
  );
  const productivityGains = Math.round(
    productivityBenchmark * employeeCount * industryMultiplier
  );

  const totalROI = Math.round(absenteeismSavings + turnoverSavings + productivityGains);

  return {
    absenteeismSavings,
    turnoverSavings,
    productivityGains,
    totalROI,
    roiMultiplier: ROI_BENCHMARKS.roiMultiplier,
  };
}

// ============================================================================
// Generate Pricing Packages
// ============================================================================

export function generatePricingPackages(
  services: string[],
  duration: string,
  groupSize: number,
  frequency: string
): { packages: GeneratedProposal["pricing"]["packages"] } {
  // Base calculation
  const isWorkshop = services.some((s) =>
    ["workshop", "atelier"].includes(s.toLowerCase())
  );
  const isIndividual = services.some((s) =>
    ["individual", "session", "séance"].includes(s.toLowerCase())
  );

  // Calculate frequency factor (how many iterations in duration)
  const frequencyFactor =
    frequency === "monthly"
      ? 6
      : frequency === "quarterly"
        ? 2
        : frequency === "weekly"
          ? 24
          : 1;

  // Essentiel package: minimal viable
  let essentialPrice = 3000;
  if (isWorkshop) {
    essentialPrice = PRICING_GUIDE.workshopHourly * 2 * frequencyFactor; // 2 workshops
  } else if (isIndividual) {
    essentialPrice = PRICING_GUIDE.sessionHourly * 10 * frequencyFactor;
  }

  // Premium package: comprehensive
  let premiumPrice = essentialPrice * 1.8;
  if (isWorkshop) {
    premiumPrice =
      PRICING_GUIDE.workshopHourly * 4 * frequencyFactor +
      PRICING_GUIDE.facilitationDaily * 2;
  } else if (isIndividual) {
    premiumPrice = PRICING_GUIDE.sessionHourly * 25 * frequencyFactor;
  }

  // Sur-mesure package: full partnership
  const customPrice = Math.round(premiumPrice * 1.5 + PRICING_GUIDE.programMonthly * 6);

  const packages: GeneratedProposal["pricing"]["packages"] = [
    {
      name: "Essentiel",
      price: Math.round(essentialPrice),
      includes: [
        "Programme introductif",
        `${Math.ceil(frequencyFactor)} sessions/ateliers`,
        "Matériel pédagogique",
        "Rapport d'impact initial",
      ],
      recommended: false,
    },
    {
      name: "Premium",
      price: Math.round(premiumPrice),
      includes: [
        "Programme complet",
        `${Math.ceil(frequencyFactor * 2)} sessions/ateliers`,
        "Suivi personnalisé",
        "Coaching d'encadrants",
        "Rapports mensuels",
        "Support continu",
      ],
      recommended: true,
    },
    {
      name: "Sur-mesure",
      price: customPrice,
      includes: [
        "Programme annuel intégral",
        "Création de modules spécifiques",
        "Accompagnement RH régulier",
        "Évaluation complète",
        "Optimisation continue",
        "Accès prioritaire au thérapeute",
      ],
      recommended: false,
    },
  ];

  return { packages };
}

// ============================================================================
// Customize Proposal
// ============================================================================

export async function customizeProposal(
  proposalId: string,
  edits: Partial<GeneratedProposal>
): Promise<GeneratedProposal> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("corporate_proposals")
    .update({
      title: edits.title,
      executive_summary: edits.executiveSummary,
      company_context: edits.companyContext,
      proposed_services: edits.proposedServices,
      methodology: edits.methodology,
      timeline: edits.timeline,
      pricing: edits.pricing,
      roi_analysis: edits.roiAnalysis,
      proposed_kpis: edits.proposedKPIs,
    })
    .eq("id", proposalId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to customize proposal: ${error.message}`);
  }

  return data as GeneratedProposal;
}

// ============================================================================
// Get Proposals
// ============================================================================

export async function getProposals(
  therapistId: string,
  options?: { status?: string; clientId?: string }
): Promise<GeneratedProposal[]> {
  const supabase = createClient();

  let query = supabase
    .from("corporate_proposals")
    .select("*")
    .eq("therapist_id", therapistId);

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.clientId) {
    query = query.eq("client_id", options.clientId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch proposals: ${error.message}`);
  }

  return data || [];
}

// ============================================================================
// Mark Proposal as Sent
// ============================================================================

export async function markProposalSent(
  proposalId: string,
  sentTo: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("corporate_proposals")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  if (error) {
    throw new Error(`Failed to mark proposal as sent: ${error.message}`);
  }
}

// ============================================================================
// Mark Proposal as Viewed
// ============================================================================

export async function markProposalViewed(proposalId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("corporate_proposals")
    .update({
      viewed_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  if (error) {
    throw new Error(`Failed to mark proposal as viewed: ${error.message}`);
  }
}

// ============================================================================
// Get Proposal Statistics
// ============================================================================

export async function getProposalStats(
  therapistId: string
): Promise<ProposalStats> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("corporate_proposals")
    .select("status, pricing")
    .eq("therapist_id", therapistId);

  if (error) {
    throw new Error(`Failed to fetch proposal stats: ${error.message}`);
  }

  const proposals = data || [];
  const total = proposals.length;
  const sent = proposals.filter((p) => p.status === "sent").length;
  const accepted = proposals.filter((p) => p.status === "accepted").length;
  const rejected = proposals.filter((p) => p.status === "rejected").length;

  // Calculate average contract value from accepted proposals
  const acceptedProposals = proposals.filter((p) => p.status === "accepted");
  const avgValue =
    acceptedProposals.length > 0
      ? acceptedProposals.reduce((sum, p) => {
          const price = p.pricing?.packages?.[1]?.price || 0;
          return sum + price;
        }, 0) / acceptedProposals.length
      : 0;

  return {
    total,
    sent,
    accepted,
    rejected,
    conversionRate: sent > 0 ? (accepted / sent) * 100 : 0,
    avgValue: Math.round(avgValue),
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getIndustryMultiplier(industry: string): number {
  // Industries with higher wellness ROI (tech, healthcare, finance tend to have higher salaries + turnover)
  const multipliers: { [key: string]: number } = {
    tech: 1.3,
    technology: 1.3,
    informatique: 1.3,
    finance: 1.25,
    "financial services": 1.25,
    santé: 1.4,
    healthcare: 1.4,
    pharmaceutique: 1.35,
    "high stress": 1.3,
    "client facing": 1.2,
  };

  const lowerIndustry = (industry || "").toLowerCase();
  for (const [key, multiplier] of Object.entries(multipliers)) {
    if (lowerIndustry.includes(key)) {
      return multiplier;
    }
  }

  return 1.0; // default
}

function extractDurationFromBudget(budget: string): string {
  // Parse budget strings like "5000-10000€" to estimate duration
  const match = budget.match(/\d+/);
  if (!match) return "6 months";

  const amount = parseInt(match[0], 10);
  if (amount < 3000) return "3 months";
  if (amount < 7000) return "6 months";
  if (amount < 15000) return "9 months";
  return "12 months";
}
