'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plane, ArrowLeftRight, Calendar, Users, Search, SlidersHorizontal,
  ChevronDown, ChevronUp, Luggage, Clock, Minus, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, addDays } from 'date-fns';
import { AIRLINES } from '@/lib/airlines';
import { getDefaultPriorities } from '@/lib/scoring';
import { UserPriorities, CabinClass } from '@/types';
import { AirportCombobox } from '@/components/search/AirportCombobox';

const PRIORITY_LABELS: Record<keyof UserPriorities, string> = {
  price: 'Lowest Price',
  duration: 'Shortest Flight',
  stops: 'Fewest Stops',
  departureTime: 'Departure Time',
  arrivalTime: 'Arrival Time',
  airline: 'Best Airline',
  baggage: 'Baggage Included',
};

export default function SearchPage() {
  const router = useRouter();
  const today = new Date();

  const [origin, setOrigin] = useState('JFK');
  const [destination, setDestination] = useState('LAX');
  const [tripType, setTripType] = useState<'one_way' | 'round_trip'>('round_trip');
  const [departureDate, setDepartureDate] = useState(format(addDays(today, 14), 'yyyy-MM-dd'));
  const [returnDate, setReturnDate] = useState(format(addDays(today, 21), 'yyyy-MM-dd'));
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<CabinClass>('economy');
  const [maxStops, setMaxStops] = useState(2);
  const [budget, setBudget] = useState('');
  const [flexibility, setFlexibility] = useState(0);
  const [preferredAirlines, setPreferredAirlines] = useState<string[]>([]);
  const [baggageRequired, setBaggageRequired] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priorities, setPriorities] = useState<UserPriorities>(getDefaultPriorities());

  function swap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function toggleAirline(iata: string) {
    setPreferredAirlines(prev =>
      prev.includes(iata) ? prev.filter(a => a !== iata) : [...prev, iata]
    );
  }

  function updatePriority(key: keyof UserPriorities, val: number) {
    setPriorities(prev => ({ ...prev, [key]: val }));
  }

  function handleSearch() {
    const params = new URLSearchParams({
      origin,
      destination,
      tripType,
      date: departureDate,
      cabin: cabinClass,
      adults: adults.toString(),
      children: children.toString(),
      infants: infants.toString(),
      maxStops: maxStops.toString(),
      flexibility: flexibility.toString(),
      ...(tripType === 'round_trip' ? { returnDate } : {}),
      ...(budget ? { budget } : {}),
      ...(baggageRequired ? { baggage: '1' } : {}),
      ...(preferredAirlines.length ? { airlines: preferredAirlines.join(',') } : {}),
      priorities: JSON.stringify(priorities),
    });
    router.push(`/results?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero */}
      <div className="gradient-hero text-white py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold mb-2">Search Flights</h1>
          <p className="text-sky-200 text-sm">
            Tell us your priorities — we&apos;ll rank results accordingly
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 -mt-6">
        <Card className="shadow-lg">
          <CardContent className="pt-6 space-y-6">

            {/* Trip type selector */}
            <div className="flex gap-2">
              {(['round_trip', 'one_way'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTripType(t)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    tripType === t
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'border-gray-300 text-gray-600 hover:border-sky-400'
                  }`}
                >
                  {t === 'round_trip' ? 'Round Trip' : 'One Way'}
                </button>
              ))}
            </div>

            {/* Route + dates */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr_1fr] gap-3 items-end">
              <div>
                <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">From</Label>
                <AirportCombobox value={origin} onChange={setOrigin} placeholder="Departure airport" />
              </div>

              <button
                onClick={swap}
                className="mb-0.5 p-2 rounded-full border hover:bg-gray-50 text-gray-500 self-end"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>

              <div>
                <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">To</Label>
                <AirportCombobox value={destination} onChange={setDestination} placeholder="Destination airport" />
              </div>

              <div>
                <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Depart</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={departureDate}
                    min={format(today, 'yyyy-MM-dd')}
                    onChange={e => setDepartureDate(e.target.value)}
                  />
                </div>
              </div>

              {tripType === 'round_trip' && (
                <div>
                  <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Return</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={returnDate}
                      min={departureDate}
                      onChange={e => setReturnDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Passengers + Cabin */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Adults</Label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <button onClick={() => setAdults(Math.max(1, adults - 1))} className="text-gray-500 hover:text-gray-900">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="flex-1 text-center text-sm font-medium">{adults}</span>
                  <button onClick={() => setAdults(Math.min(9, adults + 1))} className="text-gray-500 hover:text-gray-900">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Children</Label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <button onClick={() => setChildren(Math.max(0, children - 1))} className="text-gray-500 hover:text-gray-900">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="flex-1 text-center text-sm font-medium">{children}</span>
                  <button onClick={() => setChildren(Math.min(8, children + 1))} className="text-gray-500 hover:text-gray-900">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Cabin</Label>
                <Select value={cabinClass} onValueChange={v => setCabinClass(v as CabinClass)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="premium_economy">Premium Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Max Stops</Label>
                <Select value={maxStops.toString()} onValueChange={v => setMaxStops(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nonstop only</SelectItem>
                    <SelectItem value="1">Up to 1 stop</SelectItem>
                    <SelectItem value="2">Up to 2 stops</SelectItem>
                    <SelectItem value="3">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showAdvanced ? 'Hide' : 'Show'} advanced filters
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showAdvanced && (
              <div className="border-t pt-4 space-y-6">
                {/* Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Max Budget (USD)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Date Flexibility</Label>
                    <Select value={flexibility.toString()} onValueChange={v => setFlexibility(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Exact dates</SelectItem>
                        <SelectItem value="1">± 1 day</SelectItem>
                        <SelectItem value="2">± 3 days</SelectItem>
                        <SelectItem value="3">± 7 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Baggage */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={baggageRequired}
                      onChange={e => setBaggageRequired(e.target.checked)}
                    />
                    <Luggage className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Only show flights with checked baggage included</span>
                  </label>
                </div>

                {/* Preferred Airlines */}
                <div>
                  <Label className="mb-2 block text-xs text-gray-500 uppercase tracking-wide">Preferred Airlines</Label>
                  <div className="flex flex-wrap gap-2">
                    {AIRLINES.slice(0, 20).map(airline => (
                      <button
                        key={airline.iata}
                        onClick={() => toggleAirline(airline.iata)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          preferredAirlines.includes(airline.iata)
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'border-gray-300 text-gray-600 hover:border-sky-400'
                        }`}
                      >
                        {airline.iata} · {airline.name.split(' ').slice(0, 2).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Priority Weights */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-1">My Priorities</h3>
              <p className="text-xs text-gray-500 mb-4">
                Adjust sliders to tell FlightScout what matters most to you. Results will be ranked accordingly.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(priorities) as (keyof UserPriorities)[]).map(key => (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-sm text-gray-700">{PRIORITY_LABELS[key]}</Label>
                      <span className="text-xs font-medium text-sky-600 tabular-nums w-6">{priorities[key]}</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[priorities[key]]}
                      onValueChange={([val]) => updatePriority(key, val)}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Search button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSearch}
                size="lg"
                className="bg-sky-600 hover:bg-sky-700 text-white px-10"
              >
                <Search className="h-5 w-5 mr-2" />
                Search Flights
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="text-sm text-gray-500">Popular searches:</span>
          {[
            ['JFK', 'LAX'], ['BOS', 'LHR'], ['SFO', 'NRT'], ['ORD', 'MIA'],
          ].map(([o, d]) => (
            <button
              key={`${o}-${d}`}
              onClick={() => {
                setOrigin(o);
                setDestination(d);
              }}
              className="text-sm text-sky-600 hover:text-sky-800 font-medium"
            >
              {o} → {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
