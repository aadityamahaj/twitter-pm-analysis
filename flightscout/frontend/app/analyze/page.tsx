'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { BarChart2, TrendingDown, TrendingUp, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RouteAnalysis } from '@/types';
import { analyzeRoute } from '@/lib/ml-client';
import { formatPrice } from '@/lib/utils';
import { getAirport } from '@/lib/airports';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-xs">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{formatPrice(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

function AnalyzeContent() {
  const sp = useSearchParams();
  const origin = sp.get('origin') ?? 'JFK';
  const destination = sp.get('destination') ?? 'LAX';

  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const originAirport = getAirport(origin);
  const destAirport = getAirport(destination);

  useEffect(() => {
    setLoading(true);
    analyzeRoute(origin, destination).then(a => {
      setAnalysis(a);
      setLoading(false);
    });
  }, [origin, destination]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <BarChart2 className="h-10 w-10 text-sky-400 animate-pulse" />
      </div>
    );
  }

  if (!analysis) return null;

  const pctDiff = analysis.currentPriceVsAvg;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="gradient-hero text-white py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-2 text-sky-200 text-sm mb-2">
            <BarChart2 className="h-4 w-4" /> Route Analysis
          </div>
          <h1 className="text-3xl font-bold">
            {originAirport?.city ?? origin} → {destAirport?.city ?? destination}
          </h1>
          <p className="text-sky-200 mt-1">{origin} → {destination} · 90-day historical analysis</p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 mt-6 space-y-6">

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Historical Average', value: formatPrice(analysis.allTimeAvg), sub: 'Past 90 days', color: 'text-gray-900' },
            { label: 'All-Time Low', value: formatPrice(analysis.allTimeLow), sub: 'Best price seen', color: 'text-green-600' },
            { label: 'All-Time High', value: formatPrice(analysis.allTimeHigh), sub: 'Peak price', color: 'text-red-500' },
            {
              label: 'Current vs. Avg',
              value: `${pctDiff > 0 ? '+' : ''}${pctDiff}%`,
              sub: pctDiff < -5 ? 'Below average — good deal!' : pctDiff > 5 ? 'Above average' : 'Near average',
              color: pctDiff < 0 ? 'text-green-600' : pctDiff > 0 ? 'text-orange-500' : 'text-gray-600',
            },
          ].map(({ label, value, sub, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4">
                <div className="text-xs text-gray-500 mb-1">{label}</div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts tabs */}
        <Card>
          <CardContent className="pt-4">
            <Tabs defaultValue="history">
              <TabsList className="mb-4">
                <TabsTrigger value="history">Price History</TabsTrigger>
                <TabsTrigger value="weekday">By Day of Week</TabsTrigger>
                <TabsTrigger value="monthly">By Month</TabsTrigger>
              </TabsList>

              {/* 90-day history */}
              <TabsContent value="history">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">90-Day Price History</h3>
                  <Badge variant={pctDiff < 0 ? 'green' : 'orange'}>
                    {pctDiff < 0 ? '↓ Below average' : '↑ Above average'}
                  </Badge>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analysis.historicalData}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={d => d.slice(5)}
                      tick={{ fontSize: 10 }}
                      interval={14}
                    />
                    <YAxis
                      tickFormatter={v => `$${v}`}
                      tick={{ fontSize: 10 }}
                      width={50}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={analysis.allTimeAvg}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{ value: 'Avg', position: 'right', fontSize: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgPrice"
                      name="Avg Price"
                      stroke="#0ea5e9"
                      fill="url(#priceGrad)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>

              {/* By weekday */}
              <TabsContent value="weekday">
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-900">Average Price by Day of Week</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Cheapest days to fly: <strong>{analysis.cheapestDays.join(', ')}</strong></p>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analysis.weekdayAverages}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10 }} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="avgPrice"
                      name="Avg Price"
                      radius={[4, 4, 0, 0]}
                      fill="#0ea5e9"
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {analysis.cheapestDays.map(d => (
                    <Badge key={d} variant="green">{d} cheapest</Badge>
                  ))}
                </div>
              </TabsContent>

              {/* By month */}
              <TabsContent value="monthly">
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-900">Average Price by Month</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Cheapest months: <strong>{analysis.cheapestMonths.join(', ')}</strong></p>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analysis.monthlyAverages}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10 }} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="avgPrice"
                      name="Avg Price"
                      radius={[4, 4, 0, 0]}
                      fill="#8b5cf6"
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {analysis.cheapestMonths.map(m => (
                    <Badge key={m} variant="purple">{m}</Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">📅 Best Time to Book</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>✅ <strong>Book on {analysis.cheapestDays[0]}</strong> for the cheapest fares</p>
              <p>✅ <strong>Travel in {analysis.cheapestMonths[0]}</strong> for lowest prices</p>
              <p>✅ Book <strong>6–8 weeks in advance</strong> for this route</p>
              <p className="text-xs text-gray-500 mt-3">Based on historical patterns — actual prices vary.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">📊 Volatility Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${analysis.volatilityScore > 60 ? 'bg-red-400' : analysis.volatilityScore > 35 ? 'bg-orange-400' : 'bg-green-400'}`}
                    style={{ width: `${analysis.volatilityScore}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">{analysis.volatilityScore}/100</span>
              </div>
              <p className="text-sm text-gray-700">
                {analysis.volatilityScore > 60
                  ? 'High volatility — prices on this route fluctuate significantly. Track closely and set alerts.'
                  : analysis.volatilityScore > 35
                  ? 'Moderate volatility — some price movement expected but not extreme.'
                  : 'Low volatility — prices on this route are relatively stable.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTAs */}
        <div className="flex gap-4 flex-wrap">
          <Link href={`/predict?origin=${origin}&destination=${destination}`}>
            <Button className="bg-sky-600 hover:bg-sky-700 text-white">
              Get AI prediction <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/calendar?origin=${origin}&destination=${destination}`}>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" /> Flexible date calendar
            </Button>
          </Link>
          <Link href={`/results?origin=${origin}&destination=${destination}&date=${new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}&cabin=economy`}>
            <Button variant="outline">Search flights</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><BarChart2 className="h-8 w-8 text-sky-400 animate-pulse" /></div>}>
      <AnalyzeContent />
    </Suspense>
  );
}
