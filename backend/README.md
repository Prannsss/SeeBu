# SeeBu Backend

Express + TypeScript API for the SeeBu platform. Uses Supabase for data storage, and the Brevo HTTP API for transactional email.

## Prerequisites

- Node.js 20+
- The `.env` file in this folder (`backend/.env`) populated with the variables below — ask a teammate for the values, they are not committed.

## Environment variables (`backend/.env`)

| Variable | Purpose |
|---|---|
| `CORS_ORIGIN` | Allowed origin for local frontend dev |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Google OAuth |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` / `FACEBOOK_CALLBACK_URL` | Facebook OAuth |
| `BREVO_API_KEY` | Brevo API key (`xkeysib-...`) for transactional email — see `src/utils/emailService.ts`. Sent over HTTPS because Render free tier blocks SMTP ports |
| `EMAIL_FROM` / `EMAIL_FROM_NAME` | "From" address/name on outgoing email; must be a verified Brevo sender |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project connection (service role — server-side only) |
| `SUPABASE_STORAGE_BUCKET` | Public bucket for stored photos (default: `report-photos`) |
| `JWT_SECRET` | Signs/verifies auth JWTs. Required — the server refuses to start without it |
| `FRONTEND_URL` | Used to build links in emails (e.g. report tracking link) |

## Running the Server

The backend is part of the root npm workspace — run these commands from the **repository root**, not from inside `backend/`. `app.ts` loads env vars relative to `process.cwd()` (`.env.local` and `backend/.env`), so it must be started from the repo root for those paths to resolve.

```bash
# Install dependencies (run once, or after pulling changes to backend/package.json)
npm install --prefix backend

# Start the API with hot-reload (tsx watch)
npm run backend:watch

# Or start it once without watching
npm run backend

# Build to backend/dist (TypeScript -> JS)
npm run build:backend

# Run the compiled build (used in production, e.g. Render)
npm run start:backend
```

The server listens on `process.env.PORT` or `5000` by default. Health checks: `GET /health` and `GET /api/v1/health`.

## Project structure

```
backend/
├── src/
│   ├── app.ts                # Express app entrypoint, route mounting, CORS, rate limiting
│   ├── config/db.ts          # Supabase client
│   ├── controllers/          # Route handlers (auth, reports, users, tasks, analytics, ...)
│   ├── middlewares/          # Rate limiter, etc.
│   ├── routes/                # Express routers, one per resource
│   └── utils/
│       ├── emailService.ts   # Transactional email via Brevo HTTP API
│       └── mediaStorage.ts   # Image/photo persistence
└── dist/                      # Compiled output (npm run build:backend)
```

## Notes

- Email sends are fire-and-forget where used for notifications (e.g. password reset, report tracking) — failures are logged but never roll back the underlying operation (registration, report creation, etc.).

## Caching & image compression

- **`REDIS_URL`** *(optional)* — `redis://` or `rediss://` URL (e.g. Upstash). When unset or unreachable, the API falls back to an in-process memory cache automatically (per instance, max 2000 entries). See `src/utils/cache.ts`.
- Cached GET responses (per caller, `X-Cache: HIT|MISS` header): reports 30s, tasks 15s, analytics 60s, users 60s, departments 120s, locations 600s. Writes invalidate the affected prefixes; account status checks in `withAuth` are cached for 60s.
- Uploaded images are compressed with `sharp` before blurring and storage.
- Self-checks (no DB access): `npx tsx src/utils/cache.check.ts` and `npx tsx src/utils/imageCompression.check.ts` (run inside `backend/`).
- `database/migration_003_original_photo_url.sql` is optional; the backend works with or without it.
