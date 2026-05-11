"""
FlightScout ML Backend — FastAPI Microservice

Endpoints:
  GET  /health            → Health check + model status
  POST /predict-price     → XGBoost price prediction + recommendation
  POST /analyze-route     → Historical route analysis + seasonal patterns
  POST /recommend-booking → Booking recommendation (Book Now / Wait / Track)
  POST /train-model       → Retrain model on new data (requires ML_API_SECRET)

Usage:
  uvicorn main:app --reload --port 8000
"""

import os
import json
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from models.predictor import PricePredictor, SEASON_MAP, days_to_nearest_holiday

# ---- App setup ----
app = FastAPI(
    title='FlightScout ML API',
    description='Price prediction microservice for FlightScout',
    version='0.1.0',
)

CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS + ['*'],  # Restrict in production
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# ---- Load predictor (once at startup) ----
predictor = PricePredictor()

@app.on_event('startup')
async def startup():
    predictor.load()

# ---- Schemas ----

class PredictionRequest(BaseModel):
    origin: str = Field(..., example='JFK')
    destination: str = Field(..., example='LAX')
    departureDate: str = Field(..., example='2026-07-15')
    returnDate: Optional[str] = None
    cabinClass: str = Field('economy', example='economy')
    stops: Optional[int] = 0
    airline: Optional[str] = 'AA'
    currentPrice: Optional[float] = None
    daysUntilDeparture: Optional[int] = None
    tripLength: Optional[int] = 7
    historicalAvgPrice: Optional[float] = None
    recentTrend: Optional[float] = 0.0

class RouteRequest(BaseModel):
    origin: str
    destination: str
    cabin_class: str = 'economy'
    days_back: int = 90

class TrainRequest(BaseModel):
    dataPath: Optional[str] = 'data/mock_historical.parquet'
    nSamples: Optional[int] = 50_000

# ---- Endpoints ----

@app.get('/health')
async def health():
    return {
        'status': 'ok',
        'model_loaded': predictor.loaded,
        'fallback_mode': predictor.fallback_mode,
        'timestamp': datetime.utcnow().isoformat(),
    }

@app.post('/predict-price')
async def predict_price(req: PredictionRequest):
    """
    Predict future price movement for a given route and date.
    Returns: predicted price, movement direction, confidence, recommendation, explanation.
    """
    result = predictor.predict(req.model_dump(by_alias=False))
    return result

@app.post('/recommend-booking')
async def recommend_booking(req: PredictionRequest):
    """
    Book Now / Wait / Track recommendation with plain-English explanation.
    Combines ML prediction with rule-based business logic.
    """
    result = predictor.predict(req.model_dump(by_alias=False))
    return result

@app.post('/analyze-route')
async def analyze_route(req: RouteRequest):
    """
    Historical price analysis for a route.
    Returns 90-day history, weekday averages, monthly averages, cheapest periods.
    """
    return _generate_route_analysis(req.origin, req.destination, req.cabin_class, req.days_back)

@app.post('/train-model')
async def train_model(req: TrainRequest, x_api_secret: Optional[str] = Header(None)):
    """
    Retrain the ML model on new data.
    Protected by ML_API_SECRET header.
    """
    secret = os.getenv('ML_API_SECRET', 'dev-secret')
    if x_api_secret != secret:
        raise HTTPException(status_code=403, detail='Invalid API secret')

    import subprocess
    import sys
    cmd = [sys.executable, 'train_model.py']
    if req.dataPath:
        cmd += ['--data-path', req.dataPath]
    if req.nSamples:
        cmd += ['--n-samples', str(req.nSamples)]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            raise Exception(result.stderr)
        predictor.load()  # Reload models after training
        return {'status': 'success', 'output': result.stdout[-2000:]}
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail='Training timed out')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---- Historical analysis ----

BASE_PRICES = {
    'JFK-LAX': 220, 'JFK-LHR': 480, 'JFK-CDG': 460, 'JFK-DXB': 680,
    'BOS-LAX': 240, 'BOS-LHR': 490, 'SFO-JFK': 280, 'SFO-NRT': 680,
    'ORD-LAX': 180, 'ORD-MIA': 160, 'ATL-LAX': 200, 'MIA-JFK': 180,
    'DFW-JFK': 210, 'DEN-JFK': 200, 'SEA-JFK': 270, 'LAX-NRT': 650,
    'LAX-DXB': 720, 'LAX-SIN': 780, 'JFK-SIN': 900, 'JFK-NRT': 760,
    'JFK-HKG': 850, 'LAX-SYD': 990, 'JFK-IST': 580, 'LHR-DXB': 380,
}

CABIN_MULT = {'economy': 1.0, 'premium_economy': 2.1, 'business': 4.5, 'first': 8.0}

def _get_base_price(origin: str, destination: str) -> float:
    key = f'{origin}-{destination}'
    rev = f'{destination}-{origin}'
    return BASE_PRICES.get(key, BASE_PRICES.get(rev, 300))

def _generate_route_analysis(origin: str, destination: str, cabin: str, days_back: int) -> dict:
    rng = np.random.RandomState(hash(f'{origin}{destination}') % (2**31))
    base = _get_base_price(origin, destination) * CABIN_MULT.get(cabin, 1.0)

    today = datetime.utcnow().date()
    historical_data = []
    prices_all = []

    for i in range(days_back):
        date = today - timedelta(days=days_back - i)
        dow = date.weekday()
        month = date.month
        season_mult = [0.82, 0.80, 0.88, 0.93, 1.02, 1.18, 1.32, 1.28, 1.08, 0.93, 0.85, 1.12][month - 1]
        dow_mult = [0.92, 0.88, 0.87, 0.91, 1.08, 1.18, 1.12][dow]
        noise = rng.uniform(0.85, 1.15)
        avg_price = round(base * season_mult * dow_mult * noise)
        min_price = round(avg_price * rng.uniform(0.82, 0.93))
        max_price = round(avg_price * rng.uniform(1.05, 1.20))
        prices_all.append(avg_price)
        historical_data.append({
            'date': date.isoformat(),
            'avgPrice': avg_price,
            'minPrice': min_price,
            'maxPrice': max_price,
            'sampleSize': int(rng.randint(8, 25)),
        })

    # Weekday averages
    weekday_mults = [0.92, 0.88, 0.87, 0.91, 1.08, 1.18, 1.12]
    weekday_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    weekday_avgs = [
        {'day': weekday_names[i], 'index': i, 'avgPrice': round(base * weekday_mults[i])}
        for i in range(7)
    ]

    # Monthly averages
    monthly_mults = [0.82, 0.80, 0.88, 0.93, 1.02, 1.18, 1.32, 1.28, 1.08, 0.93, 0.85, 1.12]
    monthly_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthly_avgs = [
        {'month': monthly_names[i], 'index': i, 'avgPrice': round(base * monthly_mults[i])}
        for i in range(12)
    ]

    all_avg = round(sum(prices_all) / len(prices_all))
    volatility = int(rng.randint(25, 65))
    current_vs_avg = round((prices_all[-1] - all_avg) / all_avg * 100, 1)

    return {
        'origin': origin,
        'destination': destination,
        'historicalData': historical_data,
        'weekdayAverages': weekday_avgs,
        'monthlyAverages': monthly_avgs,
        'cheapestMonths': ['February', 'January', 'March'],
        'cheapestDays': ['Tuesday', 'Wednesday', 'Monday'],
        'allTimeAvg': all_avg,
        'allTimeLow': min(prices_all),
        'allTimeHigh': max(prices_all),
        'volatilityScore': volatility,
        'currentPriceVsAvg': current_vs_avg,
    }
