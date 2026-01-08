-- TGFX Rewards / Daily Grind Database Schema
-- This script drops existing tables and recreates them

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS partnerships CASCADE;
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS checkins CASCADE;
DROP TABLE IF EXISTS streaks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop function if exists
DROP FUNCTION IF EXISTS get_user_balance(TEXT);

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks table
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  longest_count INTEGER DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Check-ins table
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  wins TEXT,
  struggles TEXT,
  focus TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- Rewards table
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  point_cost INTEGER NOT NULL,
  quantity INTEGER,
  claimed_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemptions table
CREATE TABLE redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  admin_notes TEXT,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Point transactions table
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('checkin', 'streak_bonus', 'redemption', 'refund', 'admin_grant')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones table (tasks users can complete for points)
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('broker_referral', 'discord_join', 'course_complete', 'introduction', 'checkin_streak', 'custom')),
  requirement_value INTEGER DEFAULT 1,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User milestone completions
CREATE TABLE user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by TEXT,
  notes TEXT,
  UNIQUE(user_id, milestone_id)
);

-- Activity feed table
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('checkin', 'milestone', 'reward_claim', 'streak', 'partner_connect', 'course_progress', 'introduction')),
  title TEXT NOT NULL,
  description TEXT,
  points_earned INTEGER DEFAULT 0,
  metadata JSONB,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner profiles table (for finding partners)
CREATE TABLE partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  is_seeking_partner BOOLEAN DEFAULT TRUE,
  trading_experience TEXT CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_trading INTEGER,
  trading_style TEXT,
  strengths TEXT,
  weaknesses TEXT,
  goals TEXT,
  availability TEXT,
  timezone TEXT,
  gender TEXT,
  age_range TEXT CHECK (age_range IN ('18-24', '25-34', '35-44', '45-54', '55+')),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partnerships table
CREATE TABLE partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to get user balance
CREATE OR REPLACE FUNCTION get_user_balance(p_user_id TEXT)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM point_transactions
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- Function to get streak leaderboard
CREATE OR REPLACE FUNCTION get_streak_leaderboard(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id TEXT,
  username TEXT,
  avatar_url TEXT,
  current_count INTEGER,
  longest_count INTEGER
) AS $$
  SELECT 
    u.id as user_id,
    u.username,
    u.avatar_url,
    COALESCE(s.current_count, 0) as current_count,
    COALESCE(s.longest_count, 0) as longest_count
  FROM users u
  LEFT JOIN streaks s ON u.id = s.user_id
  ORDER BY COALESCE(s.current_count, 0) DESC, COALESCE(s.longest_count, 0) DESC
  LIMIT limit_count;
$$ LANGUAGE SQL STABLE;

-- Indexes for performance
CREATE INDEX idx_checkins_user_date ON checkins(user_id, checkin_date);
CREATE INDEX idx_checkins_date ON checkins(checkin_date);
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_redemptions_user ON redemptions(user_id);
CREATE INDEX idx_redemptions_status ON redemptions(status);
CREATE INDEX idx_partnerships_users ON partnerships(sender_id, receiver_id);
CREATE INDEX idx_streaks_user ON streaks(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for server-side operations)
CREATE POLICY "Service role has full access to users" ON users FOR ALL USING (true);
CREATE POLICY "Service role has full access to streaks" ON streaks FOR ALL USING (true);
CREATE POLICY "Service role has full access to checkins" ON checkins FOR ALL USING (true);
CREATE POLICY "Service role has full access to rewards" ON rewards FOR ALL USING (true);
CREATE POLICY "Service role has full access to redemptions" ON redemptions FOR ALL USING (true);
CREATE POLICY "Service role has full access to point_transactions" ON point_transactions FOR ALL USING (true);
CREATE POLICY "Service role has full access to milestones" ON milestones FOR ALL USING (true);
CREATE POLICY "Service role has full access to user_milestones" ON user_milestones FOR ALL USING (true);
CREATE POLICY "Service role has full access to activity_feed" ON activity_feed FOR ALL USING (true);
CREATE POLICY "Service role has full access to partner_profiles" ON partner_profiles FOR ALL USING (true);
CREATE POLICY "Service role has full access to partnerships" ON partnerships FOR ALL USING (true);

-- Insert default milestones
INSERT INTO milestones (title, description, points, milestone_type, requirement_value, icon, sort_order) VALUES
  ('Join Our Broker', 'Sign up with our partner broker through the referral link', 500, 'broker_referral', 1, 'building', 1),
  ('Join Discord', 'Connect with the community on Discord', 100, 'discord_join', 1, 'message-circle', 2),
  ('Complete the Course', 'Finish all lessons in the Inner Market Mastery course', 1000, 'course_complete', 1, 'graduation-cap', 3),
  ('Introduce Yourself', 'Post an introduction in the community', 50, 'introduction', 1, 'user-plus', 4),
  ('7 Day Streak', 'Check in for 7 consecutive days', 100, 'checkin_streak', 7, 'flame', 5),
  ('30 Day Streak', 'Check in for 30 consecutive days', 500, 'checkin_streak', 30, 'flame', 6),
  ('100 Day Streak', 'Check in for 100 consecutive days', 2000, 'checkin_streak', 100, 'flame', 7);
