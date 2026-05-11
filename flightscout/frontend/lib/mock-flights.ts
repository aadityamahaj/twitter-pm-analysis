/**
 * Mock Flight Data Provider
 *
 * Generates realistic-looking flight data for development.
 * Replace getMockFlights() with a real API call when ready.
 *
 * Supported real providers (set FLIGHT_API_PROVIDER in .env.local):
 *   - amadeus    : Amadeus Self-Service APIs
 *   - duffel     : Duffel Flights API
 *   - kiwi       : Kiwi/Tequila API
 *   - serpapi    : SerpAPI Google Flights
 *   - aviationstack: AviationStack
 */

import { Flight, FlightSegment, SearchParams, CabinClass, Layover } from '@/types';
import { getAirport } from './airports';
import { getAirline, AIRLINES } from './airlines';
import { addDays, format, parseISO, differenceInMinutes } from 'date-fns';

// Base prices per route segment (USD, economy, one-way)
const BASE_PRICES: Record<string, number> = {
  'JFK-LAX': 220, 'LAX-JFK': 215, 'JFK-LHR': 480, 'LHR-JFK': 510,
  'JFK-CDG': 460, 'CDG-JFK': 490, 'JFK-DXB': 680, 'BOS-LAX': 240,
  'ORD-LAX': 180, 'LAX-ORD': 175, 'ATL-LAX': 200, 'SFO-JFK': 280,
  'JFK-SFO': 290, 'MIA-JFK': 180, 'JFK-MIA': 175, 'ORD-JFK': 160,
  'DFW-JFK': 210, 'DEN-JFK': 200, 'SEA-JFK': 270, 'LAS-JFK': 250,
  'LAX-DXB': 720, 'SFO-NRT': 680, 'LAX-NRT': 650, 'JFK-SIN': 900,
  'LAX-SIN': 780, 'JFK-HKG': 850, 'LAX-SYD': 990, 'JFK-IST': 580,
  'LHR-DXB': 380, 'LHR-SIN': 620, 'CDG-DXB': 360, 'AMS-DXB': 340,
};

function getBasePrice(origin: string, destination: string): number {
  const key = `${origin}-${destination}`;
  const revKey = `${destination}-${origin}`;
  return BASE_PRICES[key] ?? BASE_PRICES[revKey] ?? estimatePrice(origin, destination);
}

