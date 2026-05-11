"""
Mock Historical Flight Price Data Generator

Generates realistic synthetic price data for training and testing the ML model.
Replace this with real historical data (Amadeus, Kiwi, AviationStack, etc.) for production.

Data schema:
  route, origin, destination, cabin_class, stops, airline,
  days_until_departure, day_of_week, month, season,
  holiday_proximity, trip_length, demand_level,
  historical_avg_price, recent_price_trend,
  price_vs_avg_pct, price
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

ROUTES = [
    ('JFK', 'LAX'), ('JFK', 'LHR'), ('JFK', 'CDG'), ('JFK', 'DXB'),
    ('BOS', 'LAX'), ('BOS', 'LHR'), ('SFO', 'JFK'), ('SFO', 'NRT'),
    ('ORD', 'LAX'), ('ORD', 'MIA'), ('ATL', 'LAX'), ('MIA', 'JFK'),
    ('DFW', 'JFK'), ('DEN', 'JFK'), ('SEA', 'JFK'), ('LAX', 'NRT'),
    ('LAX', 'DXB'), ('LAX', 'SIN'), ('JFK', 'SIN'), ('JFK', 'NRT'),
    ('JFK', 'HKG'), ('LAX', 'SYD'), ('JFK', 'IST'), ('LHR', 'DXB'),
    ('LHR', 'SIN'), ('CDG', 'DXB'), ('AMS', 'DXB'), ('FRA', 'DXB'),
    ('JFK', 'MEX'), ('LAX', 'MEX'), ('JFK', 'GRU'), ('JFK', 'DEL'),
]

BASE_PRICES = {
    ('JFK', 'LAX'): 220, ('JFK', 'LHR'): 480, ('JFK', 'CDG'): 460,
    ('JFK', 'DXB'): 680, ('BOS', 'LAX'): 240, ('BOS', 'LHR'): 490,
    ('SFO', 'JFK'): 280, ('SFO', 'NRT'): 680, ('ORD', 'LAX'): 180,
    ('ORD', 'MIA'): 160, ('ATL', 'LAX'): 200, ('MIA', 'JFK'): 180,
    ('DFW', 'JFK'): 210, ('DEN', 'JFK'): 200, ('SEA', 'JFK'): 270,
    ('LAX', 'NRT'): 650, ('LAX', 'DXB'): 720, ('LAX', 'SIN'): 780,
    ('JFK', 'SIN'): 900, ('JFK', 'NRT'): 760, ('JFK', 'HKG'): 850,
    ('LAX', 'SYD'): 990, ('JFK', 'IST'): 580, ('LHR', 'DXB'): 380,
    ('LHR', 'SIN'): 620, ('CDG', 'DXB'): 360, ('AMS', 'DXB'): 340,
    ('FRA', 'DXB'): 350, ('JFK', 'MEX'): 280, ('LAX', 'MEX'): 200,
    ('JFK', 'GRU'): 620, ('JFK', 'DEL'): 780,
}

CABIN_MULTIPLIERS = {
    'economy': 1.0, 'premium_economy': 2.1, 'business': 4.5, 'first': 8.0
}

AIRLINES = ['AA', 'UA', 'DL', 'BA', 'LH', 'EK', 'QR', 'SQ', 'AS', 'B6']

HOLIDAY_DATES_2025 = [
    '2025-01-01', '2025-02-17', '2025-05-26', '2025-07-04',
    '2025-09-01', '2025-11-27', '2025-12-25',
]

def season_from_month(month: int) -> str:
    if month in [12, 1, 2]: return 'winter'
    if month in [3, 4, 5]: return 'spring'
    if month in [6, 7, 8]: return 'summer'
    return 'fall'

def holiday_proximity(date: datetime) -> int:
    """Days to nearest holiday (0 if on holiday, up to 14)."""
    min_dist = 365
    for h in HOLIDAY_DATES_2025:
        hd = datetime.strptime(h, '%Y-%m-%d')
        dist = abs((date - hd).days)
        min_dist = min(min_dist, dist)
    return min(14, min_dist)

def price_trend(prices: list, current_idx: int, window=7) -> float:
    """Slope of last 'window' prices relative to mean."""
    start = max(0, current_idx - window)
    window_prices = prices[start:current_idx + 1]
    if len(window_prices) < 2:
        return 0.0
    mean_p = np.mean(window_prices)
    if mean_p == 0:
        return 0.0
    return (window_prices[-1] - window_prices[0]) / mean_p

def generate_historical_data(n_samples: int = 50_000) -> pd.DataFrame:
    """Generate n_samples rows of synthetic flight price history."""
    np.random.seed(42)
    random.seed(42)
    records = []

    for _ in range(n_samples):
        # Random route
        origin, destination = random.choice(ROUTES)
        route = f'{origin}-{destination}'
        base = BASE_PRICES.get((origin, destination), 300)

        # Random date in 2025–2026
        start_date = datetime(2025, 1, 1)
        obs_date = start_date + timedelta(days=random.randint(0, 365))
        dep_date = obs_date + timedelta(days=random.randint(1, 180))

        days_until = (dep_date - obs_date).days
        dow = dep_date.weekday()  # 0=Mon
        month = dep_date.month
        season = season_from_month(month)
        hol_prox = holiday_proximity(dep_date)
        stops = random.choices([0, 1, 2], weights=[0.4, 0.45, 0.15])[0]
        airline = random.choice(AIRLINES)
        cabin = random.choices(
            ['economy', 'premium_economy', 'business', 'first'],
            weights=[0.72, 0.12, 0.13, 0.03]
        )[0]
        trip_len = random.randint(2, 21)

        # Demand level (0–1): peaks in summer, holidays, Fri/Sun
        demand = 0.5
        demand += 0.15 if season == 'summer' else -0.1 if season == 'fall' else 0
        demand += 0.1 if hol_prox < 7 else 0
        demand += 0.05 if dow in [4, 6] else -0.05 if dow in [1, 2] else 0  # Fri/Sun vs Tue/Wed
        demand = np.clip(demand + np.random.normal(0, 0.1), 0, 1)

        # Day-of-week multiplier
        dow_mult = [0.92, 0.88, 0.87, 0.91, 1.08, 1.18, 1.12][dow]

        # Days-until multiplier
        if days_until > 90:
            days_mult = 0.90
        elif days_until > 60:
            days_mult = 0.93
        elif days_until > 30:
            days_mult = 1.0
        elif days_until > 14:
            days_mult = 1.10
        elif days_until > 7:
            days_mult = 1.25
        else:
            days_mult = 1.45

        # Monthly seasonality multiplier
        month_mult = [0.82, 0.80, 0.88, 0.93, 1.02, 1.18, 1.32, 1.28, 1.08, 0.93, 0.85, 1.12][month - 1]

        # Holiday premium
        hol_mult = 1.0
        if hol_prox == 0:
            hol_mult = 1.30
        elif hol_prox < 3:
            hol_mult = 1.20
        elif hol_prox < 7:
            hol_mult = 1.10

        # Stops discount
        stops_mult = [1.0, 0.84, 0.70][stops]

        # Cabin class multiplier
        cabin_mult = CABIN_MULTIPLIERS[cabin]

        # Compute historical average (route avg economy nonstop)
        hist_avg = base * 0.95  # Simplified

        # Final price with noise
        price_raw = (base * dow_mult * days_mult * month_mult * hol_mult * stops_mult * cabin_mult)
        noise = np.random.normal(1.0, 0.08)
        price = max(50, round(price_raw * noise))

        price_vs_avg = (price / (hist_avg * cabin_mult) - 1) * 100

        records.append({
            'route': route,
            'origin': origin,
            'destination': destination,
            'cabin_class': cabin,
            'stops': stops,
            'airline': airline,
            'days_until_departure': days_until,
            'day_of_week': dow,
            'month': month,
            'season': season,
            'holiday_proximity': hol_prox,
            'trip_length': trip_len,
            'demand_level': round(demand, 3),
            'historical_avg_price': round(hist_avg * cabin_mult, 2),
            'recent_price_trend': round(np.random.normal(0, 0.05), 3),  # simplified
            'price_vs_avg_pct': round(price_vs_avg, 2),
            'price': price,
        })

    return pd.DataFrame(records)


if __name__ == '__main__':
    print("Generating mock historical data...")
    df = generate_historical_data(50_000)
    df.to_parquet('mock_historical.parquet', index=False)
    df.head(5).to_csv('mock_historical_sample.csv', index=False)
    print(f"Generated {len(df):,} rows. Saved to mock_historical.parquet")
    print(df.describe())
