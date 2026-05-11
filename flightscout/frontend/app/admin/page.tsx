'use client';
import { useState } from 'react';
import { Terminal, Brain, Database, Zap, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL ?? 'http://localhost:8000';

interface EndpointResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: unknown;
  ms?: number;
}

async function callEndpoint(path: string, body: unknown): Promise<{ data: unknown; ms: number }> {
  const start = Date.now();
  const res = await fetch(`${ML_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - start;
  const data = await res.json();
  return { data, ms };
}

export default function AdminPage() {
  const [origin, setOrigin] = useState('JFK');
  const [destination, setDestination] = useState('LAX');
  const [price, setPrice] = useState('250');
  const [days, setDays] = useState('21');

  const [predictResult, setPredictResult] = useState<EndpointResult>({ status: 'idle', data: null });
  const [analyzeResult, setAnalyzeResult] = useState<EndpointResult>({ status: 'idle', data: null });
  const [recommendResult, setRecommendResult] = useState<EndpointResult>({ status: 'idle', data: null });
  const [trainResult, setTrainResult] = useState<EndpointResult>({ status: 'idle', data: null });
  const [mlStatus, setMlStatus] = useState<'idle' | 'online' | 'offline'>('idle');

  async function checkMLStatus() {
    setMlStatus('idle');
    try {
      const res = await fetch(`${ML_API_URL}/health`, { signal: AbortSignal.timeout(3000) });
      setMlStatus(res.ok ? 'online' : 'offline');
    } catch {
      setMlStatus('offline');
    }
  }

  async function testPredict() {
    setPredictResult({ status: 'loading', data: null });
    try {
      const { data, ms } = await callEndpoint('/predict-price', {
        origin, destination,
        departureDate: new Date(Date.now() + Number(days) * 86400000).toISOString().split('T')[0],
        cabinClass: 'economy',
        currentPrice: Number(price),
        daysUntilDeparture: Number(days),
      });
      setPredictResult({ status: 'success', data, ms });
    } catch (e) {
      setPredictResult({ status: 'error', data: String(e) });
    }
  }

  async function testAnalyze() {
    setAnalyzeResult({ status: 'loading', data: null });
    try {
      const { data, ms } = await callEndpoint('/analyze-route', { origin, destination });
      setAnalyzeResult({ status: 'success', data, ms });
    } catch (e) {
      setAnalyzeResult({ status: 'error', data: String(e) });
    }
  }

  async function testRecommend() {
    setRecommendResult({ status: 'loading', data: null });
    try {
      const { data, ms } = await callEndpoint('/recommend-booking', {
        origin, destination,
        departureDate: new Date(Date.now() + Number(days) * 86400000).toISOString().split('T')[0],
        cabinClass: 'economy',
        currentPrice: Number(price),
        daysUntilDeparture: Number(days),
      });
      setRecommendResult({ status: 'success', data, ms });
    } catch (e) {
      setRecommendResult({ status: 'error', data: String(e) });
    }
  }

  async function testTrain() {
    setTrainResult({ status: 'loading', data: null });
    try {
      const { data, ms } = await callEndpoint('/train-model', { dataPath: 'data/mock_historical.parquet' });
      setTrainResult({ status: 'success', data, ms });
    } catch (e) {
      setTrainResult({ status: 'error', data: String(e) });
    }
  }

  function ResultPanel({ result }: { result: EndpointResult }) {
    if (result.status === 'idle') return <div className="text-xs text-gray-400 italic">Click to test</div>;
    if (result.status === 'loading') return <div className="flex items-center gap-2 text-sky-600"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;
    return (
      <div>
        <div className={`flex items-center gap-2 mb-2 text-xs font-medium ${result.status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
          {result.status === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {result.status === 'success' ? `Success (${result.ms}ms)` : 'Error'}
        </div>
        <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-auto max-h-48 leading-relaxed">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-12">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="container mx-auto max-w-6xl flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">FlightScout Dev Console</h1>
            <p className="text-xs text-gray-400">ML backend testing · API endpoints · Model training</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge
              variant={mlStatus === 'online' ? 'green' : mlStatus === 'offline' ? 'red' : 'secondary'}
              className="text-xs"
            >
              ML Backend: {mlStatus === 'idle' ? 'Unknown' : mlStatus}
            </Badge>
            <Button size="sm" variant="outline" onClick={checkMLStatus} className="border-gray-700 text-gray-300 hover:bg-gray-800">
              <RefreshCw className="h-3 w-3 mr-1" /> Check
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 mt-6 space-y-6">

        {/* Info banner */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">
          <span className="text-sky-400 font-semibold">ML Backend URL:</span> {ML_API_URL}
          <span className="ml-4 text-gray-600">·</span>
          <span className="ml-4">Start with: <code className="text-green-400">cd ml-backend && uvicorn main:app --reload</code></span>
        </div>

        {/* Test inputs */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Test Parameters</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Origin', value: origin, setter: setOrigin, upper: true },
              { label: 'Destination', value: destination, setter: setDestination, upper: true },
              { label: 'Current Price ($)', value: price, setter: setPrice, type: 'number' },
              { label: 'Days Until Departure', value: days, setter: setDays, type: 'number' },
            ].map(({ label, value, setter, upper, type }) => (
              <div key={label}>
                <Label className="text-xs text-gray-500 mb-1 block">{label}</Label>
                <Input
                  type={type ?? 'text'}
                  value={value}
                  onChange={e => setter(upper ? e.target.value.toUpperCase() : e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white text-sm h-8"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Endpoint tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-200">POST /predict-price</div>
                <div className="text-xs text-gray-500">Price movement prediction + recommendation</div>
              </div>
              <Button size="sm" onClick={testPredict} className="bg-sky-700 hover:bg-sky-600 text-white">
                <Brain className="h-3 w-3 mr-1" /> Test
              </Button>
            </div>
            <ResultPanel result={predictResult} />
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-200">POST /analyze-route</div>
                <div className="text-xs text-gray-500">Historical analysis + seasonal patterns</div>
              </div>
              <Button size="sm" onClick={testAnalyze} className="bg-purple-700 hover:bg-purple-600 text-white">
                <Database className="h-3 w-3 mr-1" /> Test
              </Button>
            </div>
            <ResultPanel result={analyzeResult} />
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-200">POST /recommend-booking</div>
                <div className="text-xs text-gray-500">Book now / Wait / Track recommendation</div>
              </div>
              <Button size="sm" onClick={testRecommend} className="bg-green-700 hover:bg-green-600 text-white">
                <Zap className="h-3 w-3 mr-1" /> Test
              </Button>
            </div>
            <ResultPanel result={recommendResult} />
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-200">POST /train-model</div>
                <div className="text-xs text-gray-500">Retrain XGBoost model on latest data</div>
              </div>
              <Button size="sm" onClick={testTrain} className="bg-orange-700 hover:bg-orange-600 text-white">
                <RefreshCw className="h-3 w-3 mr-1" /> Train
              </Button>
            </div>
            <ResultPanel result={trainResult} />
          </div>
        </div>

        {/* Architecture notes */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400 space-y-2">
          <h3 className="font-semibold text-gray-200 mb-3">Architecture Notes</h3>
          <p>• <span className="text-sky-400">Frontend</span>: Next.js 14 (App Router) + Supabase Auth + Recharts</p>
          <p>• <span className="text-sky-400">ML Backend</span>: FastAPI + XGBoost + scikit-learn → trained on mock historical data</p>
          <p>• <span className="text-sky-400">Data layer</span>: Mock flight provider in <code className="text-green-400">lib/mock-flights.ts</code> — swap with real API by setting <code className="text-green-400">FLIGHT_API_PROVIDER</code></p>
          <p>• <span className="text-sky-400">Alerts</span>: Cron job (every 1h) polls prices → sends via Resend if threshold crossed</p>
          <p>• <span className="text-sky-400">Scoring</span>: Weighted priority algorithm in <code className="text-green-400">lib/scoring.ts</code></p>
          <p>• <span className="text-sky-400">ML fallback</span>: If ML backend is offline, rule-based heuristics in <code className="text-green-400">lib/ml-client.ts</code></p>
        </div>
      </div>
    </div>
  );
}
