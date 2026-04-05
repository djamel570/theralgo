-- Theralgo RLS Policies, Constraints, and New Tables Migration
-- This migration completes the RLS implementation, adds database constraints,
-- introduces new tables (agent_configs, updated specialty_templates), and adds soft delete support.

-- ═══════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- NEW TABLE: Agent Configs
-- Per-client optimization thresholds for the AI agent
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  max_cpl NUMERIC DEFAULT 50 CHECK (max_cpl > 0),
  min_ctr NUMERIC DEFAULT 0.8 CHECK (min_ctr >= 0),
  max_cpc NUMERIC DEFAULT 3 CHECK (max_cpc > 0),
  min_roas NUMERIC DEFAULT 2.0 CHECK (min_roas > 0),
  scale_threshold NUMERIC DEFAULT 0.7 CHECK (scale_threshold >= 0 AND scale_threshold <= 1),
  pause_threshold NUMERIC DEFAULT 1.5 CHECK (pause_threshold > 0),
  creative_fatigue_days INTEGER DEFAULT 14 CHECK (creative_fatigue_days > 0),
  min_data_points INTEGER DEFAULT 100 CHECK (min_data_points > 0),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for agent_configs
CREATE INDEX IF NOT EXISTS idx_agent_configs_user_id ON agent_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_enabled ON agent_configs(enabled);

-- Enable RLS on agent_configs
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_configs
DROP POLICY IF EXISTS "agent_configs_own_config" ON agent_configs;
CREATE POLICY "agent_configs_own_config" ON agent_configs
  FOR ALL
  USING (auth.uid() = user_id);

-- Auto-update trigger for agent_configs
DROP TRIGGER IF EXISTS update_agent_configs_updated_at ON agent_configs;
CREATE TRIGGER update_agent_configs_updated_at
  BEFORE UPDATE ON agent_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATED TABLE: Specialty Templates
