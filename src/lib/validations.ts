import { z } from 'zod'

// ============ Campaign Schemas ============

export const CampaignGenerateSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
})

export const TargetingPlanSchema = z.object({
  segments: z.array(z.string()).optional(),
  creative_plan: z.object({
    hooks: z.array(z.string()).optional(),
    cta: z.string().optional(),
  }).optional(),
  campaign_structure: z.array(z.object({
    name: z.string().optional(),
    daily_budget: z.number().positive().optional(),
    hooks_to_test: z.array(z.string()).optional(),
  })).optional(),
})

export const CampaignDeploySchema = z.object({
  campaignId: z.string().min(1, 'campaignId is required'),
  targetingPlan: TargetingPlanSchema.optional(),
  autoActivate: z.boolean().optional(),
  adAccountId: z.string().optional(),
  pixelId: z.string().optional(),
})

export const CampaignMonitorSchema = z.object({
  campaignId: z.string().optional(),
})

// ============ Targeting Diagnostic Schemas ============

export const DiagnosticDataSchema = z.object({
  has_pixel: z.boolean(),
  has_capi: z.boolean(),
  has_landing_page: z.boolean(),
  landing_page_url: z.string().optional(),
  form_type: z.enum(['native_meta', 'website_form', 'calendly', 'doctolib', 'other']),
  has_crm: z.boolean(),
  crm_name: z.string().optional(),
  existing_events: z.array(z.string()),
  current_lead_source: z.array(z.string()),
  monthly_budget: z.number().nonnegative(),
  main_objective: z.enum(['leads', 'calls', 'appointments', 'workshops', 'other']),
})

export const TargetingDiagnosticSchema = z.object({
  profileId: z.string().min(1, 'profileId is required'),
  therapistData: DiagnosticDataSchema,
})

// ============ Targeting Intentions Schemas ============

export const ProfileDataSchema = z.object({
  specialty: z.string().min(1),
  city: z.string().min(1),
  main_problem_solved: z.string().optional(),
  patient_transformation: z.string().optional(),
  ideal_patient_profile: z.string().optional(),
  approach_description: z.string().optional(),
})

export const TargetingIntentionsSchema = z.object({
  profileId: z.string().min(1, 'profileId is required'),
  diagnosticResult: z.object({
    signal_score: z.number().optional(),
    maturity_level: z.string().optional(),
    gaps: z.array(z.any()).optional(),
  }).optional(),
  specialtyKey: z.string().optional(),
})

// ============ Targeting Creatives Schemas ============

export const SegmentSchema = z.object({
  name: z.string(),
  description: z.string(),
  temperature: z.enum(['cold', 'warm', 'hot']),
  media_priority: z.enum(['high', 'medium', 'low']),
  example_situations: z.array(z.string()),
})

export const TargetingCreativesSchema = z.object({
  profileId: z.string().min(1, 'profileId is required'),
  intentions: z.array(SegmentSchema),
  specialtyKey: z.string().optional(),
})

// ============ Targeting Structure Schemas ============

export const DiagnosticSchema = z.object({
  signal_score: z.number().optional(),
  maturity_level: z.string().optional(),
})

export const CreativeItemSchema = z.object({
  segment_name: z.string(),
  hooks: z.array(z.string()),
  promises: z.array(z.string()),
  angles: z.object({
    educational: z.string(),
    transformation: z.string(),
    reassurance: z.string(),
  }),
})

export const TargetingStructureSchema = z.object({
  profileId: z.string().min(1, 'profileId is required'),
  intentions: z.array(SegmentSchema),
  creatives: z.array(CreativeItemSchema),
  budget: z.number().positive(),
})

// ============ Targeting Generate Orchestrator Schema ============

export const TargetingGenerateSchema = z.object({
  profileId: z.string().min(1, 'profileId is required'),
  profileData: ProfileDataSchema,
  diagnosticData: DiagnosticDataSchema,
  budget: z.number().positive('budget must be greater than 0'),
  generateFunnelVariants: z.boolean().optional().default(false),
  generateVideoScripts: z.boolean().optional().default(false),
})

// ============ Lead Capture Schema ============

export const LeadCaptureSchema = z.object({
  campaignId: z.string().min(1, 'campaignId is required'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'name is required'),
  phone: z.string().optional(),
  message: z.string().optional(),
  specialtyKey: z.string().optional(),
  qualificationAnswers: z.record(z.any()).optional(),
})