function estimatePrice(origin: string, destination: string): number {
  const o = getAirport(origin);
  const d = getAirport(destination);
  if (!o || !d) return 300;
  const distKm = haversineKm(o.lat, o.lon, d.lat, d.lon);
  // Rough $/km scaling
  if (distKm < 500) return 120 + distKm * 0.2;
  if (distKm < 2000) return 150 + distKm * 0.08;
  if (distKm < 5000) return 200 + distKm * 0.06;
  return 300 + distKm * 0.05;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CABIN_MULTIPLIERS: Record<CabinClass, number> = {
  economy: 1,
  premium_economy: 2.1,
  business: 4.5,
  first: 8.0,
};

// Airlines that commonly fly specific route types
function getAirlinesForRoute(origin: string, destination: string): string[] {
  const originCountry = getAirport(origin)?.country;
  const destCountry = getAirport(destination)?.country;

  if (originCountry === 'US' && destCountry === 'US') {
    return ['AA', 'UA', 'DL', 'WN', 'B6', 'AS', 'NK', 'F9'];
  }
  if ((originCountry === 'US' && destCountry === 'GB') || (originCountry === 'GB' && destCountry === 'US')) {
    return ['AA', 'BA', 'UA', 'VS', 'DL'];
  }
  if (originCountry === 'US' || destCountry === 'US') {
    return ['AA', 'UA', 'DL', 'EK', 'QR', 'LH', 'BA', 'AF'];
  }
  return ['LH', 'AF', 'BA', 'EK', 'QR', 'TK', 'KL', 'LX'];
}

interface FlightTemplate {
  stops: 0 | 1 | 2;
  durationExtra: number; // minutes added to nonstop time for connections
  priceMultiplier: number;
  layoverAirport?: string;
}

function getFlightTemplates(origin: string, destination: string): FlightTemplate[] {
  const o = getAirport(origin);
  const d = getAirport(destination);
  const distKm = o && d ? haversineKm(o.lat, o.lon, d.lat, d.lon) : 2000;

  const templates: FlightTemplate[] = [];

  if (distKm < 4000) {
    // Nonstop is feasible
    templates.push({ stops: 0, durationExtra: 0, priceMultiplier: 1.0 });
    templates.push({ stops: 1, durationExtra: 90, priceMultiplier: 0.85 });
    templates.push({ stops: 1, durationExtra: 150, priceMultiplier: 0.78 });
  } else {
    // Long haul — nonstop or 1-stop
    templates.push({ stops: 0, durationExtra: 0, priceMultiplier: 1.0 });
    templates.push({ stops: 0, durationExtra: 0, priceMultiplier: 1.05 });
    templates.push({ stops: 1, durationExtra: 120, priceMultiplier: 0.82 });
    templates.push({ stops: 1, durationExtra: 200, priceMultiplier: 0.75 });
    templates.push({ stops: 2, durationExtra: 300, priceMultiplier: 0.65 });
  }

  return templates;
}

function estimateDuration(origin: string, destination: string): number {
  const o = getAirport(origin);
  const d = getAirport(destination);
  if (!o || !d) return 300;
  const distKm = haversineKm(o.lat, o.lon, d.lat, d.lon);
  // ~850 km/h cruising speed + taxi/climb
  return Math.round((distKm / 850) * 60 + 45);
}

function pickLayoverAirport(origin: string, destination: string, stopIndex: number): string {
  const hubs: Record<string, string[]> = {
    'US-EU': ['JFK', 'LHR', 'AMS', 'FRA'],
    'US-ASIA': ['NRT', 'HKG', 'ICN', 'SIN'],
    'INTL': ['DXB', 'DOH', 'IST', 'AUH'],
    'DOM-US': ['ATL', 'ORD', 'DFW', 'DEN'],
  };

  const oCountry = getAirport(origin)?.country;
  const dCountry = getAirport(destination)?.country;

  let pool: string[];
  if (oCountry === 'US' && ['GB', 'FR', 'DE', 'NL', 'ES', 'IT'].includes(dCountry ?? '')) {
    pool = hubs['US-EU'];
  } else if (oCountry === 'US' && ['JP', 'CN', 'KR', 'SG', 'TH', 'HK'].includes(dCountry ?? '')) {
    pool = hubs['US-ASIA'];
  } else if (oCountry === 'US' && dCountry === 'US') {
    pool = hubs['DOM-US'];
  } else {
    pool = hubs['INTL'];
  }

  const options = pool.filter(a => a !== origin && a !== destination);
  return options[stopIndex % options.length] ?? 'ATL';
}

let flightIdCounter = 1;

function generateFlight(
  origin: string,
  destination: string,
  departureDate: string,
  template: FlightTemplate,
  airlineIata: string,
  cabinClass: CabinClass,
  seed: number,
): Flight {
  const basePrice = getBasePrice(origin, destination);
  const baseDuration = estimateDuration(origin, destination);
  const totalDuration = baseDuration + template.durationExtra;

  // Deterministic-ish departure time based on seed
  const depHour = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21][seed % 16];
  const depMin = [0, 15, 30, 45][Math.floor(seed / 16) % 4];

  const depDateTime = new Date(`${departureDate}T${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}:00`);
  const arrDateTime = new Date(depDateTime.getTime() + totalDuration * 60 * 1000);

  const airline = getAirline(airlineIata) ?? { iata: airlineIata, name: airlineIata, alliance: null };

  const segments: FlightSegment[] = [];
  const layovers: Layover[] = [];

  if (template.stops === 0) {
    segments.push({
      flightNumber: `${airlineIata}${100 + seed}`,
      airline,
      origin: getAirport(origin)!,
      destination: getAirport(destination)!,
      departureTime: depDateTime.toISOString(),
      arrivalTime: arrDateTime.toISOString(),
      duration: totalDuration,
      aircraft: pickAircraft(baseDuration),
    });
  } else {
    const layoverAirport1 = pickLayoverAirport(origin, destination, seed);
    const seg1Duration = Math.round(baseDuration * 0.45);
    const layoverDuration1 = Math.round(template.durationExtra * 0.6);
    const seg1Arr = new Date(depDateTime.getTime() + seg1Duration * 60 * 1000);
    const seg2Dep = new Date(seg1Arr.getTime() + layoverDuration1 * 60 * 1000);

    if (template.stops === 1) {
      const seg2Duration = totalDuration - seg1Duration - layoverDuration1;
      segments.push({
        flightNumber: `${airlineIata}${200 + seed}`,
        airline,
        origin: getAirport(origin)!,
        destination: getAirport(layoverAirport1)!,
        departureTime: depDateTime.toISOString(),
        arrivalTime: seg1Arr.toISOString(),
        duration: seg1Duration,
        aircraft: pickAircraft(seg1Duration),
      });
      layovers.push({ airport: getAirport(layoverAirport1)!, duration: layoverDuration1 });
      segments.push({
        flightNumber: `${airlineIata}${300 + seed}`,
        airline,
        origin: getAirport(layoverAirport1)!,
        destination: getAirport(destination)!,
        departureTime: seg2Dep.toISOString(),
        arrivalTime: arrDateTime.toISOString(),
        duration: seg2Duration,
        aircraft: pickAircraft(seg2Duration),
      });
    } else {
      // 2 stops
      const layoverAirport2 = pickLayoverAirport(destination, origin, seed + 1);
      const seg2Duration = Math.round(baseDuration * 0.35);
      const layoverDuration2 = Math.round(template.durationExtra * 0.4);
      const seg2Arr = new Date(seg2Dep.getTime() + seg2Duration * 60 * 1000);
      const seg3Dep = new Date(seg2Arr.getTime() + layoverDuration2 * 60 * 1000);
      const seg3Duration = totalDuration - seg1Duration - layoverDuration1 - seg2Duration - layoverDuration2;

      segments.push({
        flightNumber: `${airlineIata}${200 + seed}`,
        airline,
        origin: getAirport(origin)!,
        destination: getAirport(layoverAirport1)!,
        departureTime: depDateTime.toISOString(),
        arrivalTime: seg1Arr.toISOString(),
        duration: seg1Duration,
        aircraft: pickAircraft(seg1Duration),
      });
      layovers.push({ airport: getAirport(layoverAirport1)!, duration: layoverDuration1 });
      segments.push({
        flightNumber: `${airlineIata}${300 + seed}`,
        airline,
        origin: getAirport(layoverAirport1)!,
        destination: getAirport(layoverAirport2)!,
        departureTime: seg2Dep.toISOString(),
        arrivalTime: seg2Arr.toISOString(),
        duration: seg2Duration,
        aircraft: pickAircraft(seg2Duration),
      });
      layovers.push({ airport: getAirport(layoverAirport2)!, duration: layoverDuration2 });
      segments.push({
        flightNumber: `${airlineIata}${400 + seed}`,
        airline,
        origin: getAirport(layoverAirport2)!,
        destination: getAirport(destination)!,
        departureTime: seg3Dep.toISOString(),
        arrivalTime: arrDateTime.toISOString(),
        duration: seg3Duration,
        aircraft: pickAircraft(seg3Duration),
      });
    }
  }

  // Price variation: ±20% random
  const variance = 0.8 + ((seed * 37 + 13) % 40) / 100;
  const price = Math.round(
    basePrice * template.priceMultiplier * CABIN_MULTIPLIERS[cabinClass] * variance
  );

  // Generate booking URL (Kiwi format)
  const bookingUrl = `https://www.kiwi.com/search/results/${origin}/${destination}/${departureDate}?price=${Math.floor(price)}&stops=${template.stops}`;

  return {
    id: `fs-${flightIdCounter++}`,
    offerId: `mock-${flightIdCounter}`, // For compatibility with providers that use offerId
    segments,
    layovers,
    totalDuration,
    stops: template.stops as 0 | 1 | 2,
    price,
    currency: 'USD',
    cabinClass,
    baggage: {
      carryOn: true,
      checkedBags: cabinClass === 'economy' ? (price < 200 ? 0 : 1) : 2,
      checkedBagWeight: 23,
    },
    isRefundable: seed % 5 === 0,
    co2Kg: Math.round(totalDuration * 0.15 * (template.stops + 1)),
    fareClass: pickFareClass(cabinClass, price, basePrice),
    bookingUrl,
  };
}

