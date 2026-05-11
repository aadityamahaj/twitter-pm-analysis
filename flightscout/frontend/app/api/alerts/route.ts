import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/alerts
 *
 * Creates a price alert and queues email notification via Resend.
 * In production: store in Supabase, trigger cron job.
 *
 * Required env vars:
 *   RESEND_API_KEY
 *   EMAIL_FROM (e.g. alerts@flightscout.app)
 *   SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(req: NextRequest) {
  try {
    const { origin, destination, targetPrice, cabinClass, email, departureDate } = await req.json();

    if (!origin || !destination || !targetPrice || !email) {
      return NextResponse.json({ error: 'origin, destination, targetPrice, email are required' }, { status: 400 });
    }

    // --- Supabase insert (add when Supabase is configured) ---
    // const supabase = createAdminClient();
    // const { data, error } = await supabase.from('price_alerts').insert({
    //   origin, destination, targetPrice, cabinClass, email, departureDate,
    //   isActive: true, triggered: false,
    // }).select().single();
    // if (error) throw error;

    // --- Send confirmation email via Resend ---
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? 'alerts@flightscout.app',
          to: [email],
          subject: `FlightScout Alert Set: ${origin} → ${destination}`,
          html: `
            <p>Hi!</p>
            <p>Your price alert for <strong>${origin} → ${destination}</strong> (${cabinClass}) has been set.</p>
            <p>We'll notify you when prices drop below <strong>$${targetPrice}</strong>.</p>
            <p>— FlightScout Team</p>
          `,
        }),
      });
    }

    return NextResponse.json({
      data: {
        id: `alert_${Date.now()}`,
        origin, destination, targetPrice, cabinClass, email,
        isActive: true, createdAt: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    console.error('[API /alerts]', err);
    return NextResponse.json({ data: null, error: (err as Error).message }, { status: 500 });
  }
}

/**
 * This cron job should run every hour to check prices and trigger alerts.
 * Add to your deployment platform (Vercel Cron, Railway, etc.):
 *
 *   vercel.json:
 *   { "crons": [{ "path": "/api/cron/check-alerts", "schedule": "0 * * * *" }] }
 */
