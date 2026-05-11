'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, ArrowLeftRight, Calendar, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays } from 'date-fns';

export function QuickSearchBar() {
  const router = useRouter();
  const today = new Date();
  const [origin, setOrigin] = useState('JFK');
  const [destination, setDestination] = useState('LAX');
  const [date, setDate] = useState(format(addDays(today, 14), 'yyyy-MM-dd'));
  const [returnDate, setReturnDate] = useState(format(addDays(today, 21), 'yyyy-MM-dd'));
  const [tripType, setTripType] = useState<'one_way' | 'round_trip'>('round_trip');
  const [passengers, setPassengers] = useState('1');
  const [cabin, setCabin] = useState('economy');

  function swap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function search() {
    const params = new URLSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      date,
      cabin,
      passengers,
      tripType,
      ...(tripType === 'round_trip' ? { returnDate } : {}),
    });
    router.push(`/results?${params.toString()}`);
  }

  return (
    <div className="text-left space-y-3">
      {/* Trip type + cabin */}
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => setTripType('round_trip')}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${tripType === 'round_trip' ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-300 text-gray-600 hover:border-sky-400'}`}
        >
          Round trip
        </button>
        <button
          onClick={() => setTripType('one_way')}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${tripType === 'one_way' ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-300 text-gray-600 hover:border-sky-400'}`}
        >
          One way
        </button>
        <Select value={cabin} onValueChange={setCabin}>
          <SelectTrigger className="w-40 h-8 text-xs border-gray-300">
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

      {/* Main search row */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr_1fr_auto] gap-2 items-center">
        {/* Origin */}
        <div className="relative">
          <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 uppercase font-semibold text-gray-900 border-gray-300 focus:border-sky-400"
            placeholder="From (JFK)"
            value={origin}
            onChange={e => setOrigin(e.target.value.toUpperCase().slice(0, 4))}
          />
        </div>

        {/* Swap */}
        <button
          onClick={swap}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          title="Swap airports"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        {/* Destination */}
        <div className="relative">
          <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-90" />
          <Input
            className="pl-9 uppercase font-semibold text-gray-900 border-gray-300 focus:border-sky-400"
            placeholder="To (LAX)"
            value={destination}
            onChange={e => setDestination(e.target.value.toUpperCase().slice(0, 4))}
          />
        </div>

        {/* Departure date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="date"
            className="pl-9 border-gray-300 focus:border-sky-400"
            value={date}
            min={format(today, 'yyyy-MM-dd')}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Return date */}
        {tripType === 'round_trip' && (
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="date"
              className="pl-9 border-gray-300 focus:border-sky-400"
              value={returnDate}
              min={date}
              onChange={e => setReturnDate(e.target.value)}
            />
          </div>
        )}

        {/* Search button */}
        <Button
          onClick={search}
          className="bg-sky-600 hover:bg-sky-700 text-white h-10 px-6"
        >
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
}
