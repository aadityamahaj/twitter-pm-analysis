"""
FlightScout ML Price Predictor

Model: XGBoost Regressor (price prediction) + XGBoost Classifier (rise/fall/stable)
Features: 15 engineered features capturing route, timing, demand, and historical signals.

Usage:
    predictor = PricePredictor()
    predictor.load()
    result = predictor.predict(request)
"""

import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional

MODEL_DIR = Path(__file__).parent.parent / 'models'
PRICE_MODEL_PATH = MODEL_DIR / 'price_regressor.pkl'
CLASS_MODEL_PATH = MODEL_DIR / 'price_classifier.pkl'
ENCODER_PATH = MODEL_DIR / 'label_encoders.pkl'

# Feature columns expected by the model
FEATURE_COLS = [
    'days_until_departure', 'day_of_week', 'month', 'holiday_proximity',
    'stops', 'trip_length', 'demand_level', 'historical_avg_price',
    'recent_price_trend', 'price_vs_avg_pct',
    'origin_enc', 'destination_enc', 'cabin_class_enc', 'airline_enc', 'season_enc',
]

SEASON_MAP = {1: 'winter', 2: 'winter', 3: 'spring', 4: 'spring', 5: 'spring',
              6: 'summer', 7: 'summer', 8: 'summer', 9: 'fall', 10: 'fall',
              11: 'fall', 12: 'winter'}

CABIN_AVG_PRICE = {
    'economy': 1.0, 'premium_economy': 2.1, 'business': 4.5, 'first': 8.0
}

HOLIDAY_DATES = [
    '2025-01-01', '2025-02-17', '2025-05-26', '2025-07-04',
    '2025-09-01', '2025-11-27', '2025-12-25',
    '2026-01-01', '2026-07-04', '2026-11-26', '2026-12-25',
]

def days_to_nearest_holiday(departure_date: str) -> int:
    from datetime import datetime
    dep = datetime.strptime(departure_date, '%Y-%m-%d')
    min_dist = 365
    for h in HOLIDAY_DATES:
        hd = datetime.strptime(h, '%Y-%m-%d')
        dist = abs((dep - hd).days)
        min_dist = min(min_dist, dist)
    return min(14, min_dist)


class PricePredictor:
    def __init__(self):
        self.price_model = None
        self.class_model = None
        self.encoders: dict = {}
        self.loaded = False
        self.fallback_mode = False

    def load(self) -> bool:
        """Load trained models. Returns True if successful."""
        try:
            self.price_model = joblib.load(PRICE_MODEL_PATH)
            self.class_model = joblib.load(CLASS_MODEL_PATH)
            self.encoders = joblib.load(ENCODER_PATH)
            self.loaded = True
            self.fallback_mode = False
            print("[PricePredictor] Models loaded successfully.")
            return True
        except FileNotFoundError:
            print("[PricePredictor] No trained models found — using rule-based fallback. Run train_model.py to train.")
            self.fallback_mode = True
            return False

    def _encode(self, col: str, value: str) -> int:
        enc = self.encoders.get(col)
        if enc is None:
            return 0
        try:
            return int(enc.transform([value])[0])
        except ValueError:
            return 0  # Unknown category → 0

    def _build_features(self, req: dict) -> pd.DataFrame:
        from datetime import datetime
        dep_date = req['departureDate']
        dep_dt = datetime.strptime(dep_date, '%Y-%m-%d')

        days_until = req.get('daysUntilDeparture') or max(0, (dep_dt - datetime.now()).days)
        dow = dep_dt.weekday()
        month = dep_dt.month
        season = SEASON_MAP.get(month, 'fall')
        hol_prox = days_to_nearest_holiday(dep_date)

        cabin = req.get('cabinClass', 'economy')
        hist_avg = req.get('historicalAvgPrice') or (300 * CABIN_AVG_PRICE.get(cabin, 1.0))
        current_price = req.get('currentPrice') or hist_avg
        price_vs_avg = (current_price - hist_avg) / hist_avg * 100

        row = {
            'days_until_departure': days_until,
            'day_of_week': dow,
            'month': month,
            'holiday_proximity': hol_prox,
            'stops': req.get('stops', 0),
            'trip_length': req.get('tripLength', 7),
            'demand_level': 0.5 + (0.1 if month in [6, 7, 8] else -0.05),
            'historical_avg_price': hist_avg,
            'recent_price_trend': req.get('recentTrend', 0.0),
            'price_vs_avg_pct': price_vs_avg,
            'origin_enc': self._encode('origin', req.get('origin', 'JFK')),
            'destination_enc': self._encode('destination', req.get('destination', 'LAX')),
            'cabin_class_enc': self._encode('cabin_class', cabin),
            'airline_enc': self._encode('airline', req.get('airline', 'AA')),
            'season_enc': self._encode('season', season),
        }
        return pd.DataFrame([row])[FEATURE_COLS]

    def predict(self, req: dict) -> dict:
        """
        Returns full prediction result dict.
        Falls back to rule-based logic if model is not loaded.
        """
        if self.fallback_mode or not self.loaded:
            return self._rule_based_predict(req)

        try:
            X = self._build_features(req)

            # Price regression
            predicted_price = float(self.price_model.predict(X)[0])
            predicted_price = max(50, round(predicted_price))

            # Movement classification
            proba = self.class_model.predict_proba(X)[0]
            class_labels = list(self.class_model.classes_)
            pred_class_idx = int(np.argmax(proba))
            pred_class = class_labels[pred_class_idx]  # rise/fall/stable
            confidence = round(float(proba[pred_class_idx]) * 100)

            current_price = req.get('currentPrice', predicted_price)
            hist_avg = req.get('historicalAvgPrice') or current_price
            price_vs_avg = round((current_price - hist_avg) / hist_avg * 100, 1)
            days_until = req.get('daysUntilDeparture', 30)

            recommendation = _determine_recommendation(
                pred_class, confidence, price_vs_avg, days_until
            )
            explanation = _build_explanation(
                req.get('origin', '?'), req.get('destination', '?'),
                price_vs_avg, days_until, recommendation, confidence
            )

            return {
                'predictedPrice': predicted_price,
                'currentPrice': current_price,
                'priceMovement': pred_class,
                'confidenceScore': confidence,
                'recommendation': recommendation,
                'explanation': explanation,
                'factors': _build_factors(days_until, price_vs_avg),
                'historicalAvg': round(hist_avg),
                'priceVsAverage': price_vs_avg,
                'daysUntilDeparture': days_until,
                'volatilityScore': _estimate_volatility(req),
            }
        except Exception as e:
            print(f"[PricePredictor] Prediction error: {e}")
            return self._rule_based_predict(req)

    def _rule_based_predict(self, req: dict) -> dict:
        """Rule-based fallback prediction."""
        days_until = req.get('daysUntilDeparture', 30)
        current_price = req.get('currentPrice', 300)
        cabin = req.get('cabinClass', 'economy')
        hist_avg = current_price * (0.85 + np.random.uniform(0, 0.3))
        price_vs_avg = round((current_price - hist_avg) / hist_avg * 100, 1)

        if days_until < 14:
            movement, recommendation, confidence = 'rise', 'book_now', 82
        elif price_vs_avg < -10:
            movement, recommendation, confidence = 'rise', 'book_now', 74
        elif price_vs_avg > 10 and days_until > 30:
            movement, recommendation, confidence = 'fall', 'wait', 64
        else:
            movement, recommendation, confidence = 'stable', 'track', 55

        predicted = round(current_price * (1.12 if movement == 'rise' else 0.90 if movement == 'fall' else 1.0))
        origin = req.get('origin', '?')
        destination = req.get('destination', '?')

        return {
            'predictedPrice': predicted,
            'currentPrice': current_price,
            'priceMovement': movement,
            'confidenceScore': confidence,
            'recommendation': recommendation,
            'explanation': _build_explanation(origin, destination, price_vs_avg, days_until, recommendation, confidence),
            'factors': _build_factors(days_until, price_vs_avg),
            'historicalAvg': round(hist_avg),
            'priceVsAverage': price_vs_avg,
            'daysUntilDeparture': days_until,
            'volatilityScore': 35 + int(np.random.randint(0, 40)),
        }


