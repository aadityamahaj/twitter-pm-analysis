/**
 * Flight API Adapter Layer
 *
 * This abstraction layer allows swapping between flight data providers
 * without changing any frontend code. Currently defaults to 'mock'.
 *
 * To add a real provider:
 *   1. Implement the FlightApiAdapter interface below
 *   2. Set FLIGHT_API_PROVIDER=your-provider in .env.local
 *   3. Add your API key env vars
 *
 * Supported providers:
 *   mock       — generated mock data (default, no API key needed)
 *   amadeus    — Amadeus Self-Service APIs (https://developers.amadeus.com)
 *   duffel     — Duffel Flights API (https://duffel.com)
 *   kiwi       — Kiwi/Tequila API (https://tequila.kiwi.com)
 *   serpapi    — SerpAPI Google Flights (https://serpapi.com)
 *   aviationstack — AviationStack (https://aviationstack.com)
 */

import { Flight, SearchParams } from '@/types';
import { getMockFlights } from './mock-flights';

export interface FlightApiAdapter {
  search(params: SearchParams): Promise<Flight[]>;
  name: string;
}

// ---- Mock Adapter ----

class MockAdapter implements FlightApiAdapter {
  name = 'mock';
  async search(params: SearchParams): Promise<Flight[]> {
    return getMockFlights(params);
  }
}

// ---- Amadeus Adapter (stub) ----
// Docs: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search

class AmadeusAdapter implements FlightApiAdapter {
  name = 'amadeus';
  private clientId = process.env.AMADEUS_CLIENT_ID!;
  private clientSecret = process.env.AMADEUS_CLIENT_SECRET!;
  private baseUrl = process.env.AMADEUS_BASE_URL ?? 'https://test.api.amadeus.com';

  private async getToken(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${this.clientId}&client_secret=${this.clientSecret}`,
    });
    const { access_token } = await res.json();
    return access_token;
  }

  async search(params: SearchParams): Promise<Flight[]> {
    const token = await this.getToken();
    const url = new URL(`${this.baseUrl}/v2/shopping/flight-offers`);
    url.searchParams.set('originLocationCode', params.origin);
    url.searchParams.set('destinationLocationCode', params.destination);
    url.searchParams.set('departureDate', params.departureDate);
    url.searchParams.set('adults', String(params.passengers.adults));
    url.searchParams.set('travelClass', params.cabinClass.toUpperCase());
    if (params.maxStops === 0) url.searchParams.set('nonStop', 'true');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    // TODO: Transform data.data (Amadeus FlightOffer[]) to Flight[]
    // See: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search/api-reference
    throw new Error('Amadeus response transformation not yet implemented. See lib/flight-api-adapter.ts.');
  }
}

// ---- Duffel Adapter ----
// Docs: https://duffel.com/docs/api/v1/offers

class DuffelAdapter implements FlightApiAdapter {
  name = 'duffel';
  private apiKey = process.env.NEXT_PUBLIC_DUFFEL_API_KEY!;

  async search(params: SearchParams): Promise<Flight[]> {
    try {
      const res = await fetch('https://api.duffel.com/air/offer_requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'Duffel-Version': 'v2',
        },
        body: JSON.stringify({
          data: {
            slices: [
              {
                origin: params.origin,
                destination: params.destination,
                departure_date: params.departureDate,
              },
            ],
            passengers: [{ type: 'adult' }],
            cabin_class: params.cabinClass,
          },
        }),
      });
      const data = await res.json();

      if (!data.data?.offers) return [];

      return data.data.offers.map((offer: any) => {
        try {
          const slice = offer.slices?.[0];
          if (!slice) return null;

          const segments = slice.segments || [];
          const firstSeg = segments[0];
          if (!firstSeg) return null;

          const duration = this.calculateDuration(slice.duration);
          const stops = segments.length - 1;

          // Generate Skyscanner booking URL with date from first segment
          let bookingUrl = `https://www.skyscanner.com/transport/flights/${params.origin}/${params.destination}`;
          try {
            if (firstSeg.departing_at) {
              const departDate = new Date(firstSeg.departing_at);
              if (!isNaN(departDate.getTime())) {
                const dateStr = departDate.toISOString().split('T')[0]; // YYYY-MM-DD
                bookingUrl = `https://www.skyscanner.com/transport/flights/${params.origin}/${params.destination}/${dateStr}`;
              }
            }
          } catch (e) {
            console.warn('Error parsing departure date for booking URL:', firstSeg.departing_at, e);
          }

          return {
            id: offer.id,
            offerId: offer.id,
            segments: segments.map((seg: any) => ({
              flightNumber: `${seg.operating_airline?.iata_code || 'XX'}${seg.flight_number || ''}`,
              airline: {
                iata: seg.operating_airline?.iata_code || 'XX',
                name: seg.operating_airline?.name || 'Unknown Airline',
              },
              origin: { iata: seg.origin_airport?.iata_code || 'XXX' },
              destination: { iata: seg.destination_airport?.iata_code || 'XXX' },
              departureTime: seg.departing_at || '',
              arrivalTime: seg.arriving_at || '',
              duration: this.calculateDurationMinutes(seg.departing_at, seg.arriving_at),
            })),
            layovers: [],
            totalDuration: duration,
            stops: stops as any,
            price: parseFloat(offer.total_amount || '0'),
            currency: offer.total_currency || 'USD',
            cabinClass: params.cabinClass,
            baggage: {
              carryOn: true,
              checkedBags: 0,
            },
            bookingUrl,
            isRefundable: offer.conditions?.refundable || false,
            co2Kg: Math.floor(Math.random() * 200) + 50,
          };
        } catch (e) {
          console.error('Error mapping offer:', e, offer);
          return null;
        }
      }).filter((f: any) => f !== null);
    } catch (error) {
      console.error('Duffel API error:', error);
      return [];
    }
  }

  private calculateDuration(isoString: string): number {
    const match = isoString.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return 0;
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    return hours * 60 + minutes;
  }

  private calculateDurationMinutes(departure: string, arrival: string): number {
    const depTime = new Date(departure);
    const arrTime = new Date(arrival);
    return Math.round((arrTime.getTime() - depTime.getTime()) / (1000 * 60));
  }
}

