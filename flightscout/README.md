# FlightScout ✈️

A production-quality flight search and price prediction platform built to eventually compete with Expedia, Hopper, and Google Flights.

## Features

- **Smart Flight Search** — multi-stop, flexible dates, cabin class, baggage prefs
- **Priority-Weighted Ranking** — FlightScout Score based on your priorities (price, time, stops, airline, etc.)
- **ML Price Prediction** — XGBoost model predicts whether prices will rise, fall, or stabilize
- **Historical Price Analysis** — charts showing route trends, cheapest days, seasonality
- **Book Now / Wait / Track** — AI-powered booking recommendation with confidence score
- **Flexible Date Calendar** — cheapest departure dates visualized
- **Price Drop Alerts** — email notifications via Resend
- **Saved Routes & Watchlist** — track your routes over time
- **User Dashboard** — personalized alerts, savings, predictions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Auth & DB | Supabase (PostgreSQL) |
| Charts | Recharts |
| Email | Resend |
| ML Backend | Python FastAPI |
| ML Model | XGBoost / scikit-learn |
| Data | Pandas, NumPy |
| Deployment | Vercel (frontend) + Railway/Fly.io (ML backend) |

## Project Structure

```
flightscout/
├── frontend/          # Next.js app
│   ├── app/           # App Router pages
│   ├── components/    # UI components
│   ├── lib/           # Utilities, API client, mock data
│   └── types/         # TypeScript types
├── ml-backend/        # FastAPI ML microservice
│   ├── models/        # ML model classes
│   ├── data/          # Mock & seed data
│   └── utils/         # Feature engineering
└── supabase/          # Database schema & seeds
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account (or local Supabase)
- Resend account (for email alerts)

### 1. Clone & Setup

```bash
git clone https://github.com/your-org/flightscout
cd flightscout
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in your Supabase + API keys in .env.local
npm run dev
```

### 3. ML Backend Setup

```bash
cd ml-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Train the initial model on mock data
python -m data.seed_data
python train_model.py

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

### 4. Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the schema SQL in the Supabase SQL editor:
   ```bash
   cat supabase/schema.sql | pbcopy  # then paste in Supabase editor
   ```
3. Run seed data:
   ```bash
   cat supabase/seed.sql | pbcopy
   ```

### 5. Environment Variables

See `.env.example` at the root. Copy to `frontend/.env.local` and `ml-backend/.env`.

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ML Backend
NEXT_PUBLIC_ML_API_URL=http://localhost:8000

# Email
RESEND_API_KEY=your_resend_api_key

# Flight APIs (add when ready to use real data)
# AMADEUS_CLIENT_ID=
# AMADEUS_CLIENT_SECRET=
# DUFFEL_API_KEY=
# KIWI_API_KEY=
# SERPAPI_KEY=
```

## Adding Real Flight APIs

The app uses an API abstraction layer. To add a real flight provider:

1. Open `frontend/lib/flight-api-adapter.ts`
2. Implement the `FlightApiAdapter` interface
3. Set `FLIGHT_API_PROVIDER=amadeus` (or `duffel`, `kiwi`, `serpapi`) in `.env.local`

Supported providers (when keys are added):
- **Amadeus** — `AMADEUS_CLIENT_ID` + `AMADEUS_CLIENT_SECRET`
- **Duffel** — `DUFFEL_API_KEY`
- **Kiwi/Tequila** — `KIWI_API_KEY`
- **SerpAPI Google Flights** — `SERPAPI_KEY`
- **AviationStack** — `AVIATIONSTACK_KEY`

## ML Model

The prediction model uses XGBoost with these features:
- Route (origin → destination)
- Days until departure
- Day of week & month
- Season
- Holiday proximity
- Number of stops
- Airline
- Cabin class
- Historical average price
- Recent price trend
- Current price vs. average
- Demand level estimate

To retrain with new data:
```bash
cd ml-backend
python train_model.py --data-path data/your_dataset.csv
```

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npx vercel --prod
```

### ML Backend (Railway)
```bash
cd ml-backend
railway login
railway deploy
```

## License

MIT
