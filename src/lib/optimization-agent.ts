/**
 * Theralgo Optimization Agent
 *
 * Autonomous agent that monitors active Meta campaigns and makes
 * data-driven decisions: pause underperformers, scale winners,
 * rotate creatives, and alert operators.
 *
 * Decision rules are configurable and based on industry benchmarks
 * for therapist/wellness Meta campaigns.
 */

import { MetaMarketingAPI } from './meta-api'
import { logger } from './logger'
import { z } from 'zod'

// Safe JSON parsing helper
function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}

// ─── Configuration & Thresholds ───────────────────────
export interface AgentConfig {
  // Minimum data before making decisions
  minImpressions: number        // default: 500
  minSpend: number              // default: 10 (EUR)
  learningPeriodDays: number    // default: 3

  // Performance thresholds for therapist campaigns
  maxCPL: number                // max cost per lead in EUR (default: 50)
  minCTR: number                // minimum CTR % (default: 0.8)
  maxCPC: number                // max cost per click in EUR (default: 3)

  // Scaling rules
  scaleBudgetIncrement: number  // % to increase budget (default: 20)
  maxDailyBudget: number        // max daily budget per adset in EUR (default: 50)

  // Creative fatigue
  creativeFatigueThreshold: number // CTR drop % to trigger rotation (default: 30)

  // Additional thresholds
  minROAS?: number              // minimum ROAS (default: 1.5)
  minDataPoints?: number        // min data points before deciding (default: 20)
  pauseThreshold?: number       // performance score to pause (default: 0.3)
}

// Zod validation schema for agent config
export const AgentConfigSchema = z.object({
  minImpressions: z.number().int().positive().default(500),
  minSpend: z.number().positive().default(10),
  learningPeriodDays: z.number().int().positive().default(3),
  maxCPL: z.number().positive().default(50),
  minCTR: z.number().positive().default(0.8),
  maxCPC: z.number().positive().default(3),
  scaleBudgetIncrement: z.number().positive().default(20),
  maxDailyBudget: z.number().positive().default(5000),
  creativeFatigueThreshold: z.number().positive().default(30),
  minROAS: z.number().positive().optional().default(1.5),
  minDataPoints: z.number().int().positive().optional().default(20),
  pauseThreshold: z.number().positive().optional().default(0.3),
})

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  minImpressions: 500,
  minSpend: 10,
  learningPeriodDays: 3,
  maxCPL: 50,
  minCTR: 0.8,
  maxCPC: 3,
  scaleBudgetIncrement: 20,
  maxDailyBudget: 5000, // in cents = 50 EUR
  creativeFatigueThreshold: 30,
}

// ─── Decision Types ───────────────────────────────────
export type DecisionType =
  | 'pause_adset'       // Pause an underperforming ad set
  | 'scale_adset'       // Increase budget on a winning ad set
  | 'pause_ad'          // Pause a specific underperforming ad
  | 'pause_campaign'    // Pause entire campaign (all adsets bad)
  | 'alert_operator'    // Flag for human review
  | 'no_action'         // Not enough data or performing within bounds
  | 'creative_fatigue'  // Creative needs rotation

export interface AgentDecision {
  type: DecisionType
  entity_type: 'campaign' | 'adset' | 'ad'
  entity_id: string
  entity_name: string
  reason: string          // Human-readable explanation in French
  metrics: Record<string, number>  // The metrics that triggered this decision
  action_taken: boolean   // Whether the agent executed the action
  action_details?: string // What was done
  timestamp: string
}

export interface AdSetPerformance {
  id: string
  name: string
  status: string
  daily_budget: number
  impressions: number
  clicks: number
  spend: number
  leads: number
  ctr: number
  cpc: number
  cpl: number
  // Trend data (comparing periods)
  ctr_trend?: number // % change
}

