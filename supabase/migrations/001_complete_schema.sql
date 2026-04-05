-- Theralgo Complete Schema Migration
-- This migration creates all tables needed for the complete Theralgo system

-- ═══════════════════════════════════════════════════════════════════════════
-- EXISTING TABLES (with IF NOT EXISTS and updated columns)
-- ═══════════════════════════════════════════════════════════════════════════

-- Therapist profiles (updated with landing page fields)
CREATE TABLE IF NOT EXISTS therapist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT,
  specialty TEXT,
  city TEXT,
  consultation_price NUMERIC,
  website TEXT,
  bio TEXT,
  -- Landing page fields
  landing_slug TEXT UNIQUE,
  approach_description TEXT,
  main_techniques TEXT,
  patient_transformation TEXT,
  ideal_patient_profile TEXT,
  main_problem_solved TEXT,
  unique_differentiator TEXT,
  signature_content JSONB,
  landing_config JSONB,
  meta_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media uploads
CREATE TABLE IF NOT EXISTS media_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'processing'
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  media_id UUID REFERENCES media_uploads(id),
  status TEXT DEFAULT 'pending',
  generated_content JSONB,
  budget NUMERIC DEFAULT 300,
  targeting_radius INTEGER DEFAULT 15,
  launch_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign metrics
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  appointments INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpl NUMERIC DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'inactive',
  plan TEXT DEFAULT 'starter',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Targeting diagnostics
-- Stores diagnostic data about targeting readiness and maturity
CREATE TABLE IF NOT EXISTS targeting_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  diagnostic_data JSONB NOT NULL,
  signal_score INTEGER DEFAULT 0,
  maturity_level TEXT DEFAULT 'beginner',
  gaps JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Targeting plans
-- Stores generated targeting plans (intentions, creatives, structure)
CREATE TABLE IF NOT EXISTS targeting_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL,
  plan_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent decisions
-- Logs decisions made by the optimization agent
CREATE TABLE IF NOT EXISTS agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  decisions JSONB NOT NULL,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meta tokens
-- Stores Meta API tokens and refresh info
CREATE TABLE IF NOT EXISTS meta_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token_type TEXT NOT NULL,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts
-- Stores system alerts and notifications
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  level TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  details JSONB,
  source TEXT,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialty templates
-- Stores pre-validated templates for therapist specialties
CREATE TABLE IF NOT EXISTS specialty_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_key TEXT UNIQUE NOT NULL,
  specialty_label TEXT NOT NULL,
  template_data JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

-- Therapist profiles indexes
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user_id ON therapist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_landing_slug ON therapist_profiles(landing_slug);

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Campaign metrics indexes
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_recorded_at ON campaign_metrics(recorded_at DESC);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Targeting diagnostics indexes
CREATE INDEX IF NOT EXISTS idx_targeting_diagnostics_user_id ON targeting_diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_targeting_diagnostics_created_at ON targeting_diagnostics(created_at DESC);

-- Targeting plans indexes
CREATE INDEX IF NOT EXISTS idx_targeting_plans_user_id ON targeting_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_targeting_plans_plan_type ON targeting_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_targeting_plans_created_at ON targeting_plans(created_at DESC);

-- Agent decisions indexes
CREATE INDEX IF NOT EXISTS idx_agent_decisions_campaign_id ON agent_decisions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_created_at ON agent_decisions(created_at DESC);

-- Meta tokens indexes
CREATE INDEX IF NOT EXISTS idx_meta_tokens_user_id ON meta_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_tokens_is_active ON meta_tokens(is_active);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_campaign_id ON alerts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- Specialty templates indexes
CREATE INDEX IF NOT EXISTS idx_specialty_templates_specialty_key ON specialty_templates(specialty_key);
CREATE INDEX IF NOT EXISTS idx_specialty_templates_is_active ON specialty_templates(is_active);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE therapist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE targeting_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE targeting_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialty_templates ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Therapist Profiles
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "therapist_profiles_own_profile" ON therapist_profiles;
CREATE POLICY "therapist_profiles_own_profile" ON therapist_profiles
  FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Media Uploads
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "media_uploads_own_media" ON media_uploads;
CREATE POLICY "media_uploads_own_media" ON media_uploads
  FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Campaigns
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "campaigns_own_campaigns" ON campaigns;
CREATE POLICY "campaigns_own_campaigns" ON campaigns
  FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Campaign Metrics
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "campaign_metrics_own_campaigns" ON campaign_metrics;
CREATE POLICY "campaign_metrics_own_campaigns" ON campaign_metrics
  FOR SELECT
  USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Leads
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "leads_own_leads" ON leads;
CREATE POLICY "leads_own_leads" ON leads
  FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Subscriptions
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "subscriptions_own_subscription" ON subscriptions;
CREATE POLICY "subscriptions_own_subscription" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Targeting Diagnostics (service role only)
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "targeting_diagnostics_service_role" ON targeting_diagnostics;
CREATE POLICY "targeting_diagnostics_service_role" ON targeting_diagnostics
  FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Targeting Plans (service role only)
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "targeting_plans_service_role" ON targeting_plans;
CREATE POLICY "targeting_plans_service_role" ON targeting_plans
  FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Agent Decisions (service role only)
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "agent_decisions_service_role" ON agent_decisions;
CREATE POLICY "agent_decisions_service_role" ON agent_decisions
  FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Meta Tokens (service role only)
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "meta_tokens_service_role" ON meta_tokens;
CREATE POLICY "meta_tokens_service_role" ON meta_tokens
  FOR ALL
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Alerts (users can read own alerts, service role can write)
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "alerts_own_alerts" ON alerts;
CREATE POLICY "alerts_own_alerts" ON alerts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "alerts_service_role_insert" ON alerts;
CREATE POLICY "alerts_service_role_insert" ON alerts
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES - Specialty Templates (public read, service role write)
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "specialty_templates_public_read" ON specialty_templates;
CREATE POLICY "specialty_templates_public_read" ON specialty_templates
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "specialty_templates_service_role_write" ON specialty_templates;
CREATE POLICY "specialty_templates_service_role_write" ON specialty_templates
  FOR ALL
  USING (auth.role() = 'service_role');
