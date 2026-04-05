-- Corporate Wellness Module
-- Helps therapists sell B2B services to companies (workshops, group sessions, EAP)

-- ══════════════════════════════════════════════════════════
-- 1. Corporate clients — companies the therapist works with
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS corporate_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

  -- Company info
  company_name TEXT NOT NULL,
  industry TEXT,                                        -- tech, finance, santé, education, etc.
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  website TEXT,
  logo_url TEXT,

  -- Primary contact
  contact_name TEXT NOT NULL,
  contact_role TEXT,                                    -- DRH, Responsable QVT, CEO
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Contract details
  contract_type TEXT CHECK (contract_type IN ('one_time', 'recurring', 'annual', 'per_session')),
  contract_value FLOAT DEFAULT 0,                      -- total contract value in €
  contract_start DATE,
  contract_end DATE,
  sessions_included INT DEFAULT 0,                     -- number of sessions in contract
  sessions_used INT DEFAULT 0,

  -- Billing
  billing_frequency TEXT CHECK (billing_frequency IN ('per_session', 'monthly', 'quarterly', 'annually', 'upfront')),
  hourly_rate FLOAT,
  package_rate FLOAT,

  -- Status
  status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'proposal_sent', 'negotiating', 'active', 'paused', 'completed', 'lost')),
  lost_reason TEXT,

  -- Notes
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- 2. Corporate proposals — AI-generated B2B proposals
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS corporate_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  client_id UUID REFERENCES corporate_clients(id) ON DELETE SET NULL,

  -- Proposal content
  title TEXT NOT NULL,
  executive_summary TEXT,
  company_context TEXT,                                -- analysis of company's needs
  proposed_services JSONB NOT NULL,                    -- [{type, description, frequency, price}]
  methodology TEXT,                                    -- therapeutic approach explanation
  timeline JSONB,                                      -- [{phase, duration, activities}]
  pricing JSONB NOT NULL,                              -- {packages: [{name, price, includes}]}
  roi_analysis JSONB,                                  -- {absenteeism_reduction, turnover_savings, productivity_gain}
  therapist_bio TEXT,
  references_text TEXT,

  -- KPIs proposed
  proposed_kpis JSONB DEFAULT '[]'::jsonb,             -- [{kpi, baseline, target, measurement}]

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  valid_until DATE,

  -- Generation metadata
  generation_prompt TEXT,
  generation_model TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- 3. Corporate sessions — group sessions / workshops
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS corporate_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,

  -- Session details
  title TEXT NOT NULL,                                 -- "Atelier Gestion du Stress"
  session_type TEXT NOT NULL CHECK (session_type IN (
    'workshop', 'group_therapy', 'seminar', 'webinar',
    'individual_eap', 'team_coaching', 'crisis_intervention',
    'training', 'meditation', 'assessment'
  )),
  description TEXT,
  objectives JSONB DEFAULT '[]'::jsonb,                -- learning objectives

  -- Scheduling
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  location TEXT,                                       -- "Salle de réunion 3A" or "Visio Zoom"
  is_remote BOOLEAN DEFAULT false,
  meeting_link TEXT,

  -- Participants
  max_participants INT DEFAULT 20,
  registered_count INT DEFAULT 0,
  attended_count INT DEFAULT 0,
  participants JSONB DEFAULT '[]'::jsonb,               -- [{name, email, attended, feedback_score}]

  -- Content
  materials JSONB DEFAULT '[]'::jsonb,                  -- [{title, type, url}] handouts, slides
  exercises JSONB DEFAULT '[]'::jsonb,                  -- in-session exercises

  -- Feedback & outcomes
  avg_satisfaction FLOAT,                              -- 1-5 rating
  feedback_responses JSONB DEFAULT '[]'::jsonb,        -- [{participant, rating, comment}]
  outcomes_notes TEXT,

  -- Billing
  session_rate FLOAT,
  is_billed BOOLEAN DEFAULT false,
  invoice_id TEXT,

  -- Status
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- 4. Corporate reports — anonymized outcomes for HR
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS corporate_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,

  -- Report details
  title TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'post_program', 'custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Anonymized metrics
  total_sessions INT DEFAULT 0,
  total_participants INT DEFAULT 0,
  unique_participants INT DEFAULT 0,
  avg_satisfaction FLOAT,
  participation_rate FLOAT,                            -- % of eligible employees who participated

  -- Outcome metrics (anonymized, aggregated)
  wellbeing_score_before FLOAT,                        -- avg pre-program score
  wellbeing_score_after FLOAT,                         -- avg post-program score
  stress_reduction_pct FLOAT,
  engagement_improvement_pct FLOAT,

  -- ROI metrics for HR
  estimated_absenteeism_reduction FLOAT,               -- days saved
  estimated_turnover_savings FLOAT,                    -- €
  estimated_productivity_gain FLOAT,                   -- % improvement
  roi_multiplier FLOAT,                                -- x return on investment

  -- Report content (AI-generated)
  executive_summary TEXT,
  detailed_analysis TEXT,
  recommendations TEXT,
  next_steps TEXT,

  -- Charts data
  charts_data JSONB DEFAULT '{}'::jsonb,               -- pre-computed chart data

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'viewed')),
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- 5. Corporate templates — reusable workshop/program templates
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS corporate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'stress', 'burnout', 'communication', 'leadership',
    'resilience', 'conflict', 'change_management', 'wellbeing',
    'work_life_balance', 'team_cohesion', 'diversity', 'custom'
  )),
  description TEXT,
  target_audience TEXT,                                -- "Managers", "Tous les collaborateurs", "RH"
  recommended_duration INT,                            -- minutes
  recommended_group_size TEXT,                         -- "8-12", "15-20"
  format TEXT CHECK (format IN ('workshop', 'seminar', 'program', 'webinar')),

  -- Content structure
  outline JSONB NOT NULL,                              -- [{section, duration, activity, materials}]
  materials_list JSONB DEFAULT '[]'::jsonb,
  exercises JSONB DEFAULT '[]'::jsonb,
  talking_points JSONB DEFAULT '[]'::jsonb,

  -- Pricing guidance
  suggested_price_range JSONB,                         -- {min, max, per: "session" | "participant"}

  -- Performance
  times_used INT DEFAULT 0,
  avg_satisfaction FLOAT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- 6. Wellness assessments — employee wellbeing surveys
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS wellness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES corporate_sessions(id),

  -- Assessment type
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('pre_program', 'post_program', 'periodic', 'post_session')),

  -- Anonymized response
  respondent_hash TEXT,                                -- hashed identifier for pre/post matching
  responses JSONB NOT NULL,                            -- [{question_id, question, answer, score}]
  overall_score FLOAT,

  -- Dimensional scores (0-10)
  stress_level FLOAT,
  work_satisfaction FLOAT,
  team_cohesion FLOAT,
  energy_level FLOAT,
  sleep_quality FLOAT,
  motivation FLOAT,

  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- Indexes
