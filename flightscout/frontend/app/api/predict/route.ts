import { NextRequest, NextResponse } from 'next/server';

const ML_API_URL = process.env.NEXT_PUBLIC_ML_API_URL ?? 'http://localhost:8000';

/**
 * POST /api/predict
 * Proxy to the FastAPI ML backend. Falls back gracefully if ML is offline.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const mlRes = await fetch(`${ML_API_URL}/predict-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!mlRes.ok) throw new Error(`ML API ${mlRes.status}`);

    const data = await mlRes.json();
    return NextResponse.json({ data, error: null });
  } catch (err) {
    // Fallback: rule-based prediction (implemented client-side in lib/ml-client.ts)
    return NextResponse.json(
      { data: null, error: 'ML backend unavailable — using client-side fallback' },
      { status: 503 }
    );
  }
}
