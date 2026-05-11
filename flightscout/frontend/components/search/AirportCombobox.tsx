'use client';
import { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchAirports, getAirport } from '@/lib/airports';
import { Airport } from '@/types';

interface Props {
  value: string;
  onChange: (iata: string) => void;
  placeholder?: string;
}

export function AirportCombobox({ value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Airport[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const airport = getAirport(value);
    setQuery(airport ? `${airport.iata} — ${airport.city}` : value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInput(q: string) {
    setQuery(q);
    const res = searchAirports(q);
    setResults(res);
    setOpen(res.length > 0);
  }

  function select(airport: Airport) {
    onChange(airport.iata);
    setQuery(`${airport.iata} — ${airport.city}`);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          className="pl-9"
          value={query}
          placeholder={placeholder ?? 'Airport or city'}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
        />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {results.map(airport => (
            <button
              key={airport.iata}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-sky-50 text-left transition-colors"
              onClick={() => select(airport)}
            >
              <span className="text-sm font-bold text-sky-600 w-10 shrink-0">{airport.iata}</span>
              <div>
                <div className="text-sm font-medium text-gray-900">{airport.city}, {airport.country}</div>
                <div className="text-xs text-gray-500">{airport.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
