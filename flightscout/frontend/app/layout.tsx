import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://flightscout.app'),
  title: {
    default: 'FlightScout — Smart Flight Search & Price Prediction',
    template: '%s | FlightScout',
  },
  description:
    'Find the best flights, predict price trends, and know exactly when to book with FlightScout\'s AI-powered travel intelligence.',
  keywords: ['flights', 'cheap flights', 'flight price prediction', 'price alerts', 'travel deals'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://flightscout.app',
    siteName: 'FlightScout',
    title: 'FlightScout — Smart Flight Search & Price Prediction',
    description: 'AI-powered flight search that tells you when to book.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
