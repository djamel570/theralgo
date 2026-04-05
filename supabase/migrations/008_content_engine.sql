-- Content Engine: Voice DNA, Editorial Calendar, Content Pieces, Analytics
-- Supports the automated organic content generation system

-- ══════════════════════════════════════════════════════════
-- 1. Voice DNA profiles — captures each therapist's unique voice
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

  -- Core voice attributes (0-100 scores)
  tone_warmth INT DEFAULT 70 CHECK (tone_warmth BETWEEN 0 AND 100),
  tone_authority INT DEFAULT 50 CHECK (tone_authority BETWEEN 0 AND 100),
  tone_empathy INT DEFAULT 80 CHECK (tone_empathy BETWEEN 0 AND 100),
  tone_humor INT DEFAULT 20 CHECK (tone_humor BETWEEN 0 AND 100),
  tone_directness INT DEFAULT 50 CHECK (tone_directness BETWEEN 0 AND 100),

  -- Vocabulary & style
  preferred_expressions JSONB DEFAULT '[]'::jsonb,    -- ["le cerveau part en mode survie", ...]
  avoided_expressions JSONB DEFAULT '[]'::jsonb,      -- ["patient" vs "client", ...]
  metaphor_style TEXT DEFAULT 'moderate',              -- minimal, moderate, rich
  sentence_length TEXT DEFAULT 'medium',               -- short, medium, long
  formality_level TEXT DEFAULT 'accessible',           -- academic, professional, accessible, casual

  -- Extracted from video analyses & content
  recurring_themes JSONB DEFAULT '[]'::jsonb,          -- themes the therapist naturally gravitates to
  explanation_patterns JSONB DEFAULT '[]'::jsonb,      -- how they typically explain concepts
  signature_phrases JSONB DEFAULT '[]'::jsonb,         -- their unique catchphrases

  -- Voice sample references
  source_video_ids JSONB DEFAULT '[]'::jsonb,          -- video_analyses used to build profile
  source_content_ids JSONB DEFAULT '[]'::jsonb,        -- content pieces used as reference

  -- Learning state
  confidence_score FLOAT DEFAULT 0.0,                  -- 0-1, improves as more data collected
  samples_analyzed INT DEFAULT 0,
  last_calibrated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(therapist_id)
);

-- ══════════════════════════════════════════════════════════
-- 2. SEO keyword intelligence
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

  keyword TEXT NOT NULL,
  keyword_type TEXT NOT NULL CHECK (keyword_type IN ('primary', 'secondary', 'long_tail', 'local', 'question')),
  search_volume_estimate INT DEFAULT 0,
  competition_level TEXT DEFAULT 'medium' CHECK (competition_level IN ('low', 'medium', 'high')),
  relevance_score FLOAT DEFAULT 0.5 CHECK (relevance_score BETWEEN 0 AND 1),

  -- Cluster organization
  cluster_name TEXT,                                   -- e.g. "anxiété", "burn-out"
  is_pillar BOOLEAN DEFAULT false,                     -- true = pillar content keyword

  -- Performance tracking
  current_ranking INT,                                 -- Google position if known
  clicks_last_30d INT DEFAULT 0,
  impressions_last_30d INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(therapist_id, keyword)
);

-- ══════════════════════════════════════════════════════════
-- 3. Content pieces — generated & published content
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  calendar_id UUID,                                    -- link to editorial calendar entry

  -- Content type & platform
  content_type TEXT NOT NULL CHECK (content_type IN (
    'blog_article', 'linkedin_post', 'instagram_post', 'instagram_carousel',
    'reel_script', 'tiktok_script', 'email_newsletter', 'google_business_post',
    'twitter_post', 'facebook_post'
  )),

  -- Content
  title TEXT,
  body TEXT NOT NULL,
  excerpt TEXT,                                        -- short version / teaser
  hashtags JSONB DEFAULT '[]'::jsonb,
  visual_suggestions JSONB DEFAULT '[]'::jsonb,        -- AI-suggested image/carousel descriptions
  cta_text TEXT,                                       -- call to action
  cta_url TEXT,

  -- SEO (for blog articles)
  meta_title TEXT,
  meta_description TEXT,
  target_keywords JSONB DEFAULT '[]'::jsonb,
  slug TEXT,

  -- Strategy link
  target_intention TEXT,                               -- which patient intention this targets
  target_segment TEXT,                                 -- which segment from Signal Accelerator
  funnel_stage TEXT CHECK (funnel_stage IN ('awareness', 'consideration', 'decision')),

  -- Status & publishing
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'published', 'archived')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_url TEXT,

  -- Voice adherence
  voice_match_score FLOAT,                             -- how well it matches Voice DNA

  -- Generation metadata
  generation_prompt TEXT,                              -- the prompt used to generate
  generation_model TEXT,                               -- Claude model used
  edited_by_therapist BOOLEAN DEFAULT false,
  therapist_edits_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- 4. Editorial calendar — weekly content planning
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS editorial_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

  -- Week identification
  week_start DATE NOT NULL,                            -- Monday of the week
  week_number INT NOT NULL,
  year INT NOT NULL,

  -- Theme & strategy
  weekly_theme TEXT NOT NULL,                           -- e.g. "Gérer l'anxiété au quotidien"
  theme_rationale TEXT,                                 -- why this theme was chosen
  target_intention TEXT,                                -- primary intention to target
  seasonal_hook TEXT,                                   -- seasonal relevance if any

  -- Planned content slots (references to content_pieces)
  planned_content JSONB DEFAULT '[]'::jsonb,           -- [{type, status, content_id}]

  -- Performance of the week
  total_impressions INT DEFAULT 0,
  total_engagement INT DEFAULT 0,
  leads_generated INT DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped')),
  approved_by_therapist BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(therapist_id, week_start)
);

