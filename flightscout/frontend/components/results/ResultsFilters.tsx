'use client';
import { Flight } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

interface Props {
  flights: Flight[];
  maxPrice: number | null;
  setMaxPrice: (p: number | null) => void;
  stopFilter: number | null;
  setStopFilter: (s: number | null) => void;
}

export function ResultsFilters({ flights, maxPrice, setMaxPrice, stopFilter, setStopFilter }: Props) {
  const prices = flights.map(f => f.price);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 2000;

  const stopCounts = [0, 1, 2].map(s => ({
    stops: s,
    count: flights.filter(f => f.stops === s).length,
  })).filter(s => s.count > 0);

  const airlines = Array.from(
    flights.reduce((m, f) => {
      const iata = f.segments[0].airline.iata;
      const name = f.segments[0].airline.name;
      m.set(iata, { iata, name, count: (m.get(iata)?.count ?? 0) + 1, minPrice: Math.min(m.get(iata)?.minPrice ?? Infinity, f.price) });
      return m;
    }, new Map<string, { iata: string; name: string; count: number; minPrice: number }>())
  ).map(([, v]) => v).sort((a, b) => a.minPrice - b.minPrice);

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Price */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Max price</span>
            <span className="text-sky-600 font-semibold">{maxPrice ? formatPrice(maxPrice) : 'Any'}</span>
          </div>
          <Slider
            min={minP}
            max={maxP}
            step={10}
            value={[maxPrice ?? maxP]}
            onValueChange={([v]) => setMaxPrice(v === maxP ? null : v)}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatPrice(minP)}</span>
            <span>{formatPrice(maxP)}</span>
          </div>
        </div>

        {/* Stops */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Stops</div>
          <div className="space-y-1">
            <button
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${stopFilter === null ? 'bg-sky-50 text-sky-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
              onClick={() => setStopFilter(null)}
            >
              Any ({flights.length})
            </button>
            {stopCounts.map(({ stops, count }) => (
              <button
                key={stops}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${stopFilter === stops ? 'bg-sky-50 text-sky-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                onClick={() => setStopFilter(stops === stopFilter ? null : stops)}
              >
                {stops === 0 ? 'Nonstop' : stops === 1 ? '1 stop' : '2+ stops'} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Airlines */}
        {airlines.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Airlines</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {airlines.map(({ iata, name, count, minPrice }) => (
                <div key={iata} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                      {iata}
                    </div>
                    <span className="text-gray-700 text-xs">{name.split(' ').slice(0, 2).join(' ')}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatPrice(minPrice)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
