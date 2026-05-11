import Link from 'next/link';
import { ArrowRight, BarChart2, Bell, Brain, Calendar, CheckCircle, Plane, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuickSearchBar } from '@/components/search/QuickSearchBar';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Price Prediction',
    description: 'Our XGBoost ML model analyzes 50+ signals to predict whether prices will rise, fall, or stay stable.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: BarChart2,
    title: 'Historical Analysis',
    description: 'See 90 days of price history, cheapest travel days, and seasonal trends for any route.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: Bell,
    title: 'Price Drop Alerts',
    description: 'Set your target price and get notified instantly when fares drop below your threshold.',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: Zap,
    title: 'FlightScout Score',
    description: 'Ranked by what matters to you — price, duration, stops, airline — weighted by your priorities.',
    color: 'text-yellow-600 bg-yellow-50',
  },
  {
    icon: Calendar,
    title: 'Flexible Date Calendar',
    description: 'See cheapest fares across a 30-day window. Find the perfect date-price combination.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: Shield,
    title: 'Book Now or Wait?',
    description: 'Get a plain-English recommendation with a confidence score. No more guessing.',
    color: 'text-sky-600 bg-sky-50',
  },
];

const POPULAR_ROUTES = [
  { origin: 'JFK', destination: 'LAX', price: 189, trend: 'fall' },
  { origin: 'BOS', destination: 'LHR', price: 429, trend: 'stable' },
  { origin: 'SFO', destination: 'NRT', price: 598, trend: 'rise' },
  { origin: 'ORD', destination: 'MIA', price: 142, trend: 'fall' },
  { origin: 'LAX', destination: 'DXB', price: 649, trend: 'stable' },
  { origin: 'JFK', destination: 'CDG', price: 387, trend: 'fall' },
];

const STATS = [
  { label: 'Routes Analyzed', value: '50,000+' },
  { label: 'Avg. Savings', value: '$127' },
  { label: 'Prediction Accuracy', value: '78%' },
  { label: 'Price Alerts Sent', value: '2.4M+' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="gradient-hero text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
            ✨ AI-Powered Flight Intelligence
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Stop Guessing.
            <br />
            <span className="text-sky-200">Start Scouting.</span>
          </h1>
          <p className="text-xl text-sky-100 mb-10 max-w-2xl mx-auto">
            FlightScout uses machine learning to predict flight price movements so you always know
            the perfect moment to book. Compare, analyze, and save.
          </p>
          <div className="bg-white rounded-2xl p-4 shadow-2xl max-w-3xl mx-auto">
            <QuickSearchBar />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-sky-900 text-white py-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(({ label, value }) => (
              <div key={label}>
                <div className="text-2xl md:text-3xl font-bold text-sky-300">{value}</div>
                <div className="text-sm text-sky-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Smarter than a search engine
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              FlightScout doesn&apos;t just find flights — it tells you what to do with them.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <Card key={title} className="card-hover border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular routes */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Popular Routes</h2>
              <p className="text-gray-600 mt-1">Trending fares with live prediction signals</p>
            </div>
            <Link href="/search">
              <Button variant="outline">View all routes <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_ROUTES.map(({ origin, destination, price, trend }) => (
              <Link
                key={`${origin}-${destination}`}
                href={`/results?origin=${origin}&destination=${destination}&date=${getTomorrowPlus(14)}&cabin=economy`}
              >
                <Card className="card-hover cursor-pointer">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Plane className="h-4 w-4 text-sky-500" />
                        <span className="font-semibold text-gray-900">
                          {origin} → {destination}
                        </span>
                      </div>
                      <Badge
                        variant={trend === 'fall' ? 'green' : trend === 'rise' ? 'red' : 'blue'}
                      >
                        {trend === 'fall' ? '↓ Falling' : trend === 'rise' ? '↑ Rising' : '→ Stable'}
                      </Badge>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">${price}</span>
                        <span className="text-sm text-gray-500 ml-1">per person</span>
                      </div>
                      <span className="text-xs text-gray-400">Economy</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-14 text-gray-900">How FlightScout Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Search your route', desc: 'Enter origin, destination, dates, and your travel preferences.' },
              { step: '2', title: 'See ranked results', desc: 'Flights are scored and ranked based on your priorities — price, time, airline, and more.' },
              { step: '3', title: 'Book with confidence', desc: 'Get an AI recommendation: Book Now, Wait, or Track — with a confidence percentage.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white text-xl font-bold mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 gradient-hero text-white">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to fly smarter?
          </h2>
          <p className="text-sky-100 mb-8 text-lg">
            Join thousands of travelers who never overpay for flights.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/search">
              <Button size="xl" className="bg-white text-sky-700 hover:bg-sky-50">
                Search flights <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="xl" variant="outline" className="border-white text-white hover:bg-white/10">
                Create free account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4 bg-white">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sky-600 font-semibold">
            <Plane className="h-4 w-4" />
            FlightScout
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} FlightScout. For demonstration purposes. Data is simulated.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            <Link href="/admin" className="hover:text-gray-900">Dev Console</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getTomorrowPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
