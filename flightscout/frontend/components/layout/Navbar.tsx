'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane, Bell, Bookmark, BarChart2, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/search', label: 'Search', icon: Plane },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/analyze', label: 'Analyze', icon: BarChart2 },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-sky-600">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
            <Plane className="h-4 w-4 text-white" />
          </div>
          FlightScout
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">
              Get started
            </Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium',
                pathname.startsWith(href)
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <div className="pt-2 flex gap-2">
            <Link href="/login" className="flex-1">
              <Button variant="outline" className="w-full" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white" size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
