import { Airport } from '@/types';

export const AIRPORTS: Airport[] = [
  { iata: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'US', timezone: 'America/New_York', lat: 40.6413, lon: -73.7781 },
  { iata: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'US', timezone: 'America/New_York', lat: 40.7769, lon: -73.8740 },
  { iata: 'EWR', name: 'Newark Liberty International', city: 'Newark', country: 'US', timezone: 'America/New_York', lat: 40.6895, lon: -74.1745 },
  { iata: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'US', timezone: 'America/Los_Angeles', lat: 33.9425, lon: -118.4081 },
  { iata: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'US', timezone: 'America/Chicago', lat: 41.9742, lon: -87.9073 },
  { iata: 'MDW', name: 'Midway International', city: 'Chicago', country: 'US', timezone: 'America/Chicago', lat: 41.7868, lon: -87.7522 },
  { iata: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'US', timezone: 'America/New_York', lat: 33.6407, lon: -84.4277 },
  { iata: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'US', timezone: 'America/Chicago', lat: 32.8998, lon: -97.0403 },
  { iata: 'DEN', name: 'Denver International', city: 'Denver', country: 'US', timezone: 'America/Denver', lat: 39.8561, lon: -104.6737 },
  { iata: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'US', timezone: 'America/Los_Angeles', lat: 37.6213, lon: -122.3790 },
  { iata: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'US', timezone: 'America/Los_Angeles', lat: 47.4502, lon: -122.3088 },
  { iata: 'BOS', name: 'Logan International', city: 'Boston', country: 'US', timezone: 'America/New_York', lat: 42.3656, lon: -71.0096 },
  { iata: 'MIA', name: 'Miami International', city: 'Miami', country: 'US', timezone: 'America/New_York', lat: 25.7959, lon: -80.2870 },
  { iata: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', country: 'US', timezone: 'America/Los_Angeles', lat: 36.0840, lon: -115.1537 },
  { iata: 'MCO', name: 'Orlando International', city: 'Orlando', country: 'US', timezone: 'America/New_York', lat: 28.4312, lon: -81.3081 },
  { iata: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', country: 'US', timezone: 'America/Phoenix', lat: 33.4373, lon: -112.0078 },
  { iata: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'US', timezone: 'America/Chicago', lat: 29.9902, lon: -95.3368 },
  { iata: 'CLT', name: 'Charlotte Douglas International', city: 'Charlotte', country: 'US', timezone: 'America/New_York', lat: 35.2140, lon: -80.9431 },
  { iata: 'DTW', name: 'Detroit Metropolitan Wayne County', city: 'Detroit', country: 'US', timezone: 'America/Detroit', lat: 42.2162, lon: -83.3554 },
  { iata: 'MSP', name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', country: 'US', timezone: 'America/Chicago', lat: 44.8848, lon: -93.2223 },
  // International
  { iata: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'GB', timezone: 'Europe/London', lat: 51.4700, lon: -0.4543 },
  { iata: 'LGW', name: 'Gatwick Airport', city: 'London', country: 'GB', timezone: 'Europe/London', lat: 51.1481, lon: -0.1903 },
  { iata: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'FR', timezone: 'Europe/Paris', lat: 49.0097, lon: 2.5479 },
  { iata: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'NL', timezone: 'Europe/Amsterdam', lat: 52.3105, lon: 4.7683 },
  { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'DE', timezone: 'Europe/Berlin', lat: 50.0379, lon: 8.5622 },
  { iata: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'AE', timezone: 'Asia/Dubai', lat: 25.2532, lon: 55.3657 },
  { iata: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'SG', timezone: 'Asia/Singapore', lat: 1.3644, lon: 103.9915 },
  { iata: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'JP', timezone: 'Asia/Tokyo', lat: 35.7720, lon: 140.3929 },
  { iata: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'JP', timezone: 'Asia/Tokyo', lat: 35.5494, lon: 139.7798 },
  { iata: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'HK', timezone: 'Asia/Hong_Kong', lat: 22.3080, lon: 113.9185 },
  { iata: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'AU', timezone: 'Australia/Sydney', lat: -33.9399, lon: 151.1753 },
  { iata: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'AU', timezone: 'Australia/Melbourne', lat: -37.6690, lon: 144.8410 },
  { iata: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'CA', timezone: 'America/Toronto', lat: 43.6777, lon: -79.6248 },
  { iata: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'CA', timezone: 'America/Vancouver', lat: 49.1967, lon: -123.1815 },
  { iata: 'MEX', name: 'Benito Juárez International', city: 'Mexico City', country: 'MX', timezone: 'America/Mexico_City', lat: 19.4363, lon: -99.0721 },
  { iata: 'GRU', name: 'São Paulo/Guarulhos International', city: 'São Paulo', country: 'BR', timezone: 'America/Sao_Paulo', lat: -23.4356, lon: -46.4731 },
  { iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'DE', timezone: 'Europe/Berlin', lat: 48.3537, lon: 11.7750 },
  { iata: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'ES', timezone: 'Europe/Madrid', lat: 40.4936, lon: -3.5668 },
  { iata: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'IT', timezone: 'Europe/Rome', lat: 41.8003, lon: 12.2389 },
  { iata: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'TH', timezone: 'Asia/Bangkok', lat: 13.6900, lon: 100.7501 },
  { iata: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'KR', timezone: 'Asia/Seoul', lat: 37.4602, lon: 126.4407 },
  { iata: 'PVG', name: 'Shanghai Pudong International', city: 'Shanghai', country: 'CN', timezone: 'Asia/Shanghai', lat: 31.1443, lon: 121.8083 },
  { iata: 'PEK', name: 'Beijing Capital International', city: 'Beijing', country: 'CN', timezone: 'Asia/Shanghai', lat: 40.0801, lon: 116.5846 },
  { iata: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'IN', timezone: 'Asia/Kolkata', lat: 28.5665, lon: 77.1031 },
  { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'IN', timezone: 'Asia/Kolkata', lat: 19.0896, lon: 72.8656 },
  { iata: 'JNB', name: 'O.R. Tambo International Airport', city: 'Johannesburg', country: 'ZA', timezone: 'Africa/Johannesburg', lat: -26.1367, lon: 28.2420 },
  { iata: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'EG', timezone: 'Africa/Cairo', lat: 30.1219, lon: 31.4056 },
  { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'TR', timezone: 'Europe/Istanbul', lat: 41.2758, lon: 28.7519 },
  { iata: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'QA', timezone: 'Asia/Qatar', lat: 25.2731, lon: 51.6079 },
  { iata: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi', country: 'AE', timezone: 'Asia/Dubai', lat: 24.4330, lon: 54.6511 },
];

const airportMap = new Map(AIRPORTS.map(a => [a.iata, a]));

export function getAirport(iata: string): Airport | undefined {
  return airportMap.get(iata.toUpperCase());
}

export function searchAirports(query: string, limit = 8): Airport[] {
  if (!query || query.length < 2) return [];
  const q = query.toUpperCase();
  const exact = AIRPORTS.filter(a => a.iata === q);
  const starts = AIRPORTS.filter(
    a => a.iata !== q && (
      a.city.toUpperCase().startsWith(query.toUpperCase()) ||
      a.name.toUpperCase().startsWith(query.toUpperCase())
    )
  );
  const contains = AIRPORTS.filter(
    a => !exact.includes(a) && !starts.includes(a) && (
      a.city.toUpperCase().includes(query.toUpperCase()) ||
      a.name.toUpperCase().includes(query.toUpperCase()) ||
      a.country.toUpperCase().includes(query.toUpperCase())
    )
  );
  return [...exact, ...starts, ...contains].slice(0, limit);
}

export function getNearbyAirports(iata: string, maxKm = 150): Airport[] {
  const base = getAirport(iata);
  if (!base) return [];
  return AIRPORTS
    .filter(a => a.iata !== iata)
    .map(a => ({ airport: a, dist: haversineKm(base.lat, base.lon, a.lat, a.lon) }))
    .filter(({ dist }) => dist <= maxKm)
    .sort((a, b) => a.dist - b.dist)
    .map(({ airport }) => airport);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