// ============ Lead Status Update Schema ============

export const LeadStatusUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'archived']),
})

// ============ Alert Schemas ============

export const AlertSendSchema = z.object({
  level: z.enum(['info', 'warning', 'critical']).default('info'),
  title: z.string().min(1, 'title is required'),
  message: z.string().min(1, 'message is required'),
  details: z.record(z.any()).optional(),
  source: z.string().min(1, 'source is required'),
  campaign_id: z.string().optional(),
  therapist_name: z.string().optional(),
  channels: z.array(z.enum(['webhook', 'database', 'email'])).optional(),
})

export const AlertListQuerySchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
  level: z.string().optional(),
  is_read: z.boolean().optional(),
  source: z.string().optional(),
})

export const AlertUpdateSchema = z.object({
  alert_ids: z.array(z.string()).min(1),
  is_read: z.boolean(),
})

// ============ Landing Page Schemas ============

export const LandingGenerateSlugSchema = z.object({
  name: z.string().min(1, 'name is required'),
  specialty: z.string().min(1, 'specialty is required'),
  city: z.string().min(1, 'city is required'),
})

export const FAQItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
})

export const LandingConfigSchema = z.object({
  show_video: z.boolean().optional(),
  show_testimonials: z.boolean().optional(),
  custom_colors: z.object({
    primary: z.string().optional(),
    accent: z.string().optional(),
  }).optional(),
  cta_text: z.string().optional(),
  faq_items: z.array(FAQItemSchema).optional(),
})

export const LandingConfigureSchema = z.object({
  profileId: z.string().min(1, 'profileId is required'),
  config: LandingConfigSchema,
})

// ============ Signal Tracking Schemas ============

export const TrackSignalSchema = z.object({
  sessionId: z.string().min(1, 'sessionId required'),
  campaignId: z.string().min(1, 'campaignId required'),
  eventType: z.string().min(1, 'eventType required'),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.number().positive().optional(),
})

// ============ Product Schemas ============

export const ProductSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string().min(1, 'title is required'),
  slug: z.string().min(1, 'slug is required'),
  description: z.string().optional(),
  price: z.number().positive('price must be greater than 0'),
  compare_at_price: z.number().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  stripe_product_id: z.string().optional(),
  stripe_price_id: z.string().optional(),
  content: z.object({
    hero_headline: z.string().optional(),
    hero_subheadline: z.string().optional(),
    hero_image_url: z.string().optional(),
    pain_points: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    modules: z.array(z.object({
      title: z.string(),
      description: z.string(),
      items: z.array(z.string()).optional(),
    })).optional(),
    guarantee_text: z.string().optional(),
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

export const ProductCreateSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
  price: z.number().positive('price must be greater than 0'),
  compare_at_price: z.number().optional(),
  content: z.object({
    hero_headline: z.string().optional(),
    hero_subheadline: z.string().optional(),
    hero_image_url: z.string().optional(),
    pain_points: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    modules: z.array(z.object({
      title: z.string(),
      description: z.string(),
      items: z.array(z.string()).optional(),
    })).optional(),
    guarantee_text: z.string().optional(),
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
  }).optional(),
})

export const ProductPublishSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
})

export const CheckoutSessionSchema = z.object({
  priceId: z.string().min(1, 'priceId is required'),
  productSlug: z.string().min(1, 'productSlug is required'),
  successUrl: z.string().url('successUrl must be a valid URL'),
  cancelUrl: z.string().url('cancelUrl must be a valid URL'),
  customerEmail: z.string().email().optional(),
})

export const PurchaseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  product_id: z.string(),
  stripe_session_id: z.string(),
  customer_email: z.string().email(),
  amount_paid: z.number(),
  status: z.enum(['completed', 'pending', 'failed']),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
})

// ============ Corporate Wellness Schemas ============

export const CorporateClientCreateSchema = z.object({
  companyName: z.string().min(1, 'companyName is required'),
  industry: z.string().optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  contactName: z.string().min(1, 'contactName is required'),
  contactRole: z.string().optional(),
  contactEmail: z.string().email('Invalid email format'),
  contactPhone: z.string().optional(),
})

export const CorporateClientUpdateStatusSchema = z.object({
  clientId: z.string().min(1, 'clientId is required'),
  status: z.enum(['prospect', 'onboarding', 'active', 'paused', 'archived']),
  notes: z.string().optional(),
})

