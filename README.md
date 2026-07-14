## Budget Recipe Generator

Full-stack React (Next.js) + Tailwind app that generates 3 budget meals under **$3 per serving** based on grocery sale data.

### Core Features

- Budget recipe generation from local grocery sales + pantry ingredients
- Pantry Scanner (image upload -> ingredient hints -> recipe generation)
- Cost-per-Meal calculator
- Self-hosted auth (email/password, scrypt-hashed, cookie sessions)
- Per-user saved meal history
- Mobile-first, high-contrast UI
- Local JSON-file database (no external DB subscription required)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and set keys:

```bash
cp .env.example .env.local
```

Required integrations:

- `GEMINI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

Optional database connection (fallback to local files):

- `DATABASE_URL` (Provide a PostgreSQL connection string, e.g. from Neon, to run in persistent SQL database mode. If omitted, the app will automatically fall back to saving/reading from local JSON files under `data/` as documented below.)

Optional (currently stubbed, not called by the live recipe flow):

- `SPOONACULAR_API_KEY`
- `EDAMAM_APP_ID`
- `EDAMAM_APP_KEY`

Optional local sales API:

- `GROCERY_SALES_API_URL`
- `GROCERY_SALES_API_KEY`

3. The app stores users, sessions, and meal history as JSON files under `data/` by default (when `DATABASE_URL` is not set). These are created automatically on first run, requiring no external database setup.

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Routes

- `GET /api/sales?zip=94103` local grocery sale items
- `POST /api/pantry-scan` image upload for pantry ingredient hints
- `POST /api/budget-recipes` generate top 3 meals under $3/serving
- `POST /api/cost-calculator` compute total and per-serving costs
- `GET /api/history` fetch signed-in user's saved meals

## App Pages

- `/` dashboard and quick links
- `/account` sign in/up, password reset, and confirmation actions
- `/pantry` pantry image scanner
- `/budget` budget recipe generation flow
- `/calculator` cost-per-meal calculator
- `/history` saved meal history