-- Stores pre-validated templates for therapist specialties with structured data
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing table if it exists (we're replacing the structure)
DROP TABLE IF EXISTS specialty_templates CASCADE;

-- Create new specialty_templates table with enhanced structure
CREATE TABLE IF NOT EXISTS specialty_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  intention_segments JSONB,
  hook_templates JSONB,
  promise_templates JSONB,
  objections JSONB,
  campaign_defaults JSONB,
  faq_templates JSONB,
  qualification_config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for specialty_templates
CREATE INDEX IF NOT EXISTS idx_specialty_templates_specialty_key ON specialty_templates(specialty_key);
CREATE INDEX IF NOT EXISTS idx_specialty_templates_is_active ON specialty_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_specialty_templates_created_at ON specialty_templates(created_at DESC);

-- Enable RLS on specialty_templates
ALTER TABLE specialty_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for specialty_templates (public read, service role write)
DROP POLICY IF EXISTS "specialty_templates_public_read" ON specialty_templates;
CREATE POLICY "specialty_templates_public_read" ON specialty_templates
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "specialty_templates_service_role_write" ON specialty_templates;
CREATE POLICY "specialty_templates_service_role_write" ON specialty_templates
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "specialty_templates_service_role_update" ON specialty_templates;
CREATE POLICY "specialty_templates_service_role_update" ON specialty_templates
  FOR UPDATE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "specialty_templates_service_role_delete" ON specialty_templates;
CREATE POLICY "specialty_templates_service_role_delete" ON specialty_templates
  FOR DELETE USING (auth.role() = 'service_role');

-- Auto-update trigger for specialty_templates
DROP TRIGGER IF EXISTS update_specialty_templates_updated_at ON specialty_templates;
CREATE TRIGGER update_specialty_templates_updated_at
  BEFORE UPDATE ON specialty_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ADD SOFT DELETE SUPPORT
-- Add deleted_at column to tables that support soft deletes
-- ═══════════════════════════════════════════════════════════════════════════

-- Campaigns - add deleted_at if not exists
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Leads - add deleted_at if not exists
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Landing pages - add deleted_at if not exists (table may not exist yet, create if needed)
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content JSONB,
  settings JSONB,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media uploads - add deleted_at if not exists
ALTER TABLE media_uploads
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- ADD CHECK CONSTRAINTS
-- Enforce positive values for metrics and budgets
-- ═══════════════════════════════════════════════════════════════════════════

-- Campaign metrics constraints
ALTER TABLE campaign_metrics
ADD CONSTRAINT check_campaign_metrics_spend CHECK (spend >= 0);

ALTER TABLE campaign_metrics
ADD CONSTRAINT check_campaign_metrics_impressions CHECK (impressions >= 0);

ALTER TABLE campaign_metrics
ADD CONSTRAINT check_campaign_metrics_clicks CHECK (clicks >= 0);

ALTER TABLE campaign_metrics
ADD CONSTRAINT check_campaign_metrics_leads CHECK (leads >= 0);

-- Campaigns constraints
ALTER TABLE campaigns
ADD CONSTRAINT check_campaigns_budget CHECK (budget > 0);

-- Media uploads constraints
ALTER TABLE media_uploads
ADD CONSTRAINT check_media_uploads_file_size CHECK (file_size > 0);

-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCE RLS POLICIES - Therapist Profiles
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "therapist_profiles_own_profile" ON therapist_profiles;
CREATE POLICY "therapist_profiles_own_profile" ON therapist_profiles
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "therapist_profiles_own_insert" ON therapist_profiles;
CREATE POLICY "therapist_profiles_own_insert" ON therapist_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "therapist_profiles_own_update" ON therapist_profiles;
CREATE POLICY "therapist_profiles_own_update" ON therapist_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "therapist_profiles_own_delete" ON therapist_profiles;
CREATE POLICY "therapist_profiles_own_delete" ON therapist_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCE RLS POLICIES - Media Uploads
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "media_uploads_own_media" ON media_uploads;
CREATE POLICY "media_uploads_select_own" ON media_uploads
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "media_uploads_own_insert" ON media_uploads;
CREATE POLICY "media_uploads_own_insert" ON media_uploads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "media_uploads_own_update" ON media_uploads;
CREATE POLICY "media_uploads_own_update" ON media_uploads
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "media_uploads_own_delete" ON media_uploads;
CREATE POLICY "media_uploads_own_delete" ON media_uploads
  FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update trigger for media_uploads
DROP TRIGGER IF EXISTS update_media_uploads_updated_at ON media_uploads;
CREATE TRIGGER update_media_uploads_updated_at
  BEFORE UPDATE ON media_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCE RLS POLICIES - Campaigns
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "campaigns_own_campaigns" ON campaigns;
CREATE POLICY "campaigns_select_own" ON campaigns
  FOR SELECT
  USING ((auth.uid() = user_id OR auth.role() = 'service_role') AND deleted_at IS NULL);

DROP POLICY IF EXISTS "campaigns_own_insert" ON campaigns;
CREATE POLICY "campaigns_own_insert" ON campaigns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "campaigns_own_update" ON campaigns;
CREATE POLICY "campaigns_own_update" ON campaigns
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "campaigns_own_delete" ON campaigns;
CREATE POLICY "campaigns_own_delete" ON campaigns
  FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update trigger for campaigns
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCE RLS POLICIES - Campaign Metrics
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "campaign_metrics_own_campaigns" ON campaign_metrics;
CREATE POLICY "campaign_metrics_select_own" ON campaign_metrics
  FOR SELECT
  USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid() AND deleted_at IS NULL)
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "campaign_metrics_own_insert" ON campaign_metrics;
CREATE POLICY "campaign_metrics_own_insert" ON campaign_metrics
  FOR INSERT
  WITH CHECK (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "campaign_metrics_own_update" ON campaign_metrics;
CREATE POLICY "campaign_metrics_own_update" ON campaign_metrics
  FOR UPDATE
  USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- Auto-update trigger for campaign_metrics
ALTER TABLE campaign_metrics
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_campaign_metrics_updated_at ON campaign_metrics;
CREATE TRIGGER update_campaign_metrics_updated_at
  BEFORE UPDATE ON campaign_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCE RLS POLICIES - Leads
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "leads_own_leads" ON leads;
CREATE POLICY "leads_select_own" ON leads
  FOR SELECT
  USING (
    (auth.uid() = user_id OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()))
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "leads_own_insert" ON leads;
CREATE POLICY "leads_own_insert" ON leads
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "leads_own_update" ON leads;
CREATE POLICY "leads_own_update" ON leads
  FOR UPDATE
  USING (
    (auth.uid() = user_id OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid()))
    AND deleted_at IS NULL
  )
  WITH CHECK (
    auth.uid() = user_id
    OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "leads_own_delete" ON leads;
CREATE POLICY "leads_own_delete" ON leads
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

-- Auto-update trigger for leads
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCE RLS POLICIES - Targeting Diagnostics
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "targeting_diagnostics_service_role" ON targeting_diagnostics;
CREATE POLICY "targeting_diagnostics_select_own" ON targeting_diagnostics
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "targeting_diagnostics_service_role_write" ON targeting_diagnostics
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "targeting_diagnostics_service_role_update" ON targeting_diagnostics;
CREATE POLICY "targeting_diagnostics_service_role_update" ON targeting_diagnostics
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Auto-update trigger for targeting_diagnostics
ALTER TABLE targeting_diagnostics
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_targeting_diagnostics_updated_at ON targeting_diagnostics;
CREATE TRIGGER update_targeting_diagnostics_updated_at
  BEFORE UPDATE ON targeting_diagnostics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCE RLS POLICIES - Targeting Plans
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "targeting_plans_service_role" ON targeting_plans;
CREATE POLICY "targeting_plans_select_own" ON targeting_plans
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "targeting_plans_service_role_write" ON targeting_plans
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "targeting_plans_service_role_update" ON targeting_plans;
CREATE POLICY "targeting_plans_service_role_update" ON targeting_plans
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Auto-update trigger for targeting_plans
ALTER TABLE targeting_plans
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_targeting_plans_updated_at ON targeting_plans;
CREATE TRIGGER update_targeting_plans_updated_at
  BEFORE UPDATE ON targeting_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCE RLS POLICIES - Agent Decisions
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "agent_decisions_service_role" ON agent_decisions;
CREATE POLICY "agent_decisions_select_own" ON agent_decisions
  FOR SELECT
  USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

CREATE POLICY "agent_decisions_service_role_write" ON agent_decisions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "agent_decisions_service_role_update" ON agent_decisions;
CREATE POLICY "agent_decisions_service_role_update" ON agent_decisions
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Auto-update trigger for agent_decisions
ALTER TABLE agent_decisions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_agent_decisions_updated_at ON agent_decisions;
CREATE TRIGGER update_agent_decisions_updated_at
  BEFORE UPDATE ON agent_decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCE RLS POLICIES - Meta Tokens
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "meta_tokens_service_role" ON meta_tokens;
CREATE POLICY "meta_tokens_select_own" ON meta_tokens
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "meta_tokens_service_role_write" ON meta_tokens
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "meta_tokens_service_role_update" ON meta_tokens;
CREATE POLICY "meta_tokens_service_role_update" ON meta_tokens
  FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.uid() = user_id)
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "meta_tokens_service_role_delete" ON meta_tokens;
CREATE POLICY "meta_tokens_service_role_delete" ON meta_tokens
  FOR DELETE
  USING (auth.role() = 'service_role' OR auth.uid() = user_id);

