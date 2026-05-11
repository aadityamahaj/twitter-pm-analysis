'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Calendar, Plane, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getMockFlexibleDates } from '@/lib/mock-flights';
import { CabinClass, FlexibleDateOption } from '@/types';
import { formatPrice, formatShortDate } from '@/lib/utils';
import { getAirport } from '@/lib/airports';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';

function CalendarContent() {
  const sp = useSearchParams();
  const router = useRouter();

  const origin = sp.get('origin') ?? 'JFK';
  const destination = sp.get('destination') ?? 'LAX';
  const dateParam = sp.get('date') ?? format(addDays(new Date(), 14), 'yyyy-MM-dd');
  const cabin = (sp.get('cabin') ?? 'economy') as CabinClass;

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(parseISO(dateParam)));
  const [flexDates, setFlexDates] = useState<Array<{ date: string; price: number }>>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const originAirport = getAirport(origin);
  const destAirport = getAirport(destination);

  useEffect(() => {
    const dates = getMockFlexibleDates(origin, destination, dateParam, 60, cabin);
    setFlexDates(dates);
  }, [origin, destination, dateParam, cabin]);

  const priceMap = new Map(flexDates.map(d => [d.date, d.price]));
  const prices = flexDates.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / (prices.length || 1));

  function getPriceColor(price: number): string {
    if (!price) return '';
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    if (ratio < 0.25) return 'bg-green-100 text-green-800 border-green-200';
    if (ratio < 0.5) return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    if (ratio < 0.75) return 'bg-orange-50 text-orange-800 border-orange-200';
    return 'bg-red-50 text-red-800 border-red-200';
  }

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Pad start
  const startPad = Array.from({ length: startOfMonth(currentMonth).getDay() });

  const cheapestDate = flexDates.reduce((a, b) => a.price < b.price ? a : b, flexDates[0]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="gradient-hero text-white py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-sky-200 text-sm mb-2">
            <Calendar className="h-4 w-4" /> Flexible Date Calendar
          </div>
          <h1 className="text-3xl font-bold">
            {originAirport?.city ?? origin} → {destAirport?.city ?? destination}
          </h1>
          <p className="text-sky-200 mt-1">Find the cheapest day to fly — colored by price</p>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 mt-6 space-y-5">

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Cheapest day', value: cheapestDate ? formatShortDate(cheapestDate.date) : '—', sub: cheapestDate ? formatPrice(cheapestDate.price) : '', color: 'text-green-600' },
            { label: 'Average price', value: formatPrice(avgPrice), sub: 'This period', color: 'text-gray-900' },
            { label: 'Priciest day', value: formatPrice(maxPrice), sub: 'Peak price', color: 'text-red-500' },
          ].map(({ label, value, sub, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-xs text-gray-500">{label}</div>
                <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
                {sub && <div className="text-xs text-gray-400">{sub}</div>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
          <span className="font-medium">Price:</span>
          {[
            { label: 'Cheapest', cls: 'bg-green-100 border-green-200' },
            { label: 'Low', cls: 'bg-yellow-50 border-yellow-200' },
            { label: 'Average', cls: 'bg-orange-50 border-orange-200' },
            { label: 'Expensive', cls: 'bg-red-50 border-red-200' },
          ].map(({ label, cls }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`h-3 w-3 rounded border ${cls}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <Card>
          <CardContent className="pt-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(m => addMonths(m, -1))} className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {startPad.map((_, i) => <div key={`pad-${i}`} />)}
              {monthDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const price = priceMap.get(dateStr);
                const isSelected = selectedDate === dateStr;
                const isPast = day < new Date();
                const isCheapest = cheapestDate && dateStr === cheapestDate.date;

                return (
                  <button
                    key={dateStr}
                    disabled={isPast || !price}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`
                      relative p-1 rounded-lg border text-center transition-all
                      ${isPast || !price ? 'opacity-30 cursor-not-allowed border-transparent' : 'cursor-pointer hover:ring-2 hover:ring-sky-400'}
                      ${price ? getPriceColor(price) : 'bg-gray-50 text-gray-300 border-gray-100'}
                      ${isSelected ? 'ring-2 ring-sky-500 ring-offset-1' : ''}
                    `}
                  >
                    <div className="text-xs font-medium">{format(day, 'd')}</div>
                    {price && (
                      <div className="text-[9px] font-semibold">${price}</div>
                    )}
                    {isCheapest && price && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected date action */}
        {selectedDate && (
          <Card className="border-sky-200 bg-sky-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-semibold text-gray-900">
                    {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    From <strong className="text-green-600">{formatPrice(priceMap.get(selectedDate) ?? 0)}</strong> · {origin} → {destination}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/results?origin=${origin}&destination=${destination}&date=${selectedDate}&cabin=${cabin}`}>
                    <Button className="bg-sky-600 hover:bg-sky-700 text-white">
                      Search flights for this date <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cheapest date quick jump */}
        {cheapestDate && (
          <div className="flex gap-4 items-center flex-wrap">
            <span className="text-sm text-gray-600">Best date found:</span>
            <Badge variant="green">
              {format(parseISO(cheapestDate.date), 'EEEE, MMM d')} — {formatPrice(cheapestDate.price)}
            </Badge>
            <Link href={`/results?origin=${origin}&destination=${destination}&date=${cheapestDate.date}&cabin=${cabin}`}>
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">
                Book cheapest date
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Calendar className="h-8 w-8 text-sky-400 animate-pulse" /></div>}>
      <CalendarContent />
    </Suspense>
  );
}
