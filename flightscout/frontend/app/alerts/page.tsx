'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Bell, Plus, Trash2, Plane, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPrice, formatDate } from '@/lib/utils';
import { CabinClass } from '@/types';
import { AIRPORTS } from '@/lib/airports';

interface MockAlert {
  id: string;
  origin: string;
  destination: string;
  targetPrice: number;
  currentPrice: number;
  cabinClass: CabinClass;
  isActive: boolean;
  triggered: boolean;
  createdAt: string;
  email: string;
}

const DEMO_ALERTS: MockAlert[] = [
  {
    id: 'a1', origin: 'JFK', destination: 'LAX', targetPrice: 180, currentPrice: 209,
    cabinClass: 'economy', isActive: true, triggered: false,
    createdAt: '2026-04-20', email: 'user@example.com',
  },
  {
    id: 'a2', origin: 'BOS', destination: 'LHR', targetPrice: 400, currentPrice: 389,
    cabinClass: 'economy', isActive: true, triggered: true,
    createdAt: '2026-04-15', email: 'user@example.com',
  },
  {
    id: 'a3', origin: 'SFO', destination: 'NRT', targetPrice: 600, currentPrice: 650,
    cabinClass: 'economy', isActive: false, triggered: false,
    createdAt: '2026-04-10', email: 'user@example.com',
  },
];

function AlertsContent() {
  const sp = useSearchParams();
  const defaultOrigin = sp.get('origin') ?? '';
  const defaultDest = sp.get('destination') ?? '';
  const defaultPrice = sp.get('price') ?? '';

  const [alerts, setAlerts] = useState<MockAlert[]>(DEMO_ALERTS);
  const [showForm, setShowForm] = useState(!!(defaultOrigin && defaultDest));

  // Form state
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDest);
  const [targetPrice, setTargetPrice] = useState(
    defaultPrice ? String(Math.round(Number(defaultPrice) * 0.9)) : ''
  );
  const [cabin, setCabin] = useState<CabinClass>('economy');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);

  function createAlert() {
    if (!origin || !destination || !targetPrice || !email) return;
    const newAlert: MockAlert = {
      id: `a${Date.now()}`,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      targetPrice: Number(targetPrice),
      currentPrice: Number(targetPrice) * 1.1,
      cabinClass: cabin,
      isActive: true,
      triggered: false,
      createdAt: new Date().toISOString().split('T')[0],
      email,
    };
    setAlerts(prev => [newAlert, ...prev]);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowForm(false);
    }, 2000);
  }

  function deleteAlert(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  function toggleAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="gradient-hero text-white py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-2 text-sky-200 text-sm mb-2">
            <Bell className="h-4 w-4" /> Price Alerts
          </div>
          <h1 className="text-3xl font-bold">Flight Price Alerts</h1>
          <p className="text-sky-200 mt-1">
            Get emailed the moment fares drop below your target
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 mt-6 space-y-5">

        {/* Create alert button */}
        {!showForm && (
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(true)} className="bg-sky-600 hover:bg-sky-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> New alert
            </Button>
          </div>
        )}

        {/* Alert form */}
        {showForm && (
          <Card className="border-sky-100">
            <CardHeader>
              <CardTitle className="text-base">Create Price Alert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">From (IATA)</Label>
                  <Input
                    value={origin}
                    onChange={e => setOrigin(e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="JFK"
                    className="uppercase font-semibold"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">To (IATA)</Label>
                  <Input
                    value={destination}
                    onChange={e => setDestination(e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="LAX"
                    className="uppercase font-semibold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Alert me when price drops below ($)</Label>
                  <Input
                    type="number"
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    placeholder="e.g. 200"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Cabin class</Label>
                  <Select value={cabin} onValueChange={v => setCabin(v as CabinClass)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="premium_economy">Premium Economy</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="first">First Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Email for notifications</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="flex gap-2 pt-2">
                {saved ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle className="h-4 w-4" /> Alert created! You&apos;ll receive an email when prices drop.
                  </div>
                ) : (
                  <>
                    <Button onClick={createAlert} className="bg-sky-600 hover:bg-sky-700 text-white">
                      <Bell className="h-4 w-4 mr-2" /> Create alert
                    </Button>
                    <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing alerts */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Active Alerts ({alerts.filter(a => a.isActive).length})</h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <Card key={alert.id} className={alert.triggered ? 'border-green-200 bg-green-50' : alert.isActive ? '' : 'opacity-60'}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Route */}
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${alert.triggered ? 'bg-green-500' : alert.isActive ? 'bg-sky-500' : 'bg-gray-300'}`}>
                        <Bell className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{alert.origin} → {alert.destination}</div>
                        <div className="text-xs text-gray-500">{alert.cabinClass} · Created {formatDate(alert.createdAt)}</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-sm">
                      <span className="text-gray-500">Alert at </span>
                      <span className="font-bold text-gray-900">{formatPrice(alert.targetPrice)}</span>
                      <span className="text-gray-500 ml-2">Current: </span>
                      <span className={`font-bold ${alert.currentPrice <= alert.targetPrice ? 'text-green-600' : 'text-gray-700'}`}>
                        {formatPrice(alert.currentPrice)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="ml-auto flex items-center gap-2">
                      {alert.triggered ? (
                        <Badge variant="green">
                          <CheckCircle className="h-3 w-3 mr-1" /> Triggered!
                        </Badge>
                      ) : alert.isActive ? (
                        <Badge variant="blue">
                          <Clock className="h-3 w-3 mr-1" /> Watching
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        {alert.isActive ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Email integration note */}
        <Card className="border-dashed bg-gray-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500">
              📧 Emails are sent via <strong>Resend</strong>. To enable: add <code className="bg-gray-200 px-1 rounded">RESEND_API_KEY</code> to your environment.
              Price checks run as a cron job every hour via your deployment platform.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  return (
    <Suspense>
      <AlertsContent />
    </Suspense>
  );
}