// Config cache: { userId -> { config, expiresAt } }
const configCache = new Map<string, { config: AgentConfig; expiresAt: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ─── Agent Class ──────────────────────────────────────
export class OptimizationAgent {
  private metaClient: MetaMarketingAPI
  private config: AgentConfig
  private decisions: AgentDecision[] = []
  private userId: string

  constructor(metaClient: MetaMarketingAPI, config: Partial<AgentConfig> = {}, userId: string = 'default') {
    this.metaClient = metaClient
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config }
    this.userId = userId
  }

  /**
   * Load agent configuration for a specific user from the database.
   * Falls back to DEFAULT_AGENT_CONFIG if no custom config exists.
   * Caches result for 5 minutes.
   */
  static async loadConfig(userId: string, supabase: any): Promise<AgentConfig> {
    // Check cache first
    const cached = configCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug('Loaded config from cache', { userId });
      return cached.config;
    }

    try {
      const { data, error } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected
        logger.warn('Failed to load agent config from database', error, { userId });
        return DEFAULT_AGENT_CONFIG;
      }

      if (!data) {
        logger.debug('No custom agent config found, using defaults', { userId });
        return DEFAULT_AGENT_CONFIG;
      }

      // Parse and validate the configuration
      const parsed = AgentConfigSchema.safeParse(data.config);
      if (!parsed.success) {
        logger.warn('Invalid agent config in database, using defaults', { userId, errors: parsed.error.errors });
        return DEFAULT_AGENT_CONFIG;
      }

      const config = parsed.data as AgentConfig;

      // Cache the result
      configCache.set(userId, {
        config,
        expiresAt: Date.now() + CACHE_DURATION_MS,
      });

      logger.debug('Loaded custom agent config from database', { userId });
      return config;
    } catch (err) {
      logger.error('Error loading agent config', err, { userId });
      return DEFAULT_AGENT_CONFIG;
    }
  }

  /**
   * Validate agent configuration
   */
  static validateConfig(config: Partial<AgentConfig>): { valid: boolean; errors?: z.ZodError } {
    const result = AgentConfigSchema.safeParse(config);
    if (!result.success) {
      return { valid: false, errors: result.error };
    }
    return { valid: true };
  }

  // Parse Meta insights into our performance format
  private parseAdSetInsights(adSetData: Record<string, unknown>, insightsData: Record<string, unknown>): AdSetPerformance {
    const actions = (insightsData.actions as Array<{ action_type: string; value: string }>) || []
    const leadAction = actions.find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped')
    const leads = leadAction ? parseInt(leadAction.value) : 0
    const spend = parseFloat(insightsData.spend as string || '0')
    const clicks = parseInt(insightsData.clicks as string || '0')
    const impressions = parseInt(insightsData.impressions as string || '0')

    return {
      id: adSetData.id as string,
      name: adSetData.name as string,
      status: adSetData.status as string,
      daily_budget: parseInt(adSetData.daily_budget as string || '0'),
      impressions,
      clicks,
      spend,
      leads,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpl: leads > 0 ? spend / leads : 0,
    }
  }

  // Evaluate a single ad set and decide what to do
  private evaluateAdSet(perf: AdSetPerformance, campaignAge: number): AgentDecision {
    const base = {
      entity_type: 'adset' as const,
      entity_id: perf.id,
      entity_name: perf.name,
      metrics: {
        impressions: perf.impressions,
        clicks: perf.clicks,
        spend: perf.spend,
        leads: perf.leads,
        ctr: perf.ctr,
        cpc: perf.cpc,
        cpl: perf.cpl,
      },
      action_taken: false,
      timestamp: new Date().toISOString(),
    }

    // Not enough data yet — wait
    if (perf.impressions < this.config.minImpressions || perf.spend < this.config.minSpend) {
      return {
        ...base,
        type: 'no_action',
        reason: `Données insuffisantes (${perf.impressions} impressions, ${perf.spend.toFixed(2)}€ dépensés). Minimum requis : ${this.config.minImpressions} impressions et ${this.config.minSpend}€.`,
      }
    }

    // Still in learning period — wait but warn if trends are bad
    if (campaignAge < this.config.learningPeriodDays) {
      if (perf.ctr < this.config.minCTR * 0.5) {
        return {
          ...base,
          type: 'alert_operator',
          reason: `En période d'apprentissage (jour ${campaignAge}/${this.config.learningPeriodDays}) mais CTR très faible (${perf.ctr.toFixed(2)}%). Surveillance recommandée.`,
        }
      }
      return {
        ...base,
        type: 'no_action',
        reason: `Période d'apprentissage en cours (jour ${campaignAge}/${this.config.learningPeriodDays}). Aucune action prise.`,
      }
    }

    // ── Decision: Pause if CPL too high ──
    if (perf.leads > 0 && perf.cpl > this.config.maxCPL) {
      return {
        ...base,
        type: 'pause_adset',
        reason: `Coût par lead trop élevé : ${perf.cpl.toFixed(2)}€ (seuil : ${this.config.maxCPL}€). Ad set mis en pause.`,
      }
    }

    // ── Decision: Pause if CTR too low (no leads after significant spend) ──
    if (perf.ctr < this.config.minCTR && perf.spend > this.config.minSpend * 3) {
      return {
        ...base,
        type: 'pause_adset',
        reason: `CTR trop faible : ${perf.ctr.toFixed(2)}% (seuil : ${this.config.minCTR}%) après ${perf.spend.toFixed(2)}€ de dépenses. Ad set mis en pause.`,
      }
    }

    // ── Decision: Pause if CPC too high with no conversions ──
    if (perf.leads === 0 && perf.cpc > this.config.maxCPC && perf.spend > this.config.minSpend * 2) {
      return {
        ...base,
        type: 'pause_adset',
        reason: `Aucun lead généré avec un CPC élevé (${perf.cpc.toFixed(2)}€) et ${perf.spend.toFixed(2)}€ dépensés. Ad set mis en pause.`,
      }
    }

    // ── Decision: Scale if performing well ──
    if (perf.leads > 0 && perf.cpl < this.config.maxCPL * 0.6 && perf.ctr > this.config.minCTR * 1.5) {
      const currentBudget = perf.daily_budget
      const newBudget = Math.min(
        Math.round(currentBudget * (1 + this.config.scaleBudgetIncrement / 100)),
        this.config.maxDailyBudget
      )
      if (newBudget > currentBudget) {
        return {
          ...base,
          type: 'scale_adset',
          reason: `Excellente performance : CPL ${perf.cpl.toFixed(2)}€, CTR ${perf.ctr.toFixed(2)}%. Budget augmenté de ${(currentBudget/100).toFixed(0)}€ à ${(newBudget/100).toFixed(0)}€/jour.`,
          action_details: JSON.stringify({ old_budget: currentBudget, new_budget: newBudget }),
        }
      }
    }

    // ── Creative fatigue check ──
    if (perf.ctr_trend && perf.ctr_trend < -this.config.creativeFatigueThreshold) {
      return {
        ...base,
        type: 'creative_fatigue',
        reason: `Fatigue créative détectée : CTR en baisse de ${Math.abs(perf.ctr_trend).toFixed(0)}%. Rotation de créatifs recommandée.`,
      }
    }

    // ── Performing OK — no action needed ──
    return {
      ...base,
      type: 'no_action',
      reason: `Performance dans les normes. CPL: ${perf.leads > 0 ? perf.cpl.toFixed(2) + '€' : 'N/A'}, CTR: ${perf.ctr.toFixed(2)}%, CPC: ${perf.cpc.toFixed(2)}€.`,
    }
  }

  // Main method: Analyze a campaign and execute decisions
  async analyzeCampaign(metaCampaignId: string, campaignCreatedAt: string): Promise<AgentDecision[]> {
    this.decisions = []
    const campaignAge = Math.floor((Date.now() - new Date(campaignCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
    const agentLogger = logger.child({ userId: this.userId, campaignId: metaCampaignId })

    try {
      agentLogger.info('Starting campaign analysis', { campaignAge });

      // Get campaign ad sets
      const adSetsResponse = await this.metaClient.getCampaignAdSets(metaCampaignId)
      const adSets = adSetsResponse.data || []

      agentLogger.debug('Retrieved ad sets', { adSetCount: adSets.length });

      // Get insights for each ad set
      for (const adSet of adSets) {
        if (adSet.status === 'DELETED' || adSet.status === 'ARCHIVED') continue

        try {
          const insightsResponse = await this.metaClient.getAdSetInsights(adSet.id as string, {
            fields: ['impressions', 'clicks', 'spend', 'actions', 'ctr', 'cpc', 'cost_per_action_type'],
            date_preset: 'last_7d',
          })

          const insights = insightsResponse.data?.[0] || {}
          const perf = this.parseAdSetInsights(adSet, insights)
          const decision = this.evaluateAdSet(perf, campaignAge)

          agentLogger.debug('Evaluated ad set', { adSetId: adSet.id, decision: decision.type });

          // Execute the decision if it's actionable
          if (decision.type === 'pause_adset' && adSet.status === 'ACTIVE') {
            try {
              await this.metaClient.pauseAdSet(adSet.id as string)
              decision.action_taken = true
              decision.action_details = 'Ad set mis en pause via Meta API'
              agentLogger.info('Paused ad set', { adSetId: adSet.id, reason: decision.reason });
            } catch (err) {
              decision.action_details = `Échec de la mise en pause : ${err instanceof Error ? err.message : 'Erreur inconnue'}`
              agentLogger.error('Failed to pause ad set', err, { adSetId: adSet.id });
            }
          }

          if (decision.type === 'scale_adset' && adSet.status === 'ACTIVE' && decision.action_details) {
            try {
              const budgetData = safeJsonParse(decision.action_details, { old_budget: 0, new_budget: 0 })
              await this.metaClient.updateAdSet(adSet.id as string, { daily_budget: budgetData.new_budget })
              decision.action_taken = true
              decision.action_details = `Budget mis à jour : ${(budgetData.old_budget/100).toFixed(0)}€ → ${(budgetData.new_budget/100).toFixed(0)}€/jour`
              agentLogger.info('Scaled ad set budget', { adSetId: adSet.id, oldBudget: budgetData.old_budget, newBudget: budgetData.new_budget });
            } catch (err) {
              decision.action_details = `Échec de l'augmentation du budget : ${err instanceof Error ? err.message : 'Erreur inconnue'}`
              agentLogger.error('Failed to scale ad set', err, { adSetId: adSet.id });
            }
          }

          this.decisions.push(decision)
        } catch (err) {
          // Individual ad set insights might not be available yet
          agentLogger.warn('Could not retrieve insights for ad set', err, { adSetId: adSet.id });
          this.decisions.push({
            type: 'no_action',
            entity_type: 'adset',
            entity_id: adSet.id as string,
            entity_name: adSet.name as string || 'Unknown',
            reason: 'Insights non disponibles pour cet ad set (probablement trop récent).',
            metrics: {},
            action_taken: false,
            timestamp: new Date().toISOString(),
          })
        }
      }

      // Campaign-level decision: if ALL ad sets are paused, pause the campaign
      const activeAdSets = adSets.filter(a => a.status === 'ACTIVE')
      const pausedByAgent = this.decisions.filter(d => d.type === 'pause_adset' && d.action_taken)

      if (activeAdSets.length > 0 && pausedByAgent.length === activeAdSets.length) {
        try {
          await this.metaClient.pauseCampaign(metaCampaignId)
          this.decisions.push({
            type: 'pause_campaign',
            entity_type: 'campaign',
            entity_id: metaCampaignId,
            entity_name: 'Campaign',
            reason: `Tous les ad sets ont été mis en pause pour mauvaise performance. Campagne entière mise en pause. Révision humaine recommandée.`,
            metrics: {},
            action_taken: true,
            action_details: 'Campagne mise en pause — alerte opérateur envoyée',
            timestamp: new Date().toISOString(),
          })
          agentLogger.info('Paused entire campaign due to all ad sets being paused');
        } catch (err) {
          // Non-critical
          agentLogger.warn('Failed to pause campaign', err, { metaCampaignId });
        }
      }

      agentLogger.info('Campaign analysis complete', { decisionsCount: this.decisions.length });

    } catch (err) {
      agentLogger.error('Critical error during campaign analysis', err);
      this.decisions.push({
        type: 'alert_operator',
        entity_type: 'campaign',
        entity_id: metaCampaignId,
        entity_name: 'Campaign',
        reason: `Erreur lors de l'analyse : ${err instanceof Error ? err.message : 'Erreur inconnue'}`,
        metrics: {},
        action_taken: false,
        timestamp: new Date().toISOString(),
      })
    }

    return this.decisions
  }

  getDecisions(): AgentDecision[] {
    return this.decisions
  }
}
