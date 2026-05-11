import { NextRequest, NextResponse } from 'next/server';
import { getMockFlights } from '@/lib/mock-flights';
import { scoreFlights, getDefaultPriorities } from '@/lib/scoring';
import { SearchParams, CabinClass, UserPriorities } from '@/types';
import { generateSearchId } from '@/lib/utils';

/**
 * POST /api/flights
 *
 * Body: SearchParams
 * Returns: { flights, searchId, totalResults, cheapestPrice, searchedAt }
 *
 * To use a real flight API:
 *   Set FLIGHT_API_PROVIDER=amadeus (or duffel, kiwi, serpapi) in .env.local
 *   and implement the adapter in lib/flight-api-adapter.ts
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, departureDate, returnDate, cabinClass, passengers, maxStops, priorities } = body;

    if (!origin || !destination || !departureDate) {
      return NextResponse.json({ error: 'origin, destination, departureDate are required' }, { status: 400 });
    }

    const searchParams: SearchParams = {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      tripType: returnDate ? 'round_trip' : 'one_way',
      departureDate,
      returnDate,
      passengers: passengers ?? { adults: 1, children: 0, infants: 0 },
      cabinClass: (cabinClass ?? 'economy') as CabinClass,
      maxStops: maxStops ?? 3,
      priorities: priorities ?? getDefaultPriorities(),
    };

    const provider = process.env.FLIGHT_API_PROVIDER ?? 'mock';

    let flights;
    if (provider === 'mock') {
      flights = getMockFlights(searchParams);
    } else {
      // Real API adapter (add key + implement adapter for your chosen provider)
      throw new Error(`Flight provider "${provider}" not yet implemented. See lib/flight-api-adapter.ts.`);
    }

    const scored = scoreFlights({ flights, priorities: searchParams.priorities });
    const cheapestPrice = scored.length ? Math.min(...scored.map(f => f.price)) : 0;

    return NextResponse.json({
      data: {
        flights: scored,
        searchId: generateSearchId(),
        totalResults: scored.length,
        cheapestPrice,
        currency: 'USD',
        searchedAt: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    console.error('[API /flights]', err);
    return NextResponse.json({ data: null, error: (err as Error).message }, { status: 500 });
  }
}
