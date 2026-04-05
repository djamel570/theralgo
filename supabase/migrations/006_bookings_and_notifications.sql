-- Theralgo Bookings and Notifications Migration
-- Adds support for booking management, availability scheduling, and notifications

-- ═══════════════════════════════════════════════════════════════════════════
-- BOOKINGS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  therapist_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','attended','no_show','cancelled')),
  type TEXT DEFAULT 'first_session' CHECK (type IN ('first_session','follow_up')),
  price NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  source TEXT DEFAULT 'theralgo' CHECK (source IN ('theralgo','calendly','doctolib','other')),
  external_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_therapist_date
  ON bookings(therapist_user_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_lead
  ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_external_id
  ON bookings(external_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- THERAPIST AVAILABILITY TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS therapist_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  weekly_schedule JSONB NOT NULL DEFAULT '{}',
  blocked_dates JSONB DEFAULT '[]',
  slot_duration INTEGER DEFAULT 60,
  buffer_minutes INTEGER DEFAULT 15,
  timezone TEXT DEFAULT 'Europe/Paris',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_therapist_availability_user
  ON therapist_availability(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read
  ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created
  ON notifications(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- ONBOARDING PROGRESS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_step INTEGER DEFAULT 0,
  completed_steps JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user
  ON onboarding_progress(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATED LEDGER TRIGGER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Update trigger function for bookings
CREATE OR REPLACE FUNCTION update_bookings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_timestamp();

-- Update trigger function for therapist_availability
CREATE OR REPLACE FUNCTION update_therapist_availability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_therapist_availability_updated_at
  BEFORE UPDATE ON therapist_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_therapist_availability_timestamp();

-- Update trigger function for onboarding_progress
CREATE OR REPLACE FUNCTION update_onboarding_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress_timestamp();

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Therapists can view their own bookings"
  ON bookings FOR SELECT
  USING (therapist_user_id = auth.uid());

CREATE POLICY "Therapists can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (therapist_user_id = auth.uid());

CREATE POLICY "Therapists can update their bookings"
  ON bookings FOR UPDATE
  USING (therapist_user_id = auth.uid())
  WITH CHECK (therapist_user_id = auth.uid());

CREATE POLICY "Therapists can delete their bookings"
  ON bookings FOR DELETE
  USING (therapist_user_id = auth.uid());

-- Therapist availability policies
CREATE POLICY "Therapists can manage their availability"
  ON therapist_availability FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- Onboarding progress policies
CREATE POLICY "Users can manage their onboarding progress"
  ON onboarding_progress FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- SERVICE ROLE POLICIES (for server-side operations)
-- ═══════════════════════════════════════════════════════════════════════════

-- Allow service role to create bookings from leads
CREATE POLICY "Service can create bookings from leads"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Allow service role to read notifications
CREATE POLICY "Service can read notifications"
  ON notifications FOR SELECT
  USING (true);

-- Allow service role to insert notifications
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);