export const ProposalRequestSchema = z.object({
  clientId: z.string().min(1, 'clientId is required'),
  proposalType: z.enum(['wellness_program', 'stress_management', 'mental_health', 'burnout_prevention']).optional(),
  employeeCount: z.number().int().positive().optional(),
  proposalScope: z.string().optional(),
})

export const ProposalUpdateSchema = z.object({
  proposalId: z.string().min(1, 'proposalId is required'),
  action: z.enum(['send', 'customize']),
  edits: z.record(z.unknown()).optional(),
  sentTo: z.string().email().optional(),
})

export const CorporateSessionCreateSchema = z.object({
  clientId: z.string().min(1, 'clientId is required'),
  title: z.string().min(1, 'title is required'),
  sessionType: z.enum(['workshop', 'webinar', 'consultation', 'training']),
  description: z.string().optional(),
  scheduledDate: z.string().datetime(),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().int().positive(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  maxParticipants: z.number().int().positive().optional(),
  sessionRate: z.number().positive().optional(),
  templateId: z.string().optional(),
})

export const CorporateSessionUpdateSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  status: z.enum(['scheduled', 'completed', 'cancelled']),
  attended_count: z.number().int().nonnegative().optional(),
  feedback: z.string().optional(),
})

export const CorporateReportGenerateSchema = z.object({
  clientId: z.string().min(1, 'clientId is required'),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  reportType: z.enum(['summary', 'detailed', 'roi_analysis']).optional(),
})

export const AssessmentCreateSchema = z.object({
  clientId: z.string().min(1, 'clientId is required'),
  sessionId: z.string().optional(),
  type: z.enum(['stress', 'burnout', 'wellbeing', 'engagement']),
})

export const AssessmentSubmitSchema = z.object({
  assessmentId: z.string().min(1, 'assessmentId is required'),
  responses: z.record(z.unknown()),
  scores: z.object({
    overall: z.number().min(0).max(100).optional(),
    category_scores: z.record(z.number()).optional(),
  }).optional(),
})

// ============ Type Exports ============

export type CampaignGenerate = z.infer<typeof CampaignGenerateSchema>
export type CampaignDeploy = z.infer<typeof CampaignDeploySchema>
export type CampaignMonitor = z.infer<typeof CampaignMonitorSchema>
export type TargetingDiagnostic = z.infer<typeof TargetingDiagnosticSchema>
export type TargetingIntentions = z.infer<typeof TargetingIntentionsSchema>
export type TargetingCreatives = z.infer<typeof TargetingCreativesSchema>
export type TargetingStructure = z.infer<typeof TargetingStructureSchema>
export type TargetingGenerate = z.infer<typeof TargetingGenerateSchema>
export type LeadCapture = z.infer<typeof LeadCaptureSchema>
export type LeadStatusUpdate = z.infer<typeof LeadStatusUpdateSchema>
export type AlertSend = z.infer<typeof AlertSendSchema>
export type AlertListQuery = z.infer<typeof AlertListQuerySchema>
export type AlertUpdate = z.infer<typeof AlertUpdateSchema>
export type LandingGenerateSlug = z.infer<typeof LandingGenerateSlugSchema>
export type LandingConfigure = z.infer<typeof LandingConfigureSchema>
export type Product = z.infer<typeof ProductSchema>
export type ProductCreate = z.infer<typeof ProductCreateSchema>
export type ProductPublish = z.infer<typeof ProductPublishSchema>
export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>
export type Purchase = z.infer<typeof PurchaseSchema>
export type CorporateClientCreate = z.infer<typeof CorporateClientCreateSchema>
export type CorporateClientUpdateStatus = z.infer<typeof CorporateClientUpdateStatusSchema>
export type ProposalRequest = z.infer<typeof ProposalRequestSchema>
export type ProposalUpdate = z.infer<typeof ProposalUpdateSchema>
export type CorporateSessionCreate = z.infer<typeof CorporateSessionCreateSchema>
export type CorporateSessionUpdate = z.infer<typeof CorporateSessionUpdateSchema>
export type CorporateReportGenerate = z.infer<typeof CorporateReportGenerateSchema>
export type AssessmentCreate = z.infer<typeof AssessmentCreateSchema>
export type AssessmentSubmit = z.infer<typeof AssessmentSubmitSchema>
