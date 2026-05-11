import { NextRequest, NextResponse } from 'next/server';
import { getFlightAdapter } from '@/lib/flight-api-adapter';
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
  console.log('[API /flights] POST request received');
  try {
    const body = await req.json();
    console.log('[API] Request body:', { origin: body.origin, destination: body.destination, departureDate: body.departureDate });
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

    // Use configured provider from environment
    const provider = process.env.FLIGHT_API_PROVIDER ?? 'mock';
    console.log('[API] ========== FLIGHT SEARCH START ==========');
    console.log('[API] Provider:', provider);
    console.log('[API] Route: ' + searchParams.origin + ' -> ' + searchParams.destination);
    console.log('[API] Date:', searchParams.departureDate);

    let flights;
    console.log('[API] Using adapter');
    const adapter = getFlightAdapter();
    console.log('[API] Adapter instantiated:', adapter.name);
    try {
      flights = await adapter.search(searchParams);
      console.log('[API] Got', flights.length, 'flights from', adapter.name);
    } catch (adapterErr) {
      console.error('[API] Adapter error:', adapterErr);
      // Fallback to mock flights
      flights = getMockFlights(searchParams);
      console.log('[API] Fallback to mock:', flights.length, 'flights');
    }
    if (flights.length > 0) {
      console.log('[API] First flight:', {
        id: flights[0].id,
        price: flights[0].price,
        bookingUrl: flights[0].bookingUrl,
        offerId: flights[0].offerId,
      });
    }

    const scored = scoreFlights({ flights, priorities: searchParams.priorities });
    console.log('[API] After scoring:', scored.length, 'flights');
    if (scored.length > 0) {
      console.log('[API] Top flight:', {
        id: scored[0].id,
        score: scored[0].flightScoutScore,
        price: scored[0].price,
        bookingUrl: scored[0].bookingUrl,
      });
    }
    console.log('[API] ========== FLIGHT SEARCH END ==========');
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
