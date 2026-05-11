'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plane, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');

    // --- Supabase Auth ---
    // const { error } = await createBrowserClient().auth.signUp({
    //   email, password,
    //   options: { data: { full_name: name } }
    // });
    // if (error) { setError(error.message); setLoading(false); return; }

    await new Promise(r => setTimeout(r, 800));
    setDone(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-sky-600">
            <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center">
              <Plane className="h-5 w-5 text-white" />
            </div>
            FlightScout
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Free forever. No credit card required.</CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Account created!</h3>
                <p className="text-sm text-gray-600 mb-4">Check your email to confirm your account, then sign in.</p>
                <Link href="/login">
                  <Button className="bg-sky-600 hover:bg-sky-700 text-white">Sign in</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
                )}
                <div>
                  <Label className="mb-1.5 block">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input className="pl-9" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input type="email" className="pl-9" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input type="password" className="pl-9" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            )}
            {!done && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-sky-600 font-medium hover:text-sky-800">Sign in</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
