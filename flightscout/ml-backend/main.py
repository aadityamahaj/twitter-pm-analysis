"""
FlightScout ML Backend — FastAPI Microservice (Mock Version)

Endpoints:
  GET  /health            → Health check + model status
  POST /predict-price     → Mock price prediction + recommendation
  POST /analyze-route     → Mock historical route analysis
  POST /recommend-booking → Mock booking recommendation

Usage:
  uvicorn main:app --reload --port 8000
"""

import os
import json
import random
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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
    """Health check endpoint."""
    return {
        'status': 'ok',
        'model_loaded': True,
        'fallback_mode': True,  # Always in mock mode
        'timestamp': datetime.utcnow().isoformat(),
    }

@app.post('/predict-price')
async def predict_price(req: PredictionRequest):
    """
    Mock price prediction for a given route and date.
    Returns: predicted price, movement direction, confidence, recommendation, explanation.
    """
    # Generate a mock prediction based on current price with random variance
    current_price = req.currentPrice or 300.0

    # Random variance between -15% and +20%
    variance = random.uniform(-0.15, 0.20)
    predicted_price = current_price * (1 + variance)

    # Determine recommendation based on variance
    if variance < -0.10:
        recommendation = 'wait'  # Price likely to drop more
        explanation = f'Prices are trending down. Current: ${current_price:.0f}, Predicted: ${predicted_price:.0f}. Wait for more savings.'
    elif variance < 0:
        recommendation = 'book'  # Current price is good
        explanation = f'Good price detected. Current: ${current_price:.0f}, Predicted: ${predicted_price:.0f}. Book now before prices rise.'
    else:
        recommendation = 'book'  # Prices going up
        explanation = f'Prices are rising. Current: ${current_price:.0f}, Predicted: ${predicted_price:.0f}. Book now.'

    return {
        'predicted_price': round(predicted_price, 2),
        'current_price': current_price,
        'predicted_movement': 'up' if variance > 0 else 'down',
        'movement_percent': round(variance * 100, 1),
        'confidence': round(random.uniform(0.65, 0.95), 2),
        'recommendation': recommendation,
        'explanation': explanation,
        'factors': {
            'days_until_departure': req.daysUntilDeparture or 30,
            'trip_length': req.tripLength or 7,
            'cabin_class': req.cabinClass,
            'stops': req.stops,
        }
    }

@app.post('/recommend-booking')
async def recommend_booking(req: PredictionRequest):
    """
    Mock booking recommendation combining prediction with business logic.
    Returns: Book Now / Wait / Track recommendation.
    """
    return await predict_price(req)

@app.post('/analyze-route')
async def analyze_route(req: RouteRequest):
    """
    Mock historical price analysis for a route.
    Returns mock 90-day history, weekday averages, monthly averages, cheapest periods.
    """
    # Generate mock analysis
    return {
        'route': f'{req.origin}-{req.destination}',
        'cabin_class': req.cabin_class,
        'analysis_days': req.days_back,
        'average_price': round(random.uniform(200, 800), 2),
        'min_price': round(random.uniform(100, 400), 2),
        'max_price': round(random.uniform(400, 1200), 2),
        'cheapest_day': random.choice(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
        'cheapest_months': ['January', 'February', 'September', 'October'],
        'price_trend': 'up' if random.random() > 0.5 else 'down',
        'volatility': round(random.uniform(0.05, 0.25), 2),
        'confidence': round(random.uniform(0.7, 0.95), 2),
        'notes': 'This is a mock analysis. Real predictions coming soon.',
    }

@app.post('/train-model')
async def train_model(req: TrainRequest, x_api_secret: Optional[str] = Header(None)):
    """
    Mock training endpoint (returns success without doing anything).
    Protected by ML_API_SECRET header.
    """
    secret = os.getenv('ML_API_SECRET', 'dev-secret')
    if x_api_secret != secret:
        raise HTTPException(status_code=403, detail='Invalid API secret')

    return {
        'status': 'success',
        'message': 'Mock training completed (no actual training performed)',
        'timestamp': datetime.utcnow().isoformat(),
    }

# ---- Startup ----

@app.on_event('startup')
async def startup():
    """Startup event - no models to load in mock mode."""
    print('FlightScout ML API started (mock mode)')

if __name__ == '__main__':
    import uvicorn
    port = int(os.getenv('PORT', 8000))
    uvicorn.run(app, host='0.0.0.0', port=port)
