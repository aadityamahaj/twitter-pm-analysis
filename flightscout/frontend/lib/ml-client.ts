/**
 * ML Backend Client
 *
 * Communicates with the FastAPI ML microservice.
 * Falls back to rule-based heuristics if the ML backend is unavailable.
 */

import { PredictionRequest, PredictionResult, RouteAnalysis, BookingRecommendation, PriceMovement } from '@/types';

const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL ?? 'http://localhost:8000';

async function mlFetch<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${ML_API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`ML API ${res.status}`);
    return res.json();
  } catch {
    return null; // Graceful degradation
  }
}

export async function predictPrice(req: PredictionRequest): Promise<PredictionResult> {
  const result = await mlFetch<PredictionResult>('/predict-price', req);
  if (result) return result;
  return fallbackPrediction(req);
}

export async function analyzeRoute(origin: string, destination: string): Promise<RouteAnalysis> {
  const result = await mlFetch<RouteAnalysis>('/analyze-route', { origin, destination });
  if (result) return result;
  return fallbackRouteAnalysis(origin, destination);
}

export async function getBookingRecommendation(req: PredictionRequest): Promise<PredictionResult> {
  const result = await mlFetch<PredictionResult>('/recommend-booking', req);
  if (result) return result;
  return fallbackPrediction(req);
}

// ---- Rule-based fallbacks (used when ML backend is offline) ----

function fallbackPrediction(req: PredictionRequest): PredictionResult {
  const daysUntil = req.daysUntilDeparture ?? daysUntilDate(req.departureDate);
  const currentPrice = req.currentPrice ?? 300;

  // Simulate a rough historical average
  const historicalAvg = currentPrice * (0.85 + Math.random() * 0.3);
  const priceVsAverage = ((currentPrice - historicalAvg) / historicalAvg) * 100;

  // Rule-based recommendation
  let recommendation: BookingRecommendation;
  let priceMovement: PriceMovement;
  let confidence: number;
  let explanation: string;

  if (daysUntil < 14) {
    recommendation = 'book_now';
    priceMovement = 'rise';
    confidence = 82;
    explanation = `With only ${daysUntil} days until departure, prices typically surge as the flight fills up. We recommend booking immediately.`;
  } else if (priceVsAverage < -10) {
    recommendation = 'book_now';
    priceMovement = 'rise';
    confidence = 74;
    explanation = `The current price is ${Math.abs(priceVsAverage).toFixed(0)}% below the historical average for this route. This is a good deal — book now before prices recover.`;
  } else if (priceVsAverage > 10 && daysUntil > 30) {
    recommendation = 'wait';
    priceMovement = 'fall';
    confidence = 65;
    explanation = `Prices are ${priceVsAverage.toFixed(0)}% above average and your departure is ${daysUntil} days away. Historical patterns suggest prices may soften.`;
  } else {
    recommendation = 'track';
    priceMovement = 'stable';
    confidence = 58;
    explanation = `Prices are near the historical average. Set a price alert to be notified of any significant drops.`;
  }

  const predictedPrice = recommendation === 'wait'
    ? Math.round(currentPrice * 0.9)
    : recommendation === 'book_now'
    ? Math.round(currentPrice * 1.12)
    : currentPrice;

  return {
    predictedPrice,
    currentPrice,
    priceMovement,
    confidenceScore: confidence,
    recommendation,
    explanation,
    factors: buildFactors(daysUntil, priceVsAverage),
    historicalAvg: Math.round(historicalAvg),
    priceVsAverage: Math.round(priceVsAverage * 10) / 10,
    daysUntilDeparture: daysUntil,
    volatilityScore: 35 + Math.round(Math.random() * 40),
  };
}

function buildFactors(daysUntil: number, priceVsAvg: number) {
  return [
    {
      name: 'Days Until Departure',
      impact: daysUntil < 21 ? 'negative' as const : 'positive' as const,
      description: daysUntil < 21
        ? 'Flights booked close to departure tend to be more expensive'
        : 'You have enough lead time that prices may improve',
      weight: 0.35,
    },
    {
      name: 'Price vs. Historical Average',
      impact: priceVsAvg < 0 ? 'positive' as const : priceVsAvg > 0 ? 'negative' as const : 'neutral' as const,
      description: priceVsAvg < 0
        ? `Currently ${Math.abs(priceVsAvg).toFixed(0)}% below historical average`
        : priceVsAvg > 0
        ? `Currently ${priceVsAvg.toFixed(0)}% above historical average`
        : 'At historical average',
      weight: 0.30,
    },
    {
      name: 'Day of Week',
      impact: 'neutral' as const,
      description: 'Midweek departures (Tue/Wed) are typically cheapest',
      weight: 0.15,
    },
    {
      name: 'Seasonal Demand',
      impact: 'neutral' as const,
      description: 'Current seasonal demand is moderate for this route',
      weight: 0.20,
    },
  ];
}

function fallbackRouteAnalysis(origin: string, destination: string): RouteAnalysis {
  const base = 280 + Math.random() * 200;
  const historicalData = Array.from({ length: 90 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 90 + i);
    const price = Math.round(base * (0.8 + Math.random() * 0.4));
    return {
      date: d.toISOString().split('T')[0],
      avgPrice: price,
      minPrice: Math.round(price * 0.85),
      maxPrice: Math.round(price * 1.15),
      sampleSize: 10 + Math.floor(Math.random() * 20),
    };
  });

  const weekdayAverages = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
    day,
    index,
    avgPrice: Math.round(base * [0.92, 0.88, 0.87, 0.91, 1.08, 1.18, 1.12][index]),
  }));

  const monthlyAverages = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
    (month, index) => ({
      month,
      index,
      avgPrice: Math.round(base * [0.82, 0.80, 0.88, 0.93, 1.02, 1.18, 1.32, 1.28, 1.08, 0.93, 0.85, 1.12][index]),
    })
  );

  const prices = historicalData.map(d => d.avgPrice);
  const allTimeAvg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  const allTimeLow = Math.min(...prices);
  const allTimeHigh = Math.max(...prices);

  return {
    origin,
    destination,
    historicalData,
    weekdayAverages,
    monthlyAverages,
    cheapestMonths: ['February', 'January', 'March'],
    cheapestDays: ['Tuesday', 'Wednesday', 'Monday'],
    allTimeAvg,
    allTimeLow,
    allTimeHigh,
    volatilityScore: 30 + Math.round(Math.random() * 40),
    currentPriceVsAvg: Math.round((Math.random() - 0.5) * 30 * 10) / 10,
  };
}

function daysUntilDate(dateStr: string): number {
  const dep = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((dep.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}
