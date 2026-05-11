// ============================================================
// FlightScout — Core TypeScript Types
// ============================================================

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';
export type TripType = 'one_way' | 'round_trip' | 'multi_city';
export type PriceMovement = 'rise' | 'fall' | 'stable';
export type BookingRecommendation = 'book_now' | 'wait' | 'track';
export type StopCount = 0 | 1 | 2;

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  lat: number;
  lon: number;
}

export interface Airline {
  iata: string;
  name: string;
  logo?: string;
  alliance?: 'Star Alliance' | 'Oneworld' | 'SkyTeam' | null;
}

export interface FlightSegment {
  flightNumber: string;
  airline: Airline;
  origin: Airport;
  destination: Airport;
  departureTime: string; // ISO 8601
  arrivalTime: string;   // ISO 8601
  duration: number;      // minutes
  aircraft?: string;
  operatedBy?: string;
}

export interface Layover {
  airport: Airport;
  duration: number; // minutes
}

export interface BaggageAllowance {
  carryOn: boolean;
  checkedBags: number;
  checkedBagWeight?: number; // kg
}

export interface Flight {
  id: string;
  segments: FlightSegment[];
  layovers: Layover[];
  totalDuration: number; // minutes
  stops: StopCount;
  price: number;
  currency: string;
  cabinClass: CabinClass;
  baggage: BaggageAllowance;
  deepLink?: string;    // link to book on airline site
  fareClass?: string;
  isRefundable?: boolean;
  co2Kg?: number;

  // FlightScout computed fields
  flightScoutScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  priceVsAverage?: number; // percentage difference
}

export interface ScoreBreakdown {
  price: number;
  duration: number;
  stops: number;
  departureTime: number;
  arrivalTime: number;
  airline: number;
  baggage: number;
  overall: number;
}

// ---- Search ----

export interface SearchParams {
  origin: string;       // IATA code
  destination: string;
  tripType: TripType;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass: CabinClass;
  maxStops: StopCount | 3; // 3 = any
  budget?: number;
  preferredAirlines?: string[];
  flexibility?: 0 | 1 | 2 | 3; // 0=exact, 1=±1day, 2=±3days, 3=±7days
  baggageRequired?: boolean;
  priorities: UserPriorities;
}

export interface UserPriorities {
  price: number;           // 0–100
  duration: number;        // 0–100
  stops: number;           // 0–100
  departureTime: number;   // 0–100
  arrivalTime: number;     // 0–100
  airline: number;         // 0–100
  baggage: number;         // 0–100
  // These should sum to 100 after normalization
}

export interface PreferredTimeRange {
  from: number; // hour 0-23
  to: number;
}

// ---- ML Prediction ----

export interface PredictionRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  cabinClass: CabinClass;
  stops?: number;
  airline?: string;
  currentPrice?: number;
  daysUntilDeparture?: number;
}

export interface PredictionResult {
  predictedPrice: number;
  currentPrice: number;
  priceMovement: PriceMovement;
  confidenceScore: number;   // 0–100
  recommendation: BookingRecommendation;
  explanation: string;
  factors: PredictionFactor[];
  historicalAvg: number;
  priceVsAverage: number;    // percentage
  daysUntilDeparture: number;
  volatilityScore: number;   // 0–100, higher = more volatile
}

export interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

// ---- Historical Analysis ----

export interface HistoricalDataPoint {
  date: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  sampleSize: number;
}

export interface WeekdayAverage {
  day: string;    // Mon–Sun
  avgPrice: number;
  index: number;  // 0=Mon
}

export interface MonthlyAverage {
  month: string;
  avgPrice: number;
  index: number;  // 0=Jan
}

export interface RouteAnalysis {
  origin: string;
  destination: string;
  historicalData: HistoricalDataPoint[];
  weekdayAverages: WeekdayAverage[];
  monthlyAverages: MonthlyAverage[];
  cheapestMonths: string[];
  cheapestDays: string[];
  allTimeAvg: number;
  allTimeLow: number;
  allTimeHigh: number;
  volatilityScore: number;
  currentPriceVsAvg: number;
}

// ---- Alerts ----

export interface PriceAlert {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  targetPrice: number;
  currentPrice?: number;
  cabinClass: CabinClass;
  departureDate?: string;
  isActive: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
  email: string;
}

// ---- Saved Routes ----

export interface SavedRoute {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  label?: string;
  lastPrice?: number;
  priceChange?: number;
  cabinClass: CabinClass;
  createdAt: string;
}

// ---- Calendar ----

export interface FlexibleDateOption {
  date: string;
  price: number;
  isLowest: boolean;
  isBelowAverage: boolean;
  recommendation?: BookingRecommendation;
}

// ---- User ----

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  homeAirport?: string;
  preferredCabin?: CabinClass;
  defaultPriorities?: UserPriorities;
  emailAlerts: boolean;
  currency: string;
  createdAt: string;
}

// ---- API responses ----

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}

export interface SearchResponse {
  flights: Flight[];
  searchId: string;
  totalResults: number;
  cheapestPrice: number;
  currency: string;
  searchedAt: string;
}
