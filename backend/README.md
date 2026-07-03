# SeeBu Backend

Express + TypeScript API for the SeeBu platform. Uses Supabase for data storage, AWS SES (SMTP) for transactional email, and Synermaxx for SMS.

## Prerequisites

- Node.js 20+
- The `.env` file in this folder (`backend/.env`) populated with the variables below — ask a teammate for the values, they are not committed.

## Environment variables (`backend/.env`)

| Variable | Purpose |
|---|---|
| `CORS_ORIGIN` | Allowed origin for local frontend dev |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Google OAuth |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` / `FACEBOOK_CALLBACK_URL` | Facebook OAuth |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | AWS SES SMTP credentials (transactional email — see `src/utils/emailService.ts`) |
| `SMTP_FROM_EMAIL` / `SMTP_FROM_NAME` | "From" address/name used on outgoing email |
| `SMS_SYNERMAXX_API_URL` / `SMS_SYNERMAXX_APP_KEY` / `SMS_SYNERMAXX_ORIGINATOR` | Synermaxx SMS gateway (see `src/utils/smsService.ts`) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project connection (service role — server-side only) |
| `SUPABASE_STORAGE_BUCKET` | Public bucket for stored photos (default: `report-photos`) |
| `SUPABASE_STORAGE_ORIGINALS_BUCKET` | Private bucket for unblurred originals (default: `report-photos-originals`); created manually in Supabase dashboard |
| `JWT_SECRET` | Signs/verifies auth JWTs. Required — the server refuses to start without it |
| `FRONTEND_URL` | Used to build links in emails (e.g. report tracking link) |
| `EGOBLUR_SERVICE_URL` | *Optional.* EgoBlur sidecar URL for blurring faces/plates (e.g. `http://localhost:8228`). If unset, images are stored unblurred. See `egoblur-service/README.md` for setup. |

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

### With EgoBlur Image Blurring (Dev)

To blur faces and license plates in submitted photos:

**Terminal 1 — EgoBlur Service** (see `egoblur-service/README.md` for first-time setup):
```bash
cd egoblur-service
.venv\Scripts\uvicorn main:app --port 8228  # Windows
# or: source .venv/bin/activate && uvicorn main:app --port 8228  # macOS/Linux
```

**Terminal 2 — Backend API** (from repo root):
```bash
npm run backend:watch
```

Ensure `EGOBLUR_SERVICE_URL=http://localhost:8228` is set in `backend/.env` (default). When you submit a report photo, it will be blurred before storage.

**Without the service**: Backend works normally but stores images unblurred (fail-open design).

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
│       ├── emailService.ts   # Transactional email via AWS SES (SMTP/nodemailer)
│       ├── smsService.ts     # SMS via Synermaxx gateway
│       └── mediaStorage.ts   # Image/photo persistence
└── dist/                      # Compiled output (npm run build:backend)
```

## Notes

- Email and SMS sends are fire-and-forget where used for notifications (e.g. password reset, report tracking) — failures are logged but never roll back the underlying operation (registration, report creation, etc.).
- The Synermaxx request shape in `smsService.ts` is a best-effort implementation based on the gateway's URL convention; confirm exact query parameter names against Synermaxx's docs before relying on it in production.
