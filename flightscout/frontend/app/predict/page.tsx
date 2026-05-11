'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  Brain, TrendingDown, TrendingUp, Minus, CheckCircle, AlertCircle, Clock,
  BarChart2, ArrowRight, Info
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PredictionResult, CabinClass, PredictionFactor } from '@/types';
import { predictPrice } from '@/lib/ml-client';
import { formatPrice, recommendationLabel, recommendationColor, formatDate, daysUntil } from '@/lib/utils';
import { getAirport } from '@/lib/airports';

function ConfidenceRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 55 ? '#f59e0b' : '#6b7280';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold" style={{ color }}>{score}%</div>
        <div className="text-xs text-gray-500">confidence</div>
      </div>
    </div>
  );
}

function PredictionContent() {
  const sp = useSearchParams();
  const origin = sp.get('origin') ?? 'JFK';
  const destination = sp.get('destination') ?? 'LAX';
  const date = sp.get('date') ?? '';
  const cabin = (sp.get('cabin') ?? 'economy') as CabinClass;
  const currentPrice = Number(sp.get('price') ?? 0);

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  const originAirport = getAirport(origin);
  const destAirport = getAirport(destination);
  const days = date ? daysUntil(date) : 30;

  useEffect(() => {
    setLoading(true);
    predictPrice({
      origin, destination,
      departureDate: date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      cabinClass: cabin,
      currentPrice: currentPrice || undefined,
      daysUntilDeparture: days,
    }).then(p => {
      setPrediction(p);
      setLoading(false);
    });
  }, [origin, destination, date, cabin, currentPrice]);

  const REC_CONFIG = {
    book_now: { icon: CheckCircle, label: 'Book Now', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    wait: { icon: Clock, label: 'Wait', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    track: { icon: AlertCircle, label: 'Track Closely', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="gradient-hero text-white py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-2 text-sky-200 text-sm mb-2">
            <Brain className="h-4 w-4" />
            AI Price Prediction
          </div>
          <h1 className="text-3xl font-bold">
            {originAirport?.city ?? origin} → {destAirport?.city ?? destination}
          </h1>
          {date && <p className="text-sky-200 mt-1">{formatDate(date)} · {days} days away</p>}
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 mt-6 space-y-6">

        {loading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Brain className="h-12 w-12 text-sky-300 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-500">Analyzing price signals...</p>
            </CardContent>
          </Card>
        ) : prediction ? (
          <>
            {/* Main recommendation card */}
            <Card className="border-2 border-sky-100">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

                  {/* Recommendation */}
                  <div className="text-center">
                    {(() => {
                      const cfg = REC_CONFIG[prediction.recommendation];
                      const Icon = cfg.icon;
                      return (
                        <div className={`inline-flex flex-col items-center p-6 rounded-2xl border-2 ${cfg.bg} ${cfg.border}`}>
                          <Icon className={`h-8 w-8 mb-2 ${cfg.color}`} />
                          <div className={`text-2xl font-extrabold ${cfg.color}`}>{cfg.label}</div>
                          <div className="text-xs text-gray-500 mt-1">FlightScout Recommendation</div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Confidence ring */}
                  <div className="flex flex-col items-center gap-2">
                    <ConfidenceRing score={prediction.confidenceScore} />
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-700">Prediction Confidence</div>
                      <div className="text-xs text-gray-500">Based on {prediction.factors.length} signals</div>
                    </div>
                  </div>

                  {/* Price stats */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current price</span>
                      <span className="font-bold text-gray-900">{formatPrice(prediction.currentPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Historical avg</span>
                      <span className="font-medium text-gray-700">{formatPrice(prediction.historicalAvg)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Predicted price</span>
                      <span className={`font-bold ${prediction.predictedPrice < prediction.currentPrice ? 'text-green-600' : 'text-red-500'}`}>
                        {formatPrice(prediction.predictedPrice)}
                      </span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">vs. Historical avg</span>
                      <span className={`font-semibold ${prediction.priceVsAverage < 0 ? 'text-green-600' : 'text-orange-500'}`}>
                        {prediction.priceVsAverage > 0 ? '+' : ''}{prediction.priceVsAverage}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price trend</span>
                      <span className={`flex items-center gap-1 font-medium ${
                        prediction.priceMovement === 'fall' ? 'text-green-600' :
                        prediction.priceMovement === 'rise' ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {prediction.priceMovement === 'rise' ? <TrendingUp className="h-3 w-3" /> :
                         prediction.priceMovement === 'fall' ? <TrendingDown className="h-3 w-3" /> :
                         <Minus className="h-3 w-3" />}
                        {prediction.priceMovement === 'rise' ? 'Rising' : prediction.priceMovement === 'fall' ? 'Falling' : 'Stable'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Volatility</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${prediction.volatilityScore > 60 ? 'bg-red-400' : prediction.volatilityScore > 35 ? 'bg-orange-400' : 'bg-green-400'}`}
                            style={{ width: `${prediction.volatilityScore}%` }}
                          />
                        </div>
                        <span className="text-gray-700 text-xs">{prediction.volatilityScore}/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="mt-6 p-4 rounded-xl bg-sky-50 border border-sky-100">
                  <div className="flex gap-2">
                    <Info className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-sky-900">{prediction.explanation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prediction factors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prediction Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prediction.factors.map((factor, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                        factor.impact === 'positive' ? 'bg-green-500' :
                        factor.impact === 'negative' ? 'bg-red-400' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{factor.name}</span>
                          <span className={`text-xs font-medium ${
                            factor.impact === 'positive' ? 'text-green-600' :
                            factor.impact === 'negative' ? 'text-red-500' : 'text-gray-400'
                          }`}>
                            {factor.impact === 'positive' ? '▲ Favorable' : factor.impact === 'negative' ? '▼ Unfavorable' : '— Neutral'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{factor.description}</p>
                        <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden w-full">
                          <div
                            className={`h-full rounded-full ${factor.impact === 'positive' ? 'bg-green-400' : factor.impact === 'negative' ? 'bg-red-400' : 'bg-gray-300'}`}
                            style={{ width: `${Math.round(factor.weight * 100)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{Math.round(factor.weight * 100)}% weight</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/analyze?origin=${origin}&destination=${destination}`}>
                <Card className="card-hover cursor-pointer h-full">
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <BarChart2 className="h-8 w-8 text-sky-500" />
                    <div>
                      <div className="font-semibold text-sm text-gray-900">Historical Analysis</div>
                      <div className="text-xs text-gray-500">90-day price chart</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href={`/calendar?origin=${origin}&destination=${destination}&date=${date}&cabin=${cabin}`}>
                <Card className="card-hover cursor-pointer h-full">
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <Brain className="h-8 w-8 text-purple-500" />
                    <div>
                      <div className="font-semibold text-sm text-gray-900">Flexible Dates</div>
                      <div className="text-xs text-gray-500">Find the cheapest day</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href={`/alerts?origin=${origin}&destination=${destination}&price=${prediction.currentPrice}`}>
                <Card className="card-hover cursor-pointer h-full">
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-orange-500" />
                    <div>
                      <div className="font-semibold text-sm text-gray-900">Price Alert</div>
                      <div className="text-xs text-gray-500">Get notified on drops</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function PredictPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Brain className="h-8 w-8 text-sky-400 animate-pulse" /></div>}>
      <PredictionContent />
    </Suspense>
  );
}
