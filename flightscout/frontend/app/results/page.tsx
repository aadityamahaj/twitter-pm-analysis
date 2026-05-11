'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Plane, SlidersHorizontal, ArrowUpDown, Calendar, TrendingDown, Bell, Bookmark, Brain, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FlightCard } from '@/components/results/FlightCard';
import { PredictionBanner } from '@/components/results/PredictionBanner';
import { ResultsFilters } from '@/components/results/ResultsFilters';
import { FlightSkeleton } from '@/components/results/FlightSkeleton';
import { getMockFlights } from '@/lib/mock-flights';
import { scoreFlights, getDefaultPriorities } from '@/lib/scoring';
import { predictPrice } from '@/lib/ml-client';
import { Flight, UserPriorities, PredictionResult, CabinClass, SearchParams } from '@/types';
import { formatPrice, formatDate, cabinLabel, formatShortDate } from '@/lib/utils';
import { getAirport } from '@/lib/airports';

function ResultsContent() {
  const sp = useSearchParams();
  const router = useRouter();

  const origin = sp.get('origin') ?? 'JFK';
  const destination = sp.get('destination') ?? 'LAX';
  const date = sp.get('date') ?? '';
  const returnDate = sp.get('returnDate') ?? undefined;
  const cabin = (sp.get('cabin') ?? 'economy') as CabinClass;
  const adults = Number(sp.get('adults') ?? 1);
  const maxStops = Number(sp.get('maxStops') ?? 3);
  const budgetParam = sp.get('budget');

  let priorities: UserPriorities = getDefaultPriorities();
  try {
    const p = sp.get('priorities');
    if (p) priorities = JSON.parse(p);
  } catch {}

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'duration'>('score');
  const [maxPrice, setMaxPrice] = useState<number | null>(budgetParam ? Number(budgetParam) : null);
  const [stopFilter, setStopFilter] = useState<number | null>(null);

  const originAirport = getAirport(origin);
  const destAirport = getAirport(destination);

  useEffect(() => {
    setLoading(true);

    const searchParams: SearchParams = {
      origin, destination,
      tripType: returnDate ? 'round_trip' : 'one_way',
      departureDate: date,
      returnDate,
      passengers: { adults, children: 0, infants: 0 },
      cabinClass: cabin,
      maxStops: maxStops as 0 | 1 | 2 | 3,
      priorities,
    };

    // Fetch real flights from API
    fetch('/api/flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchParams),
    })
      .then(res => res.json())
      .then(response => {
        if (response.data?.flights) {
          setFlights(response.data.flights);

          // Fetch ML prediction in background
          if (response.data.flights.length > 0) {
            const cheapest = response.data.flights.reduce((a: Flight, b: Flight) => a.price < b.price ? a : b);
            predictPrice({
              origin, destination,
              departureDate: date,
              returnDate,
              cabinClass: cabin,
              currentPrice: cheapest.price,
              daysUntilDeparture: Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)),
            }).then(setPrediction);
          }
        } else {
          setFlights([]);
        }
      })
      .catch(err => {
        console.error('[Results] Error fetching flights:', err);
        setFlights([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [origin, destination, date, returnDate, cabin, adults, maxStops]);

  const displayedFlights = flights
    .filter(f => maxPrice === null || f.price <= maxPrice)
    .filter(f => stopFilter === null || f.stops === stopFilter)
    .sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'duration') return a.totalDuration - b.totalDuration;
      return (b.flightScoutScore ?? 0) - (a.flightScoutScore ?? 0);
    });

  const cheapestPrice = flights.length ? Math.min(...flights.map(f => f.price)) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="gradient-hero text-white py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <div className="flex items-center gap-2 text-sky-200 text-sm mb-1">
                <Plane className="h-3 w-3" />
                <span>
                  {originAirport?.city ?? origin} → {destAirport?.city ?? destination}
                </span>
                {returnDate && <span>· Round trip</span>}
              </div>
              <h1 className="text-2xl font-bold">
                {origin} → {destination}
              </h1>
              <p className="text-sky-200 text-sm mt-0.5">
                {date ? formatDate(date) : ''}{returnDate ? ` – ${formatDate(returnDate)}` : ''} · {adults} passenger{adults > 1 ? 's' : ''} · {cabinLabel(cabin)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href={`/calendar?origin=${origin}&destination=${destination}&date=${date}&cabin=${cabin}`}>
                <Button size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  <Calendar className="h-3 w-3 mr-1" /> Flexible dates
                </Button>
              </Link>
              <Link href={`/analyze?origin=${origin}&destination=${destination}`}>
                <Button size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  <BarChart2 className="h-3 w-3 mr-1" /> Route analysis
                </Button>
              </Link>
              <Link href={`/predict?origin=${origin}&destination=${destination}&date=${date}&cabin=${cabin}&price=${cheapestPrice}`}>
                <Button size="sm" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  <Brain className="h-3 w-3 mr-1" /> Price prediction
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar filters */}
        <aside>
          <ResultsFilters
            flights={flights}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            stopFilter={stopFilter}
            setStopFilter={setStopFilter}
          />
        </aside>

        {/* Main content */}
        <div className="space-y-4">
          {/* Prediction banner */}
          {prediction && <PredictionBanner prediction={prediction} origin={origin} destination={destination} />}

          {/* Sort + count bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-gray-600">
              {loading ? 'Searching...' : `${displayedFlights.length} of ${flights.length} flights`}
              {cheapestPrice > 0 && !loading && (
                <span className="ml-2 text-green-600 font-medium">
                  From {formatPrice(cheapestPrice)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort:</span>
              {(['score', 'price', 'duration'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    sortBy === s ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {s === 'score' ? '⭐ Best' : s === 'price' ? '$ Price' : '⏱ Duration'}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts callout */}
          <Card className="border-dashed border-sky-200 bg-sky-50">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-sky-800">
                  <Bell className="h-4 w-4 text-sky-500" />
                  <span>
                    <strong>Track this route.</strong> Get an email alert when {origin}→{destination} drops below {formatPrice(cheapestPrice > 0 ? cheapestPrice : 300)}.
                  </span>
                </div>
                <Link href={`/alerts?origin=${origin}&destination=${destination}&price=${cheapestPrice}`}>
                  <Button size="sm" variant="outline" className="border-sky-400 text-sky-700 hover:bg-sky-100 shrink-0">
                    Set alert
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Flight list */}
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <FlightSkeleton key={i} />)
          ) : displayedFlights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Plane className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No flights found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters or check flexible dates.</p>
                <Link href={`/calendar?origin=${origin}&destination=${destination}&date=${date}&cabin=${cabin}`}>
                  <Button className="mt-4" variant="outline">View flexible dates</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            displayedFlights.map(flight => (
              <FlightCard
                key={flight.id}
                flight={flight}
                origin={origin}
                destination={destination}
                date={date}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Plane className="h-8 w-8 animate-spin text-sky-500" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}
