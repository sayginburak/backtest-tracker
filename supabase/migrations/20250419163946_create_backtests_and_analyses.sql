-- Migration: Create backtests and analyses tables

-- backtests table
CREATE TABLE public.backtests (
  id TEXT PRIMARY KEY,
  backtest_date DATE NOT NULL,
  date_performed TIMESTAMP NOT NULL,
  no_setup_found BOOLEAN NOT NULL,
  has_liq_sweep BOOLEAN NOT NULL,
  swing_formation_time TIME NOT NULL,
  swing_formation_datetime TIMESTAMP NULL,
  obviousness_rating INTEGER NOT NULL,
  mss_time TIME NOT NULL,
  mss_datetime TIMESTAMP NULL,
  timeframe TEXT NOT NULL,
  is_protected_swing BOOLEAN NOT NULL,
  did_price_expand BOOLEAN NOT NULL,
  pips_from_swing_low INTEGER NOT NULL,
  pips_from_mss INTEGER NOT NULL,
  chart_url TEXT NULL,
  liq_swing_type TEXT NULL,
  convincing_rating INTEGER NULL,
  notes TEXT NULL
);

-- analyses table
CREATE TABLE public.analyses (
  id TEXT PRIMARY KEY,
  backtest_date DATE NOT NULL,
  date_performed TIMESTAMP NOT NULL,
  result_type TEXT NOT NULL,
  notion_url TEXT NOT NULL
);