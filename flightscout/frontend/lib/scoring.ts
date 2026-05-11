/**
 * FlightScout Scoring Engine
 *
 * Calculates a 0–100 "FlightScout Score" for each flight based on
 * user-defined priority weights.
 */

import { Flight, UserPriorities, ScoreBreakdown, PreferredTimeRange } from '@/types';
import { AIRLINE_QUALITY } from './airlines';

export interface ScoringContext {
  flights: Flight[];
  priorities: UserPriorities;
  preferredDepartureWindow?: PreferredTimeRange;
  preferredArrivalWindow?: PreferredTimeRange;
  preferredAirlines?: string[];
}

function normalize(priorities: UserPriorities): UserPriorities {
  const total = Object.values(priorities).reduce((s, v) => s + v, 0);
  if (total === 0) {
    return { price: 50, duration: 20, stops: 10, departureTime: 5, arrivalTime: 5, airline: 5, baggage: 5 };
  }
  return {
    price: (priorities.price / total) * 100,
    duration: (priorities.duration / total) * 100,
    stops: (priorities.stops / total) * 100,
    departureTime: (priorities.departureTime / total) * 100,
    arrivalTime: (priorities.arrivalTime / total) * 100,
    airline: (priorities.airline / total) * 100,
    baggage: (priorities.baggage / total) * 100,
  };
}

function scorePrice(price: number, minPrice: number, maxPrice: number): number {
  if (maxPrice === minPrice) return 80;
  // Higher score for lower price (linear)
  return 100 - ((price - minPrice) / (maxPrice - minPrice)) * 100;
}

function scoreDuration(durationMin: number, minDuration: number, maxDuration: number): number {
  if (maxDuration === minDuration) return 80;
  return 100 - ((durationMin - minDuration) / (maxDuration - minDuration)) * 100;
}

function scoreStops(stops: number): number {
  return stops === 0 ? 100 : stops === 1 ? 60 : 25;
}

function scoreTimeWindow(departureTime: string, window?: PreferredTimeRange): number {
  const hour = new Date(departureTime).getHours();
  if (!window) {
    // Default: prefer 6–20
    if (hour >= 6 && hour <= 20) return 80;
    return 40;
  }
  if (hour >= window.from && hour <= window.to) return 100;
  const distance = Math.min(Math.abs(hour - window.from), Math.abs(hour - window.to));
  return Math.max(0, 100 - distance * 15);
}

function scoreAirline(airlineIata: string, preferredAirlines?: string[]): number {
  const quality = AIRLINE_QUALITY[airlineIata] ?? 65;
  if (preferredAirlines && preferredAirlines.length > 0) {
    if (preferredAirlines.includes(airlineIata)) return Math.max(quality, 90);
    return quality * 0.7;
  }
  return quality;
}

function scoreBaggage(flight: Flight): number {
  const { checkedBags, carryOn } = flight.baggage;
  if (checkedBags >= 1 && carryOn) return 100;
  if (checkedBags === 0 && carryOn) return 70;
  return 40;
}

export function scoreFlights(ctx: ScoringContext): Flight[] {
  const { flights, priorities, preferredDepartureWindow, preferredArrivalWindow, preferredAirlines } = ctx;
  if (flights.length === 0) return [];

  const weights = normalize(priorities);

  const prices = flights.map(f => f.price);
  const durations = flights.map(f => f.totalDuration);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  return flights.map(flight => {
    const depTime = flight.segments[0].departureTime;
    const arrTime = flight.segments[flight.segments.length - 1].arrivalTime;
    const mainAirline = flight.segments[0].airline.iata;

    const priceScore = scorePrice(flight.price, minPrice, maxPrice);
    const durationScore = scoreDuration(flight.totalDuration, minDuration, maxDuration);
    const stopsScore = scoreStops(flight.stops);
    const depTimeScore = scoreTimeWindow(depTime, preferredDepartureWindow);
    const arrTimeScore = scoreTimeWindow(arrTime, preferredArrivalWindow);
    const airlineScore = scoreAirline(mainAirline, preferredAirlines);
    const baggageScore = scoreBaggage(flight);

    const overall =
      (priceScore * weights.price +
        durationScore * weights.duration +
        stopsScore * weights.stops +
        depTimeScore * weights.departureTime +
        arrTimeScore * weights.arrivalTime +
        airlineScore * weights.airline +
        baggageScore * weights.baggage) / 100;

    const scoreBreakdown: ScoreBreakdown = {
      price: Math.round(priceScore),
      duration: Math.round(durationScore),
      stops: Math.round(stopsScore),
      departureTime: Math.round(depTimeScore),
      arrivalTime: Math.round(arrTimeScore),
      airline: Math.round(airlineScore),
      baggage: Math.round(baggageScore),
      overall: Math.round(overall),
    };

    return {
      ...flight,
      flightScoutScore: Math.round(overall),
      scoreBreakdown,
    };
  }).sort((a, b) => (b.flightScoutScore ?? 0) - (a.flightScoutScore ?? 0));
}

export function getDefaultPriorities(): UserPriorities {
  return { price: 50, duration: 20, stops: 10, departureTime: 5, arrivalTime: 5, airline: 5, baggage: 5 };
}