-- ══════════════════════════════════════════════════════════
-- 5. Content analytics — per-piece performance tracking
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_pieces(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

  -- Engagement metrics
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  saves INT DEFAULT 0,
  clicks INT DEFAULT 0,

  -- Conversion metrics
  site_visits INT DEFAULT 0,                           -- visits to therapist site from this content
  leads_generated INT DEFAULT 0,
  bookings_generated INT DEFAULT 0,
  product_sales INT DEFAULT 0,

  -- SEO metrics (for blog articles)
  organic_impressions INT DEFAULT 0,
  organic_clicks INT DEFAULT 0,
  avg_position FLOAT,

  -- Computed scores
  engagement_rate FLOAT DEFAULT 0.0,
  conversion_rate FLOAT DEFAULT 0.0,
  content_score FLOAT DEFAULT 0.0,                     -- overall performance 0-100

  -- Snapshot date
  measured_at TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- 6. Content templates — reusable format templates
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  content_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Template structure
  structure JSONB NOT NULL,                            -- sections, placeholders, guidelines
  example TEXT,                                        -- filled example

  -- Performance data
  avg_engagement_rate FLOAT DEFAULT 0.0,
  times_used INT DEFAULT 0,

  -- Specialty targeting
  specialties JSONB DEFAULT '[]'::jsonb,               -- which specialties this works for

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- Indexes
-- ══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_voice_profiles_therapist ON voice_profiles(therapist_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_therapist ON seo_keywords(therapist_id);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_cluster ON seo_keywords(therapist_id, cluster_name);
CREATE INDEX IF NOT EXISTS idx_content_pieces_therapist ON content_pieces(therapist_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_status ON content_pieces(therapist_id, status);
CREATE INDEX IF NOT EXISTS idx_content_pieces_type ON content_pieces(therapist_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_pieces_scheduled ON content_pieces(scheduled_for) WHERE status = 'ready';
CREATE INDEX IF NOT EXISTS idx_editorial_calendar_therapist ON editorial_calendar(therapist_id, week_start);
CREATE INDEX IF NOT EXISTS idx_content_analytics_content ON content_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_therapist ON content_analytics(therapist_id, measured_at);

-- ══════════════════════════════════════════════════════════
-- RLS Policies
-- ══════════════════════════════════════════════════════════
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;

-- Voice profiles: therapist sees only their own
CREATE POLICY voice_profiles_select ON voice_profiles FOR SELECT USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY voice_profiles_insert ON voice_profiles FOR INSERT WITH CHECK (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY voice_profiles_update ON voice_profiles FOR UPDATE USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);

-- SEO keywords: therapist sees only their own
CREATE POLICY seo_keywords_select ON seo_keywords FOR SELECT USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY seo_keywords_all ON seo_keywords FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);

-- Content pieces: therapist sees only their own
CREATE POLICY content_pieces_select ON content_pieces FOR SELECT USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY content_pieces_all ON content_pieces FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);

-- Editorial calendar: therapist sees only their own
CREATE POLICY editorial_calendar_select ON editorial_calendar FOR SELECT USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY editorial_calendar_all ON editorial_calendar FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);

-- Content analytics: therapist sees only their own
CREATE POLICY content_analytics_select ON content_analytics FOR SELECT USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY content_analytics_all ON content_analytics FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);

-- Content templates: everyone can read
CREATE POLICY content_templates_select ON content_templates FOR SELECT USING (true);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_voice_profiles_updated
  BEFORE UPDATE ON voice_profiles FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
CREATE TRIGGER trg_seo_keywords_updated
  BEFORE UPDATE ON seo_keywords FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
CREATE TRIGGER trg_content_pieces_updated
  BEFORE UPDATE ON content_pieces FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
CREATE TRIGGER trg_editorial_calendar_updated
  BEFORE UPDATE ON editorial_calendar FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
CREATE TRIGGER trg_content_templates_updated
  BEFORE UPDATE ON content_templates FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
