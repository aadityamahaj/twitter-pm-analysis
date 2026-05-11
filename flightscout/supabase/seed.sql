-- ============================================================
-- FlightScout — Seed Data
-- ============================================================
-- Run AFTER schema.sql to populate with demo data
-- ============================================================

-- Sample price history (90 days, JFK-LAX)
INSERT INTO public.price_history (origin, destination, cabin_class, observed_at, departure_date, airline_iata, stops, price, source)
SELECT
  'JFK', 'LAX', 'economy',
  NOW() - (s * INTERVAL '1 day'),
  (NOW() + INTERVAL '30 days')::DATE,
  CASE (s % 5) WHEN 0 THEN 'AA' WHEN 1 THEN 'DL' WHEN 2 THEN 'UA' WHEN 3 THEN 'B6' ELSE 'AS' END,
  (s % 3)::SMALLINT,
  (180 + (s % 80) + RANDOM() * 40)::NUMERIC(10,2),
  'mock'
FROM generate_series(0, 89) s;

-- JFK-LHR price history
INSERT INTO public.price_history (origin, destination, cabin_class, observed_at, departure_date, airline_iata, stops, price, source)
SELECT
  'JFK', 'LHR', 'economy',
  NOW() - (s * INTERVAL '1 day'),
  (NOW() + INTERVAL '45 days')::DATE,
  CASE (s % 3) WHEN 0 THEN 'BA' WHEN 1 THEN 'AA' ELSE 'UA' END,
  (s % 2)::SMALLINT,
  (420 + (s % 120) + RANDOM() * 60)::NUMERIC(10,2),
  'mock'
FROM generate_series(0, 89) s;

-- SFO-NRT price history
INSERT INTO public.price_history (origin, destination, cabin_class, observed_at, departure_date, airline_iata, stops, price, source)
SELECT
  'SFO', 'NRT', 'economy',
  NOW() - (s * INTERVAL '1 day'),
  (NOW() + INTERVAL '60 days')::DATE,
  CASE (s % 3) WHEN 0 THEN 'NH' WHEN 1 THEN 'UA' ELSE 'JL' END,
  0,
  (580 + (s % 160) + RANDOM() * 80)::NUMERIC(10,2),
  'mock'
FROM generate_series(0, 89) s;

-- Sample predictions
INSERT INTO public.predictions (origin, destination, departure_date, cabin_class, current_price, predicted_price, price_movement, confidence_score, recommendation, explanation, historical_avg, price_vs_average, days_until, volatility_score)
VALUES
  ('JFK', 'LAX', CURRENT_DATE + 14, 'economy', 209, 232, 'rise', 74,
   'book_now',
   'Prices for JFK to LAX are currently 5% below the historical average. With your travel date 14 days away, prices typically surge as seats fill. FlightScout recommends booking now with 74% confidence.',
   219, -4.6, 14, 38),
  ('BOS', 'LHR', CURRENT_DATE + 45, 'economy', 389, 360, 'fall', 68,
   'wait',
   'Prices for BOS to LHR are 8% above the historical average. With 45 days until departure, historical patterns suggest prices may soften slightly. Consider waiting.',
   360, 8.1, 45, 52),
  ('SFO', 'NRT', CURRENT_DATE + 30, 'economy', 650, 680, 'rise', 71,
   'book_now',
   'Prices for SFO to NRT are near historical average. Seasonal demand increases in spring/summer typically push prices higher closer to departure.',
   635, 2.4, 30, 44);

-- Sample price alerts (no user_id — open alerts)
INSERT INTO public.price_alerts (email, origin, destination, cabin_class, target_price, current_price, is_active)
VALUES
  ('demo@flightscout.app', 'JFK', 'LAX', 'economy', 180, 209, TRUE),
  ('demo@flightscout.app', 'BOS', 'LHR', 'economy', 380, 389, TRUE),
  ('demo@flightscout.app', 'SFO', 'NRT', 'economy', 600, 650, TRUE);