-- Auto-update trigger for meta_tokens
ALTER TABLE meta_tokens
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_meta_tokens_updated_at ON meta_tokens;
CREATE TRIGGER update_meta_tokens_updated_at
  BEFORE UPDATE ON meta_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCE RLS POLICIES - Alerts
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "alerts_own_alerts" ON alerts;
CREATE POLICY "alerts_select_own" ON alerts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "alerts_service_role_insert" ON alerts;
CREATE POLICY "alerts_service_role_insert" ON alerts
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "alerts_own_update" ON alerts;
CREATE POLICY "alerts_own_update" ON alerts
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Auto-update trigger for alerts
ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ENHANCE RLS POLICIES - Subscriptions
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "subscriptions_own_subscription" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "subscriptions_own_insert" ON subscriptions;
CREATE POLICY "subscriptions_own_insert" ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "subscriptions_own_update" ON subscriptions;
CREATE POLICY "subscriptions_own_update" ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Auto-update trigger for subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS AND INDEXES FOR Landing Pages Table
-- ═══════════════════════════════════════════════════════════════════════════

-- Create indexes for landing_pages
CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON landing_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_created_at ON landing_pages(created_at DESC);

-- Enable RLS on landing_pages
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for landing_pages
DROP POLICY IF EXISTS "landing_pages_select_own" ON landing_pages;
CREATE POLICY "landing_pages_select_own" ON landing_pages
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "landing_pages_own_insert" ON landing_pages;
CREATE POLICY "landing_pages_own_insert" ON landing_pages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "landing_pages_own_update" ON landing_pages;
CREATE POLICY "landing_pages_own_update" ON landing_pages
  FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "landing_pages_own_delete" ON landing_pages;
CREATE POLICY "landing_pages_own_delete" ON landing_pages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update trigger for landing_pages
DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON landing_pages;
CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- FINAL VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

-- All tables have RLS enabled as of migration 001, so all policies are active.
-- This migration enhances policies, adds constraints, and new tables.
-- Service role can bypass all RLS policies for administrative operations.
