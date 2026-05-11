'use client';
import { useState } from 'react';
import { Settings, Bell, Globe, Plane, Sliders, Save, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { CabinClass, UserPriorities } from '@/types';
import { getDefaultPriorities } from '@/lib/scoring';
import { AIRPORTS } from '@/lib/airports';

const PRIORITY_LABELS: Record<keyof UserPriorities, string> = {
  price: 'Lowest Price',
  duration: 'Shortest Flight',
  stops: 'Fewest Stops',
  departureTime: 'Departure Time',
  arrivalTime: 'Arrival Time',
  airline: 'Best Airline',
  baggage: 'Baggage Included',
};

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [homeAirport, setHomeAirport] = useState('JFK');
  const [preferredCabin, setPreferredCabin] = useState<CabinClass>('economy');
  const [currency, setCurrency] = useState('USD');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [alertEmail, setAlertEmail] = useState('');
  const [priorities, setPriorities] = useState<UserPriorities>(getDefaultPriorities());

  function handleSave() {
    // In production: save to Supabase user_preferences table
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="gradient-hero text-white py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center gap-2 text-sky-200 text-sm mb-2">
            <Settings className="h-4 w-4" /> Settings
          </div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-sky-200 mt-1">Personalize FlightScout to match your travel style</p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 mt-6 space-y-5">

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-sky-500" /> Travel Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Home Airport</Label>
                <Select value={homeAirport} onValueChange={setHomeAirport}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AIRPORTS.filter(a => a.country === 'US').slice(0, 20).map(a => (
                      <SelectItem key={a.iata} value={a.iata}>
                        {a.iata} — {a.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Preferred Cabin</Label>
                <Select value={preferredCabin} onValueChange={v => setPreferredCabin(v as CabinClass)}>
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
              <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Display Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Default priorities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="h-4 w-4 text-sky-500" /> Default Priorities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-4">
              These weights are used when you don&apos;t customize priorities during search.
            </p>
            <div className="space-y-4">
              {(Object.keys(priorities) as (keyof UserPriorities)[]).map(key => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-sm text-gray-700">{PRIORITY_LABELS[key]}</Label>
                    <span className="text-xs font-medium text-sky-600 tabular-nums w-6">{priorities[key]}</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[priorities[key]]}
                    onValueChange={([v]) => setPriorities(p => ({ ...p, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-sky-500" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                checked={emailAlerts}
                onChange={e => setEmailAlerts(e.target.checked)}
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Email price alerts</div>
                <div className="text-xs text-gray-500">Receive an email when prices drop below your target</div>
              </div>
            </label>
            {emailAlerts && (
              <div>
                <Label className="mb-1.5 block text-xs text-gray-500 uppercase tracking-wide">Notification email</Label>
                <Input
                  type="email"
                  value={alertEmail}
                  onChange={e => setAlertEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          {saved ? (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="h-4 w-4" /> Settings saved!
            </div>
          ) : (
            <Button onClick={handleSave} className="bg-sky-600 hover:bg-sky-700 text-white">
              <Save className="h-4 w-4 mr-2" /> Save settings
            </Button>
          )}
        </div>

        {/* Supabase note */}
        <Card className="border-dashed bg-gray-50">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-gray-500">
              ℹ️ Settings are stored in the <code className="bg-gray-200 px-1 rounded">user_preferences</code> Supabase table.
              Auth is handled by Supabase Auth (JWT). See <code>supabase/schema.sql</code> for the schema.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
