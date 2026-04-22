CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, CLOSED
  market_type VARCHAR(50), -- FOREX, CRYPTO, STOCKS
  symbol VARCHAR(50),
  direction VARCHAR(10), -- LONG, SHORT
  entry_date TIMESTAMP WITH TIME ZONE,
  exit_date TIMESTAMP WITH TIME ZONE,
  entry_price DECIMAL,
  exit_price DECIMAL,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  position_size DECIMAL,
  pnl DECIMAL,
  rr_ratio DECIMAL,
  strategy VARCHAR(100),
  session VARCHAR(50),
  notes TEXT,
  lessons_learned TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add columns if they don't exist (for existing databases)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='stop_loss') THEN
        ALTER TABLE trades ADD COLUMN stop_loss DECIMAL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='take_profit') THEN
        ALTER TABLE trades ADD COLUMN take_profit DECIMAL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='notes') THEN
        ALTER TABLE trades ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='lessons_learned') THEN
        ALTER TABLE trades ADD COLUMN lessons_learned TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='screenshot_url') THEN
        ALTER TABLE trades ADD COLUMN screenshot_url TEXT;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS trade_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  general_notes TEXT,
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emotion_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null for default
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10),
  color VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trade_emotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  emotion_id UUID REFERENCES emotion_tags(id) ON DELETE CASCADE,
  timing VARCHAR(50), -- BEFORE, AFTER
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tag_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null for default
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- POSITIVE, MISTAKE
  color VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trade_tags (
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tag_definitions(id) ON DELETE CASCADE,
  PRIMARY KEY (trade_id, tag_id)
);

CREATE TABLE IF NOT EXISTS trade_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL, -- FREE, PRO
  price_monthly DECIMAL,
  price_yearly DECIMAL,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, CANCELED, EXPIRED
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL NOT NULL,
  currency VARCHAR(10) DEFAULT 'MNT',
  status VARCHAR(50), -- PENDING, SUCCESS, FAILED
  payment_method VARCHAR(50),
  provider_transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO plans (name, price_monthly, price_yearly, features)
SELECT 'FREE', 0, 0, '{"max_trades_per_month": -1, "ai_analysis": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'FREE');

-- Add Google Auth and admin columns to users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='google_id') THEN
        ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='auth_provider') THEN
        ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    -- Make password_hash nullable for Google-only users
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
END $$;

-- Insert default tags if they don't exist
INSERT INTO emotion_tags (name, emoji, color, is_default)
SELECT 'Confident', '😎', 'blue', true
WHERE NOT EXISTS (SELECT 1 FROM emotion_tags WHERE name = 'Confident' AND is_default = true);

INSERT INTO emotion_tags (name, emoji, color, is_default)
SELECT 'Anxious', '😰', 'amber', true
WHERE NOT EXISTS (SELECT 1 FROM emotion_tags WHERE name = 'Anxious' AND is_default = true);

INSERT INTO tag_definitions (name, type, color, is_default)
SELECT 'Followed Plan', 'POSITIVE', 'emerald', true
WHERE NOT EXISTS (SELECT 1 FROM tag_definitions WHERE name = 'Followed Plan' AND is_default = true);

INSERT INTO tag_definitions (name, type, color, is_default)
SELECT 'Revenge Trading', 'MISTAKE', 'rose', true
WHERE NOT EXISTS (SELECT 1 FROM tag_definitions WHERE name = 'Revenge Trading' AND is_default = true);

-- Add extra trade detail columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='emotion_before') THEN
        ALTER TABLE trades ADD COLUMN emotion_before VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='emotion_after') THEN
        ALTER TABLE trades ADD COLUMN emotion_after VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='why_entered') THEN
        ALTER TABLE trades ADD COLUMN why_entered TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='what_happened') THEN
        ALTER TABLE trades ADD COLUMN what_happened TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='what_went_well') THEN
        ALTER TABLE trades ADD COLUMN what_went_well TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='mistakes_made') THEN
        ALTER TABLE trades ADD COLUMN mistakes_made TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='positive_tags') THEN
        ALTER TABLE trades ADD COLUMN positive_tags JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='mistake_tags') THEN
        ALTER TABLE trades ADD COLUMN mistake_tags JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='setup_description') THEN
        ALTER TABLE trades ADD COLUMN setup_description TEXT;
    END IF;
END $$;

-- Migration: emotion/tag columns (safe add if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='emotion_before') THEN
        ALTER TABLE trades ADD COLUMN emotion_before VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='emotion_after') THEN
        ALTER TABLE trades ADD COLUMN emotion_after VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='positive_tags') THEN
        ALTER TABLE trades ADD COLUMN positive_tags JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='mistake_tags') THEN
        ALTER TABLE trades ADD COLUMN mistake_tags JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='why_entered') THEN
        ALTER TABLE trades ADD COLUMN why_entered TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='what_happened') THEN
        ALTER TABLE trades ADD COLUMN what_happened TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='what_went_well') THEN
        ALTER TABLE trades ADD COLUMN what_went_well TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='mistakes_made') THEN
        ALTER TABLE trades ADD COLUMN mistakes_made TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='setup_description') THEN
        ALTER TABLE trades ADD COLUMN setup_description TEXT;
    END IF;
END $$;

-- Insert full default emotion tags
INSERT INTO emotion_tags (name, emoji, color, is_default)
SELECT name, emoji, color, true FROM (VALUES
  ('Тайван', '😌', 'blue', true),
  ('Итгэлтэй', '💪', 'emerald', true),
  ('Айсан', '😨', 'amber', true),
  ('FOMO', '🤯', 'rose', true),
  ('Тэвчээргүй', '😤', 'orange', true),
  ('Шунал', '🤑', 'yellow', true),
  ('Стресстэй', '😵', 'purple', true),
  ('Эргэлзсэн', '😞', 'slate', true)
) AS v(name, emoji, color, is_default)
WHERE NOT EXISTS (SELECT 1 FROM emotion_tags WHERE name = v.name AND is_default = true);

-- Insert full default mistake + positive tags
INSERT INTO tag_definitions (name, type, color, is_default)
SELECT name, type, color, true FROM (VALUES
  ('Followed Plan', 'POSITIVE', 'emerald', true),
  ('Сайн удирдсан', 'POSITIVE', 'blue', true),
  ('Төгс оролт', 'POSITIVE', 'teal', true),
  ('Тэвчээртэй хүлээсэн', 'POSITIVE', 'cyan', true),
  ('Сахилга баттай', 'POSITIVE', 'indigo', true),
  ('Revenge Trading', 'MISTAKE', 'rose', true),
  ('Төлөвлөгөө дагаагүй', 'MISTAKE', 'red', true),
  ('Stop Loss хөдөлгөсөн', 'MISTAKE', 'orange', true),
  ('Эрт гарсан', 'MISTAKE', 'amber', true),
  ('Хэт их арилжаа', 'MISTAKE', 'yellow', true),
  ('FOMO оролт', 'MISTAKE', 'pink', true)
) AS v(name, type, color, is_default)
WHERE NOT EXISTS (SELECT 1 FROM tag_definitions WHERE name = v.name AND is_default = true);

-- Migration: users table — Google Auth + Admin columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='google_id') THEN
        ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='auth_provider') THEN
        ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;
