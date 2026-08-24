# SEEBU

**A Unified Complaints and Public Services Hub for Cebu City**

---

## Overview

**SEEBU** is a Progressive Web Application (PWA) designed to streamline communication between Cebu City residents and local government units (LGUs). It allows citizens to report community issues, request civic services, and track resolutions in real time — all within a centralized, transparent platform.

The system aims to improve transparency, efficiency, and citizen engagement by digitizing public service interactions and enabling fast, accountable task delegation across government departments.

---

## Key Features

### 1. Citizen Complaint & Issue Reporting

- **Categorized Issue Submission:** Submit civic issues (e.g., potholes, garbage disposal, broken streetlights, water leaks, traffic hazards).
- **Location & Geotagging:** GPS auto-detection, interactive map picker, and manual street/landmark entry.
- **Photo Uploads:** Multi-photo attachment with automated client-side face detection and privacy safeguards.
- **Real-Time Tracking:** Track reports from submission to completion (`Pending`, `In Review`, `Action Taken` / `Assigned`, `Resolved`, `Rejected`).
- **Anonymity & Privacy Control:** Option to submit anonymously with automated redaction of personal details.

### 2. Privacy & Data Protection Safeguards

- **Client-Side Face Detection:** Uses lightweight `face-api.js` (SSD MobileNet V1) to scan images locally before upload, prompting a Privacy Agreement modal when human faces or sensitive info are detected.
- **Camera Privacy Notice Modal:** Interactive guidelines educating users on data privacy, avoiding capturing bystanders, identification documents, and sensitive PII.
- **Sensitive Data Detection:** Automated heuristics for detecting sensitive strings (TIN, SSS numbers, contact info, credit card patterns).
- **EgoBlur Automated Redaction:** Backend integration with Meta's **EgoBlur** service to redact human faces and vehicle license plates before public or administrative storage.
- **Dual-Tier Storage Architecture:** Anonymized/redacted photos are placed in accessible storage buckets for daily operational dashboards, while unredacted copies are archived in secure, access-controlled buckets for legal and audit compliance.

### 3. Administrator Operations & Report Management

- **Centralized Triage Dashboard:** Filter by municipality, urgency level (`High`, `Medium`, `Low`), and status.
- **Approve & Delegate Workflow:** Directly assign validated reports to specific LGU departments and workforce administrators.
- **Rejection Reason Auditing:** Rejection modal with standardized reason categories (_Spam_, _Duplicate_, _Insufficient Details_, _No Image_, _Other_ with custom description).
- **Proof Verification:** Review before-and-after photo galleries and completion timestamps submitted by field workforce officers.

### 4. Workforce Administration & Delegation

- **Department Task Queue:** Manage incoming department assignments filtered by status.
- **"Accept and Delegate" Modal:** Workforce administrators can review linked citizen reports and assign field operations directly to active workforce officers in a streamlined modal.
- **Real-time Synchronization:** Instant updates across administrative boards using Supabase Realtime subscriptions.

### 5. Field Workforce Task Execution

- **Mobile-Optimized Task Hub:** On-ground officers view assigned tasks with location, priority, and linked citizen report details.
- **Task Acceptance Confirmation:** Safeguard modal (_"Are you sure you want to accept this task?"_) before changing task status to in-progress.
- **Proof of Completion Submission:** Officers capture and upload up to 5 on-site completion proof photos with status transition to `Completed`.

---

## Target Users & Roles

