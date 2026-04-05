import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OptimizationAgent, DEFAULT_AGENT_CONFIG, type AgentConfig, type AdSetPerformance } from '../optimization-agent';
import { MetaMarketingAPI } from '../meta-api';

// Mock MetaMarketingAPI
vi.mock('../meta-api');

describe('OptimizationAgent', () => {
  let agent: OptimizationAgent;
  let mockMetaClient: any;

  beforeEach(() => {
    mockMetaClient = vi.mocked(MetaMarketingAPI).prototype;
  });

  describe('Decision: pause_campaign when CPL > threshold', () => {
    it('should pause campaign when CPL exceeds maxCPL', async () => {
      const config: Partial<AgentConfig> = {
        minImpressions: 100,
        minSpend: 5,
        learningPeriodDays: 1,
        maxCPL: 50,
      };
      agent = new OptimizationAgent(mockMetaClient, config);

      // Setup mocks
      mockMetaClient.getCampaignAdSets = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'adset1',
            name: 'Test Adset',
            status: 'ACTIVE',
            daily_budget: '500',
          },
        ],
      });

      mockMetaClient.getAdSetInsights = vi.fn().mockResolvedValue({
        data: [
          {
            impressions: '150',
            clicks: '10',
            spend: '600', // 60 EUR
            actions: [{ action_type: 'lead', value: '5' }],
            ctr: '6.67',
            cpc: '60',
            cost_per_action_type: '120',
          },
        ],
      });

      mockMetaClient.pauseAdSet = vi.fn().mockResolvedValue({});
      mockMetaClient.pauseCampaign = vi.fn().mockResolvedValue({});

      const campaignCreatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days old
      const decisions = await agent.analyzeCampaign('campaign1', campaignCreatedAt);

      // Should pause the adset and then the campaign
      expect(mockMetaClient.pauseAdSet).toHaveBeenCalledWith('adset1');
      expect(mockMetaClient.pauseCampaign).toHaveBeenCalledWith('campaign1');
      expect(decisions.some(d => d.type === 'pause_campaign')).toBe(true);
    });
  });

  describe('Decision: pause_adset when CTR < threshold', () => {
    it('should pause adset when CTR is below minCTR threshold after significant spend', async () => {
      const config: Partial<AgentConfig> = {
        minImpressions: 100,
        minSpend: 5,
        learningPeriodDays: 1,
        minCTR: 0.8,
      };
      agent = new OptimizationAgent(mockMetaClient, config);

      mockMetaClient.getCampaignAdSets = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'adset2',
            name: 'Low CTR Adset',
            status: 'ACTIVE',
            daily_budget: '500',
          },
        ],
      });

      mockMetaClient.getAdSetInsights = vi.fn().mockResolvedValue({
        data: [
          {
            impressions: '500',
            clicks: '2', // CTR = 0.4%
            spend: '30', // 30 EUR (> minSpend * 3)
            actions: [],
            ctr: '0.4',
            cpc: '15',
          },
        ],
      });

      mockMetaClient.pauseAdSet = vi.fn().mockResolvedValue({});

      const campaignCreatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const decisions = await agent.analyzeCampaign('campaign2', campaignCreatedAt);

      const pauseDecision = decisions.find(d => d.type === 'pause_adset');
      expect(pauseDecision).toBeDefined();
      expect(pauseDecision?.reason).toContain('CTR trop faible');
      expect(mockMetaClient.pauseAdSet).toHaveBeenCalledWith('adset2');
    });
  });

  describe('Decision: scale_adset when performing well', () => {
    it('should scale budget when CPL is low and CTR is high', async () => {
      const config: Partial<AgentConfig> = {
        minImpressions: 100,
        minSpend: 5,
        learningPeriodDays: 1,
        maxCPL: 50,
        minCTR: 0.8,
        scaleBudgetIncrement: 20,
        maxDailyBudget: 5000,
      };
      agent = new OptimizationAgent(mockMetaClient, config);

      mockMetaClient.getCampaignAdSets = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'adset3',
            name: 'Winning Adset',
            status: 'ACTIVE',
            daily_budget: '1000', // 10 EUR in cents
          },
        ],
      });

      mockMetaClient.getAdSetInsights = vi.fn().mockResolvedValue({
        data: [
          {
            impressions: '500',
            clicks: '50', // CTR = 10%
            spend: '100', // 100 EUR
            actions: [{ action_type: 'lead', value: '10' }],
            ctr: '10',
            cpc: '2',
            cost_per_action_type: '10', // CPL = 10 EUR
          },
        ],
      });

      mockMetaClient.updateAdSet = vi.fn().mockResolvedValue({});

      const campaignCreatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const decisions = await agent.analyzeCampaign('campaign3', campaignCreatedAt);

      const scaleDecision = decisions.find(d => d.type === 'scale_adset');
      expect(scaleDecision).toBeDefined();
      expect(scaleDecision?.action_taken).toBe(true);
      expect(mockMetaClient.updateAdSet).toHaveBeenCalled();
    });
  });

  describe('Decision: creative_fatigue detection', () => {
    it('should detect creative fatigue when CTR drops significantly', async () => {
      const config: Partial<AgentConfig> = {
        minImpressions: 100,
        minSpend: 5,
        learningPeriodDays: 1,
        creativeFatigueThreshold: 30,
      };
      agent = new OptimizationAgent(mockMetaClient, config);

      mockMetaClient.getCampaignAdSets = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'adset4',
            name: 'Fatigued Adset',
            status: 'ACTIVE',
            daily_budget: '500',
          },
        ],
      });

      mockMetaClient.getAdSetInsights = vi.fn().mockResolvedValue({
        data: [
          {
            impressions: '500',
            clicks: '30',
            spend: '50',
            actions: [{ action_type: 'lead', value: '5' }],
            ctr: '6',
            cpc: '1.67',
            cost_per_action_type: '10',
          },
        ],
      });

      const campaignCreatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const decisions = await agent.analyzeCampaign('campaign4', campaignCreatedAt);

      const fatigueAdSet: AdSetPerformance = {
        id: 'adset4',
        name: 'Fatigued Adset',
        status: 'ACTIVE',
        daily_budget: 500,
        impressions: 500,
        clicks: 20,
        spend: 50,
        leads: 5,
        ctr: 4,
        cpc: 2.5,
        cpl: 10,
        ctr_trend: -40, // 40% drop
      };

      // Manually evaluate to test creative fatigue logic
      const evaluateMethod = (agent as any).evaluateAdSet.bind(agent);
      const decision = evaluateMethod(fatigueAdSet, 5);

      expect(decision.type).toBe('creative_fatigue');
      expect(decision.reason).toContain('Fatigue créative');
    });
  });

  describe('Decision: no_action when OK', () => {
    it('should take no action when performance is within acceptable ranges', async () => {
      const config: Partial<AgentConfig> = {
        minImpressions: 100,
        minSpend: 5,
        learningPeriodDays: 1,
        maxCPL: 50,
        minCTR: 0.8,
      };
      agent = new OptimizationAgent(mockMetaClient, config);

      mockMetaClient.getCampaignAdSets = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'adset5',
            name: 'OK Adset',
            status: 'ACTIVE',
            daily_budget: '500',
          },
        ],
      });

      mockMetaClient.getAdSetInsights = vi.fn().mockResolvedValue({
        data: [
          {
            impressions: '300',
            clicks: '5', // CTR = 1.67%
            spend: '20',
            actions: [{ action_type: 'lead', value: '2' }],
            ctr: '1.67',
            cpc: '4',
            cost_per_action_type: '10',
          },
        ],
      });

      const campaignCreatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const decisions = await agent.analyzeCampaign('campaign5', campaignCreatedAt);

      const okDecision = decisions.find(d => d.type === 'no_action');
      expect(okDecision).toBeDefined();
      expect(okDecision?.reason).toContain('Performance dans les normes');
    });
  });

  describe('Decision: skip insufficient data', () => {
    it('should skip action when impressions are below minimum', async () => {
      const config: Partial<AgentConfig> = {
        minImpressions: 500,
        minSpend: 10,
        learningPeriodDays: 1,
      };
      agent = new OptimizationAgent(mockMetaClient, config);

      mockMetaClient.getCampaignAdSets = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'adset6',
            name: 'New Adset',
            status: 'ACTIVE',
            daily_budget: '500',
          },
        ],
      });

      mockMetaClient.getAdSetInsights = vi.fn().mockResolvedValue({
        data: [
          {
            impressions: '100', // Below minImpressions
            clicks: '2',
            spend: '5',
            actions: [],
            ctr: '2',
            cpc: '2.5',
          },
        ],
      });

      const campaignCreatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const decisions = await agent.analyzeCampaign('campaign6', campaignCreatedAt);

      const insufficientDataDecision = decisions.find(d => d.type === 'no_action');
      expect(insufficientDataDecision?.reason).toContain('Données insuffisantes');
    });
  });

  describe('Learning period handling', () => {
    it('should alert operator during learning period if CTR is very low', async () => {
      const config: Partial<AgentConfig> = {
        minImpressions: 100,
        minSpend: 5,
        learningPeriodDays: 3,
        minCTR: 0.8,
      };
      agent = new OptimizationAgent(mockMetaClient, config);

      mockMetaClient.getCampaignAdSets = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'adset7',
            name: 'New Campaign Adset',
            status: 'ACTIVE',
            daily_budget: '500',
          },
        ],
      });

      mockMetaClient.getAdSetInsights = vi.fn().mockResolvedValue({
        data: [
          {
            impressions: '200',
            clicks: '1', // CTR = 0.5%, below minCTR * 0.5
            spend: '15',
            actions: [],
            ctr: '0.5',
            cpc: '15',
          },
        ],
      });

      // Campaign is 1 day old (in learning period)
      const campaignCreatedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      const decisions = await agent.analyzeCampaign('campaign7', campaignCreatedAt);

      const alertDecision = decisions.find(d => d.type === 'alert_operator');
      expect(alertDecision).toBeDefined();
      expect(alertDecision?.reason).toContain('En période d\'apprentissage');
    });

    it('should take no action if in learning period and CTR is acceptable', async () => {
      const config: Partial<AgentConfig> = {
        minImpressions: 100,
        minSpend: 5,
        learningPeriodDays: 3,
        minCTR: 0.8,
      };
      agent = new OptimizationAgent(mockMetaClient, config);

      mockMetaClient.getCampaignAdSets = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'adset8',
            name: 'New Campaign Adset',
            status: 'ACTIVE',
            daily_budget: '500',
          },
        ],
      });

      mockMetaClient.getAdSetInsights = vi.fn().mockResolvedValue({
        data: [
          {
            impressions: '200',
            clicks: '5', // CTR = 2.5%, acceptable
            spend: '15',
            actions: [],
            ctr: '2.5',
            cpc: '3',
          },
        ],
      });

      // Campaign is 1 day old (in learning period)
      const campaignCreatedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      const decisions = await agent.analyzeCampaign('campaign8', campaignCreatedAt);

      const noActionDecision = decisions.find(d => d.type === 'no_action');
      expect(noActionDecision?.reason).toContain('Période d\'apprentissage');
    });
  });

  describe('Error handling', () => {
    it('should handle Meta API errors gracefully', async () => {
      agent = new OptimizationAgent(mockMetaClient);

      mockMetaClient.getCampaignAdSets = vi.fn().mockRejectedValue(new Error('API Error'));

      const campaignCreatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const decisions = await agent.analyzeCampaign('campaign_error', campaignCreatedAt);

      const alertDecision = decisions.find(d => d.type === 'alert_operator');
      expect(alertDecision).toBeDefined();
      expect(alertDecision?.reason).toContain('Erreur lors de l\'analyse');
    });

    it('should handle missing insights data', async () => {
      agent = new OptimizationAgent(mockMetaClient);

      mockMetaClient.getCampaignAdSets = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'adset9',
            name: 'No Insights Adset',
            status: 'ACTIVE',
            daily_budget: '500',
          },
        ],
      });

      mockMetaClient.getAdSetInsights = vi.fn().mockRejectedValue(new Error('Insights not available'));

      const campaignCreatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const decisions = await agent.analyzeCampaign('campaign9', campaignCreatedAt);

      const noActionDecision = decisions.find(d => d.type === 'no_action' && d.entity_id === 'adset9');
      expect(noActionDecision?.reason).toContain('Insights non disponibles');
    });
  });

  describe('Getters', () => {
    it('should return decisions via getter', async () => {
      agent = new OptimizationAgent(mockMetaClient);

      mockMetaClient.getCampaignAdSets = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'adset10',
            name: 'Test Adset',
            status: 'ACTIVE',
            daily_budget: '500',
          },
        ],
      });

      mockMetaClient.getAdSetInsights = vi.fn().mockResolvedValue({
        data: [
          {
            impressions: '300',
            clicks: '5',
            spend: '20',
            actions: [],
            ctr: '1.67',
            cpc: '4',
          },
        ],
      });

      const campaignCreatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const decisions = await agent.analyzeCampaign('campaign10', campaignCreatedAt);

      const getterDecisions = agent.getDecisions();
      expect(getterDecisions).toEqual(decisions);
      expect(getterDecisions.length).toBeGreaterThan(0);
    });
  });
});
