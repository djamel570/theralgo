-- Digital Products
CREATE TABLE IF NOT EXISTS digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES therapist_profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('audio_program', 'mini_course', 'live_workshop', 'subscription')),
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  price_amount INTEGER NOT NULL,  -- in cents
  price_currency TEXT DEFAULT 'EUR',
  compare_at_price INTEGER,      -- crossed-out price in cents
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  modules JSONB NOT NULL DEFAULT '[]',
  sales_page_content JSONB NOT NULL DEFAULT '{}',
  email_sequence JSONB DEFAULT '[]',
  ad_campaign_config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  therapist_user_id UUID NOT NULL REFERENCES auth.users(id),
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  amount INTEGER NOT NULL,        -- in cents
  currency TEXT DEFAULT 'EUR',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  access_token TEXT UNIQUE,
  access_url TEXT,
  delivered_at TIMESTAMPTZ,
  campaign_id TEXT,  -- Meta campaign ID (not FK)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled emails (for drip delivery)
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product analytics
CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- 'page_view', 'checkout_start', 'purchase', 'access', 'module_complete'
  session_id TEXT,
  buyer_email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_digital_products_user_id ON digital_products(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_profile_id ON digital_products(profile_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON digital_products(status);
CREATE INDEX IF NOT EXISTS idx_digital_products_slug ON digital_products(slug);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_therapist_user_id ON purchases(therapist_user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_email ON purchases(buyer_email);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_access_token ON purchases(access_token);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_purchase_id ON scheduled_emails(purchase_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_for ON scheduled_emails(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_event_type ON product_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_product_analytics_buyer_email ON product_analytics(buyer_email);

-- RLS Policies
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;

-- Digital Products: Public read for published, user CRUD for own
CREATE POLICY digital_products_public_read ON digital_products
  FOR SELECT
  USING (status = 'published');

CREATE POLICY digital_products_user_crud ON digital_products
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Purchases: User can read own purchases, therapist can read their product purchases
CREATE POLICY purchases_own_purchases ON purchases
  FOR SELECT
  USING (therapist_user_id = auth.uid() OR buyer_email = COALESCE(auth.jwt()->>'email', ''));

CREATE POLICY purchases_therapist_crud ON purchases
  USING (therapist_user_id = auth.uid())
  WITH CHECK (therapist_user_id = auth.uid());

-- Scheduled Emails: Service role only
CREATE POLICY scheduled_emails_service ON scheduled_emails
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Product Analytics: Service role only
CREATE POLICY product_analytics_service ON product_analytics
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_digital_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER digital_products_updated_at_trigger
BEFORE UPDATE ON digital_products
FOR EACH ROW
EXECUTE FUNCTION update_digital_products_updated_at();

CREATE TRIGGER purchases_updated_at_trigger
BEFORE UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION update_digital_products_updated_at();