def _determine_recommendation(movement: str, confidence: int, price_vs_avg: float, days_until: int) -> str:
    if days_until < 14:
        return 'book_now'
    if price_vs_avg < -10 or (movement == 'rise' and confidence > 70):
        return 'book_now'
    if price_vs_avg > 10 and days_until > 30 and (movement == 'fall' and confidence > 60):
        return 'wait'
    return 'track'


def _build_explanation(origin: str, destination: str, price_vs_avg: float, days_until: int,
                        recommendation: str, confidence: int) -> str:
    sign = 'below' if price_vs_avg < 0 else 'above'
    pct = abs(round(price_vs_avg, 1))

    base = f"Prices for {origin} to {destination} are currently {pct}% {sign} the historical average."
    if recommendation == 'book_now':
        if days_until < 14:
            return f"{base} With only {days_until} days until departure, prices typically surge as seats fill. Book now."
        return f"{base} Based on past patterns and your travel date being {days_until} days away, FlightScout recommends booking now with {confidence}% confidence."
    if recommendation == 'wait':
        return f"{base} With {days_until} days until departure, historical patterns suggest prices may soften. FlightScout recommends waiting with {confidence}% confidence."
    return f"{base} Prices are near average — set a price alert to be notified of any significant drops."


def _build_factors(days_until: int, price_vs_avg: float) -> list:
    return [
        {
            'name': 'Days Until Departure',
            'impact': 'negative' if days_until < 21 else 'positive',
            'description': (f'{days_until} days to departure — prices typically surge within 3 weeks'
                           if days_until < 21 else f'{days_until} days lead time — you have flexibility'),
            'weight': 0.35,
        },
        {
            'name': 'Price vs. Historical Average',
            'impact': 'positive' if price_vs_avg < 0 else 'negative' if price_vs_avg > 0 else 'neutral',
            'description': (f'{abs(price_vs_avg):.0f}% below avg — historically good deal'
                           if price_vs_avg < -5 else
                           f'{price_vs_avg:.0f}% above avg — may be elevated' if price_vs_avg > 5 else
                           'Near historical average'),
            'weight': 0.30,
        },
        {
            'name': 'Day of Week',
            'impact': 'neutral',
            'description': 'Midweek departures (Tue/Wed) tend to be cheapest on most routes',
            'weight': 0.15,
        },
        {
            'name': 'Seasonal Demand',
            'impact': 'neutral',
            'description': 'Current seasonal demand is moderate for this route and time of year',
            'weight': 0.20,
        },
    ]


def _estimate_volatility(req: dict) -> int:
    # Routes with many alternatives tend to be less volatile
    base = 40
    origin = req.get('origin', '')
    dest = req.get('destination', '')
    # International routes are more volatile
    if any(x in ['LHR', 'CDG', 'NRT', 'DXB', 'SIN'] for x in [origin, dest]):
        base += 15
    return base + int(np.random.randint(-10, 20))
