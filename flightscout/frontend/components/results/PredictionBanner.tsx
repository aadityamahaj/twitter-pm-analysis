'use client';
import Link from 'next/link';
import { Brain, TrendingDown, TrendingUp, Minus, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PredictionResult } from '@/types';
import { recommendationLabel, recommendationColor, formatPrice } from '@/lib/utils';

interface Props {
  prediction: PredictionResult;
  origin: string;
  destination: string;
}

const MOVEMENT_ICONS = {
  rise: TrendingUp,
  fall: TrendingDown,
  stable: Minus,
};

const MOVEMENT_COLORS = {
  rise: 'text-red-500',
  fall: 'text-green-500',
  stable: 'text-gray-500',
};

export function PredictionBanner({ prediction, origin, destination }: Props) {
  const Icon = MOVEMENT_ICONS[prediction.priceMovement];
  const recColor = recommendationColor(prediction.recommendation);

  return (
    <Card className="border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Icon */}
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
            <Brain className="h-5 w-5 text-sky-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">FlightScout AI Prediction</span>
              <Badge className={`text-xs border ${recColor}`}>
                {recommendationLabel(prediction.recommendation)}
              </Badge>
              <span className="text-xs text-gray-500">{prediction.confidenceScore}% confidence</span>
            </div>
            <p className="text-sm text-gray-700">{prediction.explanation}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 flex-wrap">
              <span>
                Current: <strong>{formatPrice(prediction.currentPrice)}</strong>
              </span>
              <span>
                Hist. avg: <strong>{formatPrice(prediction.historicalAvg)}</strong>
              </span>
              <span className={`flex items-center gap-0.5 font-medium ${MOVEMENT_COLORS[prediction.priceMovement]}`}>
                <Icon className="h-3 w-3" />
                Prices {prediction.priceMovement === 'rise' ? 'rising' : prediction.priceMovement === 'fall' ? 'falling' : 'stable'}
              </span>
              <span>Volatility: {prediction.volatilityScore}/100</span>
            </div>
          </div>

          {/* Full analysis link */}
          <Link
            href={`/predict?origin=${origin}&destination=${destination}&price=${prediction.currentPrice}`}
            className="shrink-0"
          >
            <Button size="sm" variant="outline" className="border-sky-300 text-sky-700 hover:bg-sky-100">
              Full analysis <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