-- ══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_corp_clients_therapist ON corporate_clients(therapist_id);
CREATE INDEX IF NOT EXISTS idx_corp_clients_status ON corporate_clients(therapist_id, status);
CREATE INDEX IF NOT EXISTS idx_corp_proposals_therapist ON corporate_proposals(therapist_id);
CREATE INDEX IF NOT EXISTS idx_corp_proposals_client ON corporate_proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_corp_proposals_status ON corporate_proposals(therapist_id, status);
CREATE INDEX IF NOT EXISTS idx_corp_sessions_therapist ON corporate_sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_corp_sessions_client ON corporate_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_corp_sessions_date ON corporate_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_corp_sessions_status ON corporate_sessions(therapist_id, status);
CREATE INDEX IF NOT EXISTS idx_corp_reports_therapist ON corporate_reports(therapist_id);
CREATE INDEX IF NOT EXISTS idx_corp_reports_client ON corporate_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_corp_templates_category ON corporate_templates(category);
CREATE INDEX IF NOT EXISTS idx_wellness_assess_therapist ON wellness_assessments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_wellness_assess_client ON wellness_assessments(client_id);
CREATE INDEX IF NOT EXISTS idx_wellness_assess_session ON wellness_assessments(session_id);

-- ══════════════════════════════════════════════════════════
-- RLS Policies
-- ══════════════════════════════════════════════════════════
ALTER TABLE corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_assessments ENABLE ROW LEVEL SECURITY;

-- Therapist sees own data
CREATE POLICY corp_clients_therapist ON corporate_clients FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY corp_proposals_therapist ON corporate_proposals FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY corp_sessions_therapist ON corporate_sessions FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY corp_reports_therapist ON corporate_reports FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY corp_templates_read ON corporate_templates FOR SELECT USING (true);
CREATE POLICY wellness_assess_therapist ON wellness_assessments FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
-- Anonymous insert for assessments (employees fill them without auth)
CREATE POLICY wellness_assess_anon_insert ON wellness_assessments FOR INSERT WITH CHECK (true);

-- Triggers
CREATE TRIGGER trg_corp_clients_updated
  BEFORE UPDATE ON corporate_clients FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
CREATE TRIGGER trg_corp_proposals_updated
  BEFORE UPDATE ON corporate_proposals FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
CREATE TRIGGER trg_corp_sessions_updated
  BEFORE UPDATE ON corporate_sessions FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
CREATE TRIGGER trg_corp_reports_updated
  BEFORE UPDATE ON corporate_reports FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
CREATE TRIGGER trg_corp_templates_updated
  BEFORE UPDATE ON corporate_templates FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
