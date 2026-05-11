import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { CabinClass, BookingRecommendation, PriceMovement } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function formatPrice(price: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'h:mm a');
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy');
}

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), 'MMM d');
}

export function cabinLabel(cabin: CabinClass): string {
  const labels: Record<CabinClass, string> = {
    economy: 'Economy',
    premium_economy: 'Premium Economy',
    business: 'Business',
    first: 'First Class',
  };
  return labels[cabin];
}

export function recommendationLabel(rec: BookingRecommendation): string {
  const labels: Record<BookingRecommendation, string> = {
    book_now: 'Book Now',
    wait: 'Wait',
    track: 'Track',
  };
  return labels[rec];
}

export function recommendationColor(rec: BookingRecommendation): string {
  return {
    book_now: 'text-green-600 bg-green-50 border-green-200',
    wait: 'text-blue-600 bg-blue-50 border-blue-200',
    track: 'text-orange-600 bg-orange-50 border-orange-200',
  }[rec];
}

export function movementColor(movement: PriceMovement): string {
  return { rise: 'text-red-500', fall: 'text-green-500', stable: 'text-gray-500' }[movement];
}

export function movementIcon(movement: PriceMovement): string {
  return { rise: '↑', fall: '↓', stable: '→' }[movement];
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function scoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export function formatStops(stops: number): string {
  if (stops === 0) return 'Nonstop';
  if (stops === 1) return '1 stop';
  return `${stops} stops`;
}

export function generateSearchId(): string {
  return `srch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}
