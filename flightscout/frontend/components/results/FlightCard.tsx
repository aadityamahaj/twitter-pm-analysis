'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plane, Clock, Luggage, Wifi, ChevronDown, ChevronUp, RefreshCw, Leaf, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flight } from '@/types';
import {
  formatPrice, formatDateTime, formatDuration, formatStops,
  cabinLabel, scoreColor, scoreBgColor, cn
} from '@/lib/utils';

interface Props {
  flight: Flight;
  origin: string;
  destination: string;
  date: string;
}

export function FlightCard({ flight, origin, destination, date }: Props) {
  const [expanded, setExpanded] = useState(false);

  const firstSeg = flight.segments[0];
  const lastSeg = flight.segments[flight.segments.length - 1];
  const score = flight.flightScoutScore ?? 0;
  const mainAirline = firstSeg.airline;

  // Generate Google Flights search URL with pre-filled flight details
  const generateGoogleFlightsUrl = () => {
    // Format: YYYY-MM-DD
    const formattedDate = date;

    // Build search query with flight details
    const searchQuery = `flights from ${origin} to ${destination} ${formattedDate} ${mainAirline.name}`;

    // Google Flights search URL
    const baseUrl = 'https://www.google.com/travel/search';
    const params = new URLSearchParams({
      q: searchQuery,
      type: 'f',
      tfs: formattedDate,
    });

    return `${baseUrl}?${params.toString()}`;
  };

  const googleFlightsUrl = generateGoogleFlightsUrl();

  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="p-0">
        {/* Main row */}
        <div className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">

            {/* Airline + flight info */}
            <div className="flex items-center gap-3 md:w-48">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                {mainAirline.iata}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{mainAirline.name}</div>
                <div className="text-xs text-gray-500">{firstSeg.flightNumber}</div>
              </div>
            </div>

            {/* Times + route */}
            <div className="flex-1 flex items-center gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{formatDateTime(firstSeg.departureTime)}</div>
                <div className="text-xs text-gray-500 font-medium">{firstSeg.origin.iata}</div>
              </div>

              <div className="flex-1 relative flex flex-col items-center gap-1">
                <div className="text-xs text-gray-500">{formatDuration(flight.totalDuration)}</div>
                <div className="relative w-full flex items-center">
                  <div className="h-px bg-gray-200 flex-1" />
                  {flight.stops > 0 && (
                    <>
                      {flight.layovers.map((l, i) => (
                        <div key={i} className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                          <div className="h-2.5 w-2.5 rounded-full border-2 border-orange-400 bg-white" />
                        </div>
                      ))}
                    </>
                  )}
                  <Plane className="h-3 w-3 text-sky-500 rotate-90" />
                  <div className="h-px bg-gray-200 flex-1" />
                </div>
                <div className="text-xs">
                  <Badge
                    variant={flight.stops === 0 ? 'green' : flight.stops === 1 ? 'orange' : 'red'}
                    className="text-[10px] px-2 py-0"
                  >
                    {formatStops(flight.stops)}
                  </Badge>
                </div>
              </div>

              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{formatDateTime(lastSeg.arrivalTime)}</div>
                <div className="text-xs text-gray-500 font-medium">{lastSeg.destination.iata}</div>
              </div>
            </div>

            {/* Price + score + CTA */}
            <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-1 md:w-36">
              <div className="text-right">
                <div className="text-2xl font-extrabold text-gray-900">{formatPrice(flight.price)}</div>
                <div className="text-xs text-gray-500">{cabinLabel(flight.cabinClass)} / person</div>
              </div>

              {/* FlightScout Score */}
              <div className="flex items-center gap-1.5">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${scoreBgColor(score)}`}>
                  {score}
                </div>
                <span className="text-xs text-gray-500 hidden md:block">Score</span>
              </div>

              <Button
                type="button"
                className="bg-sky-600 hover:bg-sky-700 text-white text-sm px-4 h-9 shrink-0"
                onClick={() => {
                  console.log('[Book Now] Opening Google Flights:', googleFlightsUrl);
                  window.open(googleFlightsUrl, '_blank');
                }}
              >
                Book Now
              </Button>
            </div>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            {flight.baggage.checkedBags > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Luggage className="h-3 w-3" /> {flight.baggage.checkedBags} bag{flight.baggage.checkedBags > 1 ? 's' : ''} included
              </div>
            )}
            {flight.baggage.checkedBags === 0 && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <Luggage className="h-3 w-3" /> Carry-on only
              </div>
            )}
            {flight.isRefundable && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <RefreshCw className="h-3 w-3" /> Refundable
              </div>
            )}
            {flight.co2Kg && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Leaf className="h-3 w-3" /> {flight.co2Kg} kg CO₂
              </div>
            )}
            {flight.fareClass && (
              <div className="text-xs text-gray-400">Fare: {flight.fareClass}</div>
            )}
            {flight.priceVsAverage !== undefined && (
              <div className={`text-xs font-medium ${flight.priceVsAverage < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                {flight.priceVsAverage < 0 ? `${Math.abs(flight.priceVsAverage).toFixed(0)}% below avg` : `${flight.priceVsAverage.toFixed(0)}% above avg`}
              </div>
            )}

            <button
              className="ml-auto flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Hide details' : 'Flight details'}
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t bg-gray-50 px-5 py-4 space-y-3">
            {/* Score breakdown */}
            {flight.scoreBreakdown && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">FlightScout Score Breakdown</div>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                  {Object.entries(flight.scoreBreakdown)
                    .filter(([k]) => k !== 'overall')
                    .map(([key, val]) => (
                      <div key={key} className="text-center">
                        <div className={`text-sm font-bold ${scoreColor(val as number)}`}>{val}</div>
                        <div className="text-[10px] text-gray-400 capitalize">{key}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Segments */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Itinerary</div>
              <div className="space-y-2">
                {flight.segments.map((seg, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-xs bg-gray-200 px-1.5 py-0.5 rounded">{seg.flightNumber}</span>
                      <span className="font-semibold">{formatDateTime(seg.departureTime)}</span>
                      <span className="text-gray-500">{seg.origin.iata}</span>
                      <Plane className="h-3 w-3 text-sky-400" />
                      <span className="text-gray-500">{seg.destination.iata}</span>
                      <span className="font-semibold">{formatDateTime(seg.arrivalTime)}</span>
                      <span className="text-xs text-gray-400">{formatDuration(seg.duration)}</span>
                    </div>
                    {seg.aircraft && (
                      <div className="text-xs text-gray-400 ml-14">{seg.aircraft}</div>
                    )}
                    {/* Layover info */}
                    {i < flight.layovers.length && (
                      <div className="flex items-center gap-2 ml-14 mt-1 mb-1 text-xs text-orange-600">
                        <Clock className="h-3 w-3" />
                        {formatDuration(flight.layovers[i].duration)} layover in {flight.layovers[i].airport.city}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Link href={`/predict?origin=${origin}&destination=${destination}&date=${date}&cabin=${flight.cabinClass}&price=${flight.price}`}>
                <Button size="sm" variant="outline">
                  <Star className="h-3 w-3 mr-1" /> Price prediction
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
