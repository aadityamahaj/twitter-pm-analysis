-- ============================================================
-- FlightScout — Supabase PostgreSQL Schema
-- ============================================================
-- Run this in your Supabase SQL editor (or via psql)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT,
  home_airport CHAR(4),
  currency     CHAR(3) DEFAULT 'USD',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_cabin    TEXT DEFAULT 'economy',
  email_alerts       BOOLEAN DEFAULT TRUE,
  alert_email        TEXT,
  priority_price     SMALLINT DEFAULT 50,
  priority_duration  SMALLINT DEFAULT 20,
  priority_stops     SMALLINT DEFAULT 10,
  priority_dep_time  SMALLINT DEFAULT 5,
  priority_arr_time  SMALLINT DEFAULT 5,
  priority_airline   SMALLINT DEFAULT 5,
  priority_baggage   SMALLINT DEFAULT 5,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ============================================================
-- SEARCHES (search history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.searches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  search_id      TEXT NOT NULL,
  origin         CHAR(4) NOT NULL,
  destination    CHAR(4) NOT NULL,
  trip_type      TEXT NOT NULL DEFAULT 'round_trip',
  departure_date DATE NOT NULL,
  return_date    DATE,
  cabin_class    TEXT DEFAULT 'economy',
  adults         SMALLINT DEFAULT 1,
  children       SMALLINT DEFAULT 0,
  infants        SMALLINT DEFAULT 0,
  max_stops      SMALLINT DEFAULT 3,
  budget         NUMERIC(10, 2),
  priorities     JSONB,
  result_count   INTEGER,
  cheapest_price NUMERIC(10, 2),
  searched_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_searches_user ON public.searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_route ON public.searches(origin, destination);

-- ============================================================
-- FLIGHT RESULTS (cache of search results)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.flight_results (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_id       TEXT NOT NULL,
  flight_id       TEXT NOT NULL,
  origin          CHAR(4) NOT NULL,
  destination     CHAR(4) NOT NULL,
  departure_time  TIMESTAMPTZ NOT NULL,
  arrival_time    TIMESTAMPTZ NOT NULL,
  airline_iata    CHAR(3),
  stops           SMALLINT DEFAULT 0,
  duration_min    INTEGER,
  price           NUMERIC(10, 2) NOT NULL,
  currency        CHAR(3) DEFAULT 'USD',
  cabin_class     TEXT,
  baggage_bags    SMALLINT DEFAULT 0,
  scout_score     SMALLINT,
  raw_data        JSONB,
  cached_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 hours'
);

CREATE INDEX IF NOT EXISTS idx_flight_results_search ON public.flight_results(search_id);

-- ============================================================
-- SAVED ROUTES (watchlist)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_routes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin       CHAR(4) NOT NULL,
  destination  CHAR(4) NOT NULL,
  label        TEXT,
  cabin_class  TEXT DEFAULT 'economy',
  last_price   NUMERIC(10, 2),
  price_change NUMERIC(10, 2),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, origin, destination, cabin_class)
);

CREATE INDEX IF NOT EXISTS idx_saved_routes_user ON public.saved_routes(user_id);

-- ============================================================
-- PRICE ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email           TEXT NOT NULL,
  origin          CHAR(4) NOT NULL,
  destination     CHAR(4) NOT NULL,
  cabin_class     TEXT DEFAULT 'economy',
  departure_date  DATE,
  target_price    NUMERIC(10, 2) NOT NULL,
  current_price   NUMERIC(10, 2),
  is_active       BOOLEAN DEFAULT TRUE,
  triggered       BOOLEAN DEFAULT FALSE,
  triggered_at    TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.price_alerts(is_active, triggered);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.price_alerts(user_id);

-- ============================================================
-- PRICE HISTORY (route price over time — populated by cron)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.price_history (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin         CHAR(4) NOT NULL,
  destination    CHAR(4) NOT NULL,
  cabin_class    TEXT DEFAULT 'economy',
  observed_at    TIMESTAMPTZ NOT NULL,
  departure_date DATE NOT NULL,
  airline_iata   CHAR(3),
  stops          SMALLINT DEFAULT 0,
  price          NUMERIC(10, 2) NOT NULL,
  currency       CHAR(3) DEFAULT 'USD',
  source         TEXT DEFAULT 'mock'
);

CREATE INDEX IF NOT EXISTS idx_price_history_route ON public.price_history(origin, destination, cabin_class);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON public.price_history(observed_at DESC);

-- ============================================================
-- PREDICTIONS (cached ML predictions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.predictions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin              CHAR(4) NOT NULL,
  destination         CHAR(4) NOT NULL,
  departure_date      DATE NOT NULL,
  cabin_class         TEXT DEFAULT 'economy',
  current_price       NUMERIC(10, 2),
  predicted_price     NUMERIC(10, 2),
  price_movement      TEXT,
  confidence_score    SMALLINT,
  recommendation      TEXT,
  explanation         TEXT,
  historical_avg      NUMERIC(10, 2),
  price_vs_average    NUMERIC(8, 2),
  days_until          INTEGER,
  volatility_score    SMALLINT,
  model_version       TEXT,
  predicted_at        TIMESTAMPTZ DEFAULT NOW(),
  expires_at          TIMESTAMPTZ DEFAULT NOW() + INTERVAL '3 hours'
);

CREATE INDEX IF NOT EXISTS idx_predictions_route ON public.predictions(origin, destination, departure_date);

-- ============================================================
-- NOTIFICATIONS (sent email log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id    UUID REFERENCES public.price_alerts(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT NOT NULL,
  subject     TEXT,
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  status      TEXT DEFAULT 'sent'
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- searches
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own searches" ON public.searches
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users insert own searches" ON public.searches
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- saved_routes
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved routes" ON public.saved_routes
  FOR ALL USING (auth.uid() = user_id);

-- price_alerts
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON public.price_alerts
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- price_history (public read)
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read price history" ON public.price_history
  FOR SELECT USING (TRUE);

-- predictions (public read)
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read predictions" ON public.predictions
  FOR SELECT USING (TRUE);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_saved_routes_updated_at
  BEFORE UPDATE ON public.saved_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- View: route average prices (useful for analytics)
CREATE OR REPLACE VIEW public.route_averages AS
SELECT
  origin,
  destination,
  cabin_class,
  DATE_TRUNC('week', observed_at) AS week,
  AVG(price) AS avg_price,
  MIN(price) AS min_price,
  MAX(price) AS max_price,
  COUNT(*) AS n_samples
FROM public.price_history
GROUP BY 1, 2, 3, 4;