| Role                    | Responsibilities                                                                     |
| :---------------------- | :----------------------------------------------------------------------------------- |
| **Clients (Residents)** | Report civic issues, review status timeline, and view resolution proofs.             |
| **Workforce Officers**  | On-ground personnel accepting tasks and submitting photographic proof of resolution. |
| **Workforce Admins**    | Manage department task queues and assign tasks to active workforce officers.         |
| **Administrators**      | Triage city-wide reports, delegate to departments, approve or reject submissions.    |
| **Superadmins**         | Platform-wide governance, system metrics, and administrator management.              |

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **State & Data Fetching:** TanStack React Query v5, Supabase Realtime
- **Styling & UI:** Tailwind CSS, shadcn/ui, Lucide Icons, Goey Toast
- **Client-Side AI/ML:** `face-api.js` (TensorFlow.js SSD MobileNet V1)
- **Backend API:** Express.js, TypeScript, Next.js Server Actions
- **Database & Storage:** Supabase (PostgreSQL, Row-Level Security, Supabase Storage)
- **Image Redaction Sidecar:** FastAPI, Python, PyTorch, Meta EgoBlur
- **Hosting:** Vercel (Frontend), Render (Backend), Supabase (Database)

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- **npm** or **pnpm**
- **Python 3.10–3.12** (optional, for EgoBlur redaction service)
- **Supabase Account & Project**

### Environment Configuration

Create a `.env.local` file in the root directory for the Next.js frontend:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Create a `backend/.env` file for the Express backend API:

```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EGOBLUR_SERVICE_URL=http://localhost:8228
```

> **Security Note:** Never commit `.env*` files or service role credentials to source control. They are safeguarded in `.gitignore`.

---

### Running Locally (Development)

Open separate terminals for each service:

#### Terminal 1 — EgoBlur Redaction Service (Optional for local testing)

```bash
cd egoblur-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8228
```

#### Terminal 2 — Backend API

```bash
npm install --prefix backend
npm run backend:watch
# Server running at http://localhost:5000
```

#### Terminal 3 — Next.js Frontend

```bash
npm install
npm run dev
# Application running at http://localhost:3000
```

---

## Project Structure

```text
SEEBU/
├── backend/                  # Express.js REST API & storage controllers
│   ├── database/             # Database migrations and SQL schemas
│   └── src/
│       ├── controllers/      # Report, Task, and Department route controllers
│       ├── middlewares/      # Authentication, JWT, and role-based guards
│       ├── routes/           # REST endpoints
│       └── utils/            # Image moderation, media storage & EgoBlur client
├── egoblur-service/          # Python FastAPI sidecar for EgoBlur AI redaction
│   ├── main.py               # Face and license plate detection server
│   └── requirements.txt      # Python dependencies (torch, torchvision, opencv)
├── public/                   # Static assets, PWA icons, and face-api weights
│   └── models/face-api/      # Pretrained SSD MobileNet V1 models
├── src/                      # Next.js Frontend (App Router)
│   ├── app/
│   │   ├── actions/          # Server actions for mutations
│   │   ├── admin/            # LGU administrator dashboard & reports review
│   │   ├── auth/             # Login, register, and verification workflows
│   │   ├── client/           # Citizen reporting portal and tracking
│   │   ├── workforce/        # Field workforce officer tasks hub
│   │   └── workforce-admin/  # Workforce department admin panel
│   ├── components/           # UI components, modals, and media galleries
│   │   ├── reports/          # Privacy notice, camera, and gallery modals
│   │   └── ui/               # Reusable primitives (shadcn/ui)
│   ├── hooks/                # React Query hooks & Supabase realtime listeners
│   └── lib/                  # API client, Supabase config, and PII detectors
├── .gitignore                # Comprehensive secrets and build ignore rules
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Design tokens and styling theme
└── README.md                 # Project documentation
```

---

## Security & Privacy Compliance

- **Data Privacy Act Compliance:** Minimizes retention of unnecessary personal information and anonymizes public displays.
- **Encrypted Transmission:** All network traffic is encrypted via HTTPS/TLS.
- **Row-Level Security (RLS):** Supabase database tables enforce role-based access policies.
- **Automated Redaction:** EgoBlur AI automatically blurs identifiable faces and vehicle plates prior to public publication.
- **Confidential Storage:** Original unblurred images are isolated in secured storage buckets with strict access logging.

---

## License & Attribution

- This project is developed for academic and civic innovation purposes.
- **EgoBlur** integration is licensed under **Apache 2.0** by Meta.

**SEEBU — Report. Connect. Resolve.** 🚀
