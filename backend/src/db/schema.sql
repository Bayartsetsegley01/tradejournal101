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
SELECT 'FREE', 0, 0, '{"max_trades_per_month": 30, "ai_analysis": false}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'FREE');

INSERT INTO plans (name, price_monthly, price_yearly, features)
SELECT 'PRO', 29000, 290000, '{"max_trades_per_month": -1, "ai_analysis": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'PRO');

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
