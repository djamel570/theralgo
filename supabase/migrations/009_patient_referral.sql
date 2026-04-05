-- Patient Referral System: digitalized word-of-mouth
-- Patients share unique links to refer friends/family for consultations or digital products

-- ══════════════════════════════════════════════════════════
-- 1. Referral links — unique shareable links per patient
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

  -- Who is sharing
  referrer_name TEXT NOT NULL,                         -- patient's first name
  referrer_email TEXT,                                 -- for reward notification
  referrer_phone TEXT,                                 -- for WhatsApp integration

  -- Link config
  code TEXT NOT NULL UNIQUE,                           -- short unique code: "dr-martin-ref-abc123"
  slug TEXT NOT NULL UNIQUE,                           -- URL slug: used in /r/[slug]

  -- What the link leads to
  link_type TEXT NOT NULL CHECK (link_type IN ('booking', 'product', 'both')),
  product_id UUID REFERENCES digital_products(id),     -- if linking to a specific product

  -- Personalization
  referrer_message TEXT,                               -- "Mon psy m'a beaucoup aidé, je te le recommande"
  therapist_message TEXT,                              -- custom message from the therapist

  -- Reward config
  reward_type TEXT CHECK (reward_type IN ('discount', 'free_session', 'free_product', 'credit', 'none')),
  reward_value FLOAT DEFAULT 0,                        -- 10 = 10€ or 10%
  reward_unit TEXT CHECK (reward_unit IN ('euro', 'percent')),
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,

  -- Tracking
  total_clicks INT DEFAULT 0,
  total_shares INT DEFAULT 0,
  total_bookings INT DEFAULT 0,
  total_product_sales INT DEFAULT 0,
  total_revenue_generated FLOAT DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,                              -- optional expiry

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- 2. Referral clicks — every click tracked
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

  -- Click context
  source TEXT CHECK (source IN ('whatsapp', 'email', 'sms', 'facebook', 'instagram', 'twitter', 'copy', 'qr_code', 'other')),
  ip_hash TEXT,                                        -- hashed IP for dedup (privacy-safe)
  user_agent TEXT,
  referrer_url TEXT,                                   -- HTTP referrer

  -- Geo
  country TEXT,
  city TEXT,

  -- Conversion
  converted BOOLEAN DEFAULT false,
  conversion_type TEXT CHECK (conversion_type IN ('booking', 'product_purchase', 'lead_capture')),
  conversion_id TEXT,                                  -- booking_id or purchase_id
  conversion_value FLOAT DEFAULT 0,
  converted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- 3. Referral rewards — track rewards given to referrers
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  click_id UUID REFERENCES referral_clicks(id),

  -- Reward details
  referrer_name TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value FLOAT NOT NULL,
  reward_unit TEXT NOT NULL,
  reward_description TEXT,                             -- "10€ de réduction sur votre prochaine séance"

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'claimed', 'expired')),
  sent_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Delivery
  delivery_method TEXT CHECK (delivery_method IN ('email', 'sms', 'in_app')),
  delivery_code TEXT,                                  -- discount code or voucher

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- 4. Referral campaigns — therapist-configured sharing prompts
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

  name TEXT NOT NULL,                                  -- "Post-séance", "Achat produit", "Anniversaire"
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'post_booking', 'post_session', 'post_purchase',
    'milestone', 'manual', 'scheduled'
  )),

  -- Trigger config
  trigger_delay_hours INT DEFAULT 24,                  -- hours after trigger to send
  trigger_conditions JSONB DEFAULT '{}'::jsonb,        -- e.g. {"min_sessions": 3}

  -- Message templates
  share_message_template TEXT NOT NULL,                 -- "Bonjour {referrer_name}, merci pour votre confiance..."
  whatsapp_message TEXT,                               -- pre-filled WhatsApp message
  email_subject TEXT,
  email_body TEXT,
  sms_message TEXT,

  -- Link config
  link_type TEXT DEFAULT 'booking',
  product_id UUID REFERENCES digital_products(id),
  reward_type TEXT DEFAULT 'none',
  reward_value FLOAT DEFAULT 0,
  reward_unit TEXT DEFAULT 'euro',

  -- Performance
  total_sent INT DEFAULT 0,
  total_links_created INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  conversion_rate FLOAT DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- 5. Referral messages — sent messages log
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS referral_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES referral_campaigns(id),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,

  -- Delivery
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
  recipient_contact TEXT NOT NULL,                     -- phone or email
  message_content TEXT NOT NULL,
  share_url TEXT NOT NULL,

  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- Indexes
-- ══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_referral_links_therapist ON referral_links(therapist_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(code);
CREATE INDEX IF NOT EXISTS idx_referral_links_slug ON referral_links(slug);
CREATE INDEX IF NOT EXISTS idx_referral_links_active ON referral_links(therapist_id, is_active);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_link ON referral_clicks(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_therapist ON referral_clicks(therapist_id, created_at);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_converted ON referral_clicks(referral_link_id) WHERE converted = true;
CREATE INDEX IF NOT EXISTS idx_referral_rewards_link ON referral_rewards(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(therapist_id, status);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_therapist ON referral_campaigns(therapist_id);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_trigger ON referral_campaigns(therapist_id, trigger_type, is_active);
CREATE INDEX IF NOT EXISTS idx_referral_messages_link ON referral_messages(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_referral_messages_campaign ON referral_messages(campaign_id);

-- ══════════════════════════════════════════════════════════
-- RLS Policies
-- ══════════════════════════════════════════════════════════
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_messages ENABLE ROW LEVEL SECURITY;

-- Referral links: therapist sees own, public can read active (for landing pages)
CREATE POLICY referral_links_therapist ON referral_links FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
CREATE POLICY referral_links_public_read ON referral_links FOR SELECT USING (
  is_active = true AND (expires_at IS NULL OR expires_at > now())
);

-- Clicks: therapist sees own
CREATE POLICY referral_clicks_therapist ON referral_clicks FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);
-- Allow anonymous insert for click tracking
CREATE POLICY referral_clicks_insert ON referral_clicks FOR INSERT WITH CHECK (true);

-- Rewards: therapist sees own
CREATE POLICY referral_rewards_therapist ON referral_rewards FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);

-- Campaigns: therapist sees own
CREATE POLICY referral_campaigns_therapist ON referral_campaigns FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);

-- Messages: therapist sees own
CREATE POLICY referral_messages_therapist ON referral_messages FOR ALL USING (
  therapist_id = (SELECT id FROM therapists WHERE user_id = auth.uid())
);

-- Triggers
CREATE TRIGGER trg_referral_links_updated
  BEFORE UPDATE ON referral_links FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
CREATE TRIGGER trg_referral_campaigns_updated
  BEFORE UPDATE ON referral_campaigns FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