function pickAircraft(durationMin: number): string {
  if (durationMin > 600) return ['Boeing 777-300ER', 'Airbus A380', 'Boeing 787-9'][Math.floor(durationMin) % 3];
  if (durationMin > 300) return ['Boeing 737-800', 'Airbus A321', 'Boeing 787-8'][Math.floor(durationMin) % 3];
  return ['Airbus A320', 'Boeing 737 MAX 8', 'Embraer 175'][Math.floor(durationMin) % 3];
}

function pickFareClass(cabin: CabinClass, price: number, avgPrice: number): string {
  const ratio = price / avgPrice;
  if (cabin === 'economy') {
    if (ratio < 0.85) return 'N'; // Basic
    if (ratio < 1.0) return 'L'; // Saver
    if (ratio < 1.15) return 'Y'; // Flexible
    return 'B'; // Full flex
  }
  if (cabin === 'business') return ratio < 1.0 ? 'C' : 'J';
  if (cabin === 'first') return 'F';
  return 'W';
}

export function getMockFlights(params: SearchParams): Flight[] {
  const { origin, destination, departureDate, cabinClass, maxStops } = params;

  if (!getAirport(origin) || !getAirport(destination)) return [];

  const airlines = getAirlinesForRoute(origin, destination);
  const templates = getFlightTemplates(origin, destination);

  const flights: Flight[] = [];

  airlines.forEach((airlineIata, ai) => {
    templates.forEach((template, ti) => {
      if (template.stops > Math.min(maxStops, 2)) return;
      const seed = ai * 10 + ti;
      const flight = generateFlight(origin, destination, departureDate, template, airlineIata, cabinClass, seed);

      // Filter by stop count
      if (flight.stops <= Math.min(maxStops, 2)) {
        flights.push(flight);
      }
    });
  });

  // Sort by price ascending initially
  return flights.sort((a, b) => a.price - b.price);
}

export function getMockFlexibleDates(
  origin: string,
  destination: string,
  centerDate: string,
  days = 30,
  cabinClass: CabinClass = 'economy',
): Array<{ date: string; price: number }> {
  const base = getBasePrice(origin, destination) * CABIN_MULTIPLIERS[cabinClass];
  const results = [];

  for (let i = -Math.floor(days / 2); i <= Math.floor(days / 2); i++) {
    const date = format(addDays(parseISO(centerDate), i), 'yyyy-MM-dd');
    // Day-of-week effect
    const dow = new Date(date).getDay();
    const dowMultiplier = [1.1, 0.95, 0.9, 0.88, 0.92, 1.15, 1.12][dow];
    // Seasonal effect (month)
    const month = new Date(date).getMonth();
    const seasonMultiplier = [0.85, 0.82, 0.9, 0.95, 1.05, 1.2, 1.35, 1.3, 1.1, 0.95, 0.88, 1.15][month];
    // Random noise
    const noise = 0.9 + ((Math.abs(i) * 17 + 7) % 20) / 100;
    const price = Math.round(base * dowMultiplier * seasonMultiplier * noise);
    results.push({ date, price });
  }

  return results;
}
