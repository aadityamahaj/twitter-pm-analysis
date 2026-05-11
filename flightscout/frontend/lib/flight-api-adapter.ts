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

// ---- Duffel Adapter (stub) ----
// Docs: https://duffel.com/docs/api/v1/offers

class DuffelAdapter implements FlightApiAdapter {
  name = 'duffel';
  private apiKey = process.env.DUFFEL_API_KEY!;

  async search(params: SearchParams): Promise<Flight[]> {
    const res = await fetch('https://api.duffel.com/air/offer_requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'Duffel-Version': 'v1',
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
    // TODO: Transform data.data.offers to Flight[]
    throw new Error('Duffel response transformation not yet implemented. See lib/flight-api-adapter.ts.');
  }
}

// ---- Kiwi/Tequila Adapter (stub) ----
// Docs: https://tequila.kiwi.com/portal/docs/tequila-api/search_api

class KiwiAdapter implements FlightApiAdapter {
  name = 'kiwi';
  private apiKey = process.env.KIWI_API_KEY!;

  async search(params: SearchParams): Promise<Flight[]> {
    const url = new URL('https://api.tequila.kiwi.com/v2/search');
    url.searchParams.set('fly_from', params.origin);
    url.searchParams.set('fly_to', params.destination);
    url.searchParams.set('date_from', params.departureDate);
    url.searchParams.set('date_to', params.departureDate);
    url.searchParams.set('selected_cabins', params.cabinClass[0].toUpperCase());
    url.searchParams.set('max_stopovers', String(params.maxStops));

    const res = await fetch(url.toString(), {
      headers: { apikey: this.apiKey },
    });
    const data = await res.json();
    // TODO: Transform data.data to Flight[]
    throw new Error('Kiwi response transformation not yet implemented. See lib/flight-api-adapter.ts.');
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
