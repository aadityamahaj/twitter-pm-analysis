'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Bookmark, Plus, Trash2, Plane, TrendingDown, TrendingUp, Minus, BarChart2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { format, addDays } from 'date-fns';

interface SavedRoute {
  id: string;
  origin: string;
  destination: string;
  label?: string;
  lastPrice: number;
  priceChange: number;
  cabinClass: string;
  createdAt: string;
}

const DEMO_SAVED: SavedRoute[] = [
  { id: 's1', origin: 'JFK', destination: 'LAX', label: 'NYC to LA', lastPrice: 209, priceChange: -12, cabinClass: 'economy', createdAt: '2026-04-01' },
  { id: 's2', origin: 'BOS', destination: 'LHR', label: 'Boston to London', lastPrice: 489, priceChange: 24, cabinClass: 'economy', createdAt: '2026-03-15' },
  { id: 's3', origin: 'SFO', destination: 'NRT', label: 'SF to Tokyo', lastPrice: 678, priceChange: 0, cabinClass: 'premium_economy', createdAt: '2026-04-10' },
  { id: 's4', origin: 'ORD', destination: 'MIA', label: 'Chicago to Miami', lastPrice: 145, priceChange: -8, cabinClass: 'economy', createdAt: '2026-03-28' },
];

export default function SavedPage() {
  const [saved, setSaved] = useState<SavedRoute[]>(DEMO_SAVED);

  function remove(id: string) {
    setSaved(prev => prev.filter(r => r.id !== id));
  }

  const departDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="gradient-hero text-white py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-2 text-sky-200 text-sm mb-2">
            <Bookmark className="h-4 w-4" /> Saved Routes
          </div>
          <h1 className="text-3xl font-bold">My Route Watchlist</h1>
          <p className="text-sky-200 mt-1">Track your favorite routes and monitor price changes</p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 mt-6 space-y-4">

        {saved.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bookmark className="h-10 w-10 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No saved routes</h3>
              <p className="text-gray-500 text-sm mb-4">Search for flights and save routes to track price changes.</p>
              <Link href="/search">
                <Button className="bg-sky-600 hover:bg-sky-700 text-white">Search flights</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          saved.map(route => (
            <Card key={route.id} className="card-hover">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                      <Plane className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{route.origin} → {route.destination}</div>
                      {route.label && <div className="text-xs text-gray-500">{route.label}</div>}
                    </div>
                  </div>

                  {/* Price + change */}
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{formatPrice(route.lastPrice)}</div>
                    <div className={`text-xs flex items-center gap-0.5 justify-center font-medium ${
                      route.priceChange < 0 ? 'text-green-600' : route.priceChange > 0 ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {route.priceChange < 0 ? <TrendingDown className="h-3 w-3" /> :
                       route.priceChange > 0 ? <TrendingUp className="h-3 w-3" /> :
                       <Minus className="h-3 w-3" />}
                      {route.priceChange !== 0 ? `${route.priceChange > 0 ? '+' : ''}${formatPrice(Math.abs(route.priceChange))}` : 'No change'}
                    </div>
                  </div>

                  <Badge variant="secondary" className="capitalize">{route.cabinClass.replace('_', ' ')}</Badge>

                  {/* Actions */}
                  <div className="ml-auto flex gap-2">
                    <Link href={`/results?origin=${route.origin}&destination=${route.destination}&date=${departDate}&cabin=${route.cabinClass}`}>
                      <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">
                        <Search className="h-3 w-3 mr-1" /> Search
                      </Button>
                    </Link>
                    <Link href={`/analyze?origin=${route.origin}&destination=${route.destination}`}>
                      <Button size="sm" variant="outline">
                        <BarChart2 className="h-3 w-3 mr-1" /> Analyze
                      </Button>
                    </Link>
                    <button
                      onClick={() => remove(route.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <div className="flex justify-center pt-2">
          <Link href="/search">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Add route to watchlist
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
