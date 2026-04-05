-- Signal Accelerator, Creative Director AI, and Adaptive Funnel Tables
-- This migration introduces tables for micro-event tracking, video analysis/scripts, and funnel variants

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. MICRO EVENTS TABLE (Signal Accelerator)
-- Track granular user interactions and engagement events
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS micro_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_value NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address TEXT,
  fbc TEXT,
  fbp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_micro_events_session ON micro_events(session_id);
CREATE INDEX idx_micro_events_campaign ON micro_events(campaign_id);
CREATE INDEX idx_micro_events_type ON micro_events(event_type);
CREATE INDEX idx_micro_events_created ON micro_events(created_at);

-- Enable RLS on micro_events
ALTER TABLE micro_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for micro_events
DROP POLICY IF EXISTS "micro_events_user_access" ON micro_events;
CREATE POLICY "micro_events_user_access" ON micro_events
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "micro_events_insert" ON micro_events;
CREATE POLICY "micro_events_insert" ON micro_events
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. VIDEO ANALYSES TABLE (Creative Director AI)
-- Store analysis results of uploaded videos
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS video_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_upload_id UUID REFERENCES media_uploads(id) ON DELETE SET NULL,
  video_url TEXT,
  overall_score INTEGER NOT NULL DEFAULT 0,
  dimensions JSONB NOT NULL DEFAULT '{}',
  strengths JSONB DEFAULT '[]',
  improvements JSONB DEFAULT '[]',
  predicted_ctr TEXT DEFAULT 'low',
  ready_to_launch BOOLEAN DEFAULT false,
  analysis_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_analyses_user ON video_analyses(user_id);
CREATE INDEX idx_video_analyses_media ON video_analyses(media_upload_id);

-- Enable RLS on video_analyses
ALTER TABLE video_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_analyses
DROP POLICY IF EXISTS "video_analyses_select_own" ON video_analyses;
CREATE POLICY "video_analyses_select_own" ON video_analyses
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "video_analyses_own_insert" ON video_analyses;
CREATE POLICY "video_analyses_own_insert" ON video_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "video_analyses_own_update" ON video_analyses;
CREATE POLICY "video_analyses_own_update" ON video_analyses
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "video_analyses_own_delete" ON video_analyses;
CREATE POLICY "video_analyses_own_delete" ON video_analyses
  FOR DELETE
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Auto-update trigger for video_analyses
DROP TRIGGER IF EXISTS update_video_analyses_updated_at ON video_analyses;
CREATE TRIGGER update_video_analyses_updated_at
  BEFORE UPDATE ON video_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. VIDEO SCRIPTS TABLE (Creative Director AI)
-- Store generated video scripts with shot-by-shot instructions
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS video_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES therapist_profiles(id) ON DELETE CASCADE,
  target_segment TEXT NOT NULL,
  title TEXT NOT NULL,
  total_duration TEXT,
  shots JSONB NOT NULL DEFAULT '[]',
  tips JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  tone TEXT DEFAULT 'warm',
  format TEXT DEFAULT 'talking_head',
  is_variant_of UUID REFERENCES video_scripts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_scripts_user ON video_scripts(user_id);
CREATE INDEX idx_video_scripts_profile ON video_scripts(profile_id);
CREATE INDEX idx_video_scripts_segment ON video_scripts(target_segment);

-- Enable RLS on video_scripts
ALTER TABLE video_scripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_scripts
DROP POLICY IF EXISTS "video_scripts_select_own" ON video_scripts;
CREATE POLICY "video_scripts_select_own" ON video_scripts
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "video_scripts_own_insert" ON video_scripts;
CREATE POLICY "video_scripts_own_insert" ON video_scripts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "video_scripts_own_update" ON video_scripts;
CREATE POLICY "video_scripts_own_update" ON video_scripts
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "video_scripts_own_delete" ON video_scripts;
CREATE POLICY "video_scripts_own_delete" ON video_scripts
  FOR DELETE
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Auto-update trigger for video_scripts
DROP TRIGGER IF EXISTS update_video_scripts_updated_at ON video_scripts;
CREATE TRIGGER update_video_scripts_updated_at
  BEFORE UPDATE ON video_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. FUNNEL VARIANTS TABLE (Adaptive Funnel)
-- Store segment-specific funnel variations with customized content
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS funnel_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES therapist_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segment_key TEXT NOT NULL,
  segment_label TEXT NOT NULL,
  hero_content JSONB NOT NULL DEFAULT '{}',
  problem_content JSONB NOT NULL DEFAULT '{}',
  approach_content JSONB NOT NULL DEFAULT '{}',
  testimonial_content JSONB NOT NULL DEFAULT '{}',
  form_content JSONB NOT NULL DEFAULT '{}',
  seo_meta JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, segment_key)
);

CREATE INDEX idx_funnel_variants_profile ON funnel_variants(profile_id);
CREATE INDEX idx_funnel_variants_segment ON funnel_variants(segment_key);
CREATE INDEX idx_funnel_variants_user ON funnel_variants(user_id);

-- Enable RLS on funnel_variants
ALTER TABLE funnel_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for funnel_variants
DROP POLICY IF EXISTS "funnel_variants_select_own" ON funnel_variants;
CREATE POLICY "funnel_variants_select_own" ON funnel_variants
  FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "funnel_variants_own_insert" ON funnel_variants;
CREATE POLICY "funnel_variants_own_insert" ON funnel_variants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "funnel_variants_own_update" ON funnel_variants;
CREATE POLICY "funnel_variants_own_update" ON funnel_variants
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "funnel_variants_own_delete" ON funnel_variants;
CREATE POLICY "funnel_variants_own_delete" ON funnel_variants
  FOR DELETE
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Auto-update trigger for funnel_variants
DROP TRIGGER IF EXISTS update_funnel_variants_updated_at ON funnel_variants;
CREATE TRIGGER update_funnel_variants_updated_at
  BEFORE UPDATE ON funnel_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. SESSION SCORES TABLE (Signal Accelerator Analytics)
-- Aggregate micro-event data into session-level quality and conversion metrics
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS session_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  quality_score NUMERIC NOT NULL DEFAULT 0,
  events_count INTEGER NOT NULL DEFAULT 0,
  max_funnel_depth TEXT,
  converted BOOLEAN DEFAULT false,
  segment_key TEXT,
  time_on_page INTEGER,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_scores_campaign ON session_scores(campaign_id);
CREATE INDEX idx_session_scores_converted ON session_scores(converted);
CREATE INDEX idx_session_scores_segment ON session_scores(segment_key);

-- Enable RLS on session_scores
ALTER TABLE session_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_scores
DROP POLICY IF EXISTS "session_scores_user_access" ON session_scores;
CREATE POLICY "session_scores_user_access" ON session_scores
  FOR SELECT
  USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "session_scores_insert" ON session_scores;
CREATE POLICY "session_scores_insert" ON session_scores
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

-- Auto-update trigger for session_scores
DROP TRIGGER IF EXISTS update_session_scores_updated_at ON session_scores;
CREATE TRIGGER update_session_scores_updated_at
  BEFORE UPDATE ON session_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