// ---- Kiwi/Tequila Adapter ----
// Uses mock flights with real Kiwi booking links
// When Kiwi API key is available, can swap to real API search

class KiwiAdapter implements FlightApiAdapter {
  name = 'kiwi';

  async search(params: SearchParams): Promise<Flight[]> {
    // Generate mock flights (same as mock adapter for now)
    const flights = getMockFlights(params);

    // Transform flights to add Kiwi booking URLs
    return flights.map((flight, idx) => {
      // Generate Kiwi search/booking URL
      const kiwiBookingUrl = this.generateKiwiBookingUrl(params, flight, idx);

      return {
        ...flight,
        bookingUrl: kiwiBookingUrl,
      };
    });
  }

  private generateKiwiBookingUrl(params: SearchParams, flight: Flight, index: number): string {
    // Kiwi booking URL format with search parameters
    const dateStr = params.departureDate; // Format: YYYY-MM-DD
    const base = `https://www.kiwi.com/search/results/${params.origin}/${params.destination}/${dateStr}`;

    // Add flight search parameters to help Kiwi pre-filter
    const url = new URL(base);

    // Add optional params for better UX
    url.searchParams.set('price', String(Math.floor(flight.price)));
    url.searchParams.set('stops', String(flight.stops));

    // When Kiwi affiliate approved, add tracking parameter:
    // url.searchParams.set('affiliateCode', 'flightscout');

    return url.toString();
  }
}

// ---- Factory ----

export function getFlightAdapter(): FlightApiAdapter {
  const provider = process.env.FLIGHT_API_PROVIDER ?? 'mock';
  switch (provider) {
    case 'amadeus': return new AmadeusAdapter();
    case 'duffel': return new DuffelAdapter();
    case 'kiwi': return new KiwiAdapter();
    case 'mock':
    default:
      return new MockAdapter();
  }
}
