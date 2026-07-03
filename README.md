# SEEBU

**A Unified Complaints and Public Services Hub for Cebu City**

---

## Overview

**SEEBU** is a Progressive Web Application (PWA) designed to streamline communication between Cebu City residents and local government units (LGUs). It allows users to report community issues, request services, and track resolutions in real time — all in one centralized platform.

The system aims to improve transparency, efficiency, and citizen engagement by digitizing and simplifying public service interactions.

---

## Features

### Complaint Reporting

* Submit issues (e.g., garbage, potholes, streetlights)
* Attach images and location (GPS/manual)
* Categorized reporting system

### Real-Time Tracking

* Track complaint status (Pending, In Progress, Resolved)
* Receive updates and notifications

### LGU Integration

* Direct routing of reports to appropriate departments
* Centralized complaint management system

### Data Insights (Admin Side)

* Analytics dashboard for complaints
* Identify recurring issues and trends

### User Authentication

* Secure login and registration
* OTP/email verification
* Password recovery system

### Progressive Web App (PWA)

* Works on mobile and desktop
* Installable without app stores
* Fast and lightweight

---

## Objectives

* Improve accessibility to public services
* Reduce response time of LGU departments
* Promote transparency and accountability
* Encourage citizen participation in governance
* Provide data-driven insights for decision-making

---

## Target Users & Roles

* **Clients (Residents)** – Report and track community issues.
* **Workforce** – On-ground personnel assigned to resolve specific tasks.
* **Workforce Admins** – Manage workforce personnel and allocation.
* **Administrators** – Monitor LGU system performance and analytics.
* **Superadmins** – Platform-wide oversight and management of administrators.

---

## Tech Stack

* **Framework:** Next.js (App Router), React, TypeScript
* **Styling & UI:** Tailwind CSS, shadcn/ui
* **Backend API:** Express.js, Supabase, Next.js Server Actions
* **Authentication:** Next.js Edge Middleware (JWT, Roles), OAuth
* **AI Integration:** Firebase Genkit, RAG (Retrieval-Augmented Generation)
* **Privacy:** EgoBlur (Meta) for automatic face/plate redaction
* **Hosting/Config:** Firebase App Hosting, Render (Backend)
* **Tools:** VS Code, Git, GitHub

---

## Getting Started

### Prerequisites

- **Node.js 20+** (frontend and backend)
- **Python 3.10–3.12** (for EgoBlur service)
- **.env files** for both frontend and backend (ask a teammate or see `backend/README.md`)

### Run Locally (Development)

The app runs in three parts. Open separate terminals for each:

**Terminal 1 — EgoBlur Service** (image redaction; optional for dev, skip to test without blurring):
```bash
cd egoblur-service
python -m venv .venv
.venv\Scripts\activate  # Windows
# or: source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --port 8228
```
See `egoblur-service/README.md` for model download and full setup.

**Terminal 2 — Backend API** (from repo root):
```bash
npm install --prefix backend
npm run backend:watch
# Listens on http://localhost:5000
```
See `backend/README.md` for env vars and more commands.

**Terminal 3 — Frontend** (from repo root):
```bash
npm install
npm run dev
# Listens on http://localhost:3000
```

Visit `http://localhost:3000`, log in, and submit a report with a photo. The image will be blurred before storage (if EgoBlur is running) or stored unblurred (if not).

### Production Builds

```bash
# Build backend (TypeScript → JavaScript)
npm run build:backend

# Build frontend (Next.js)
npm run build
```

Deployed on Firebase App Hosting (frontend) and Render (backend).

---

## Project Structure

```text
SEEBU/
├── backend/            # Express backend API & Genkit AI logic
│   └── src/
│       ├── ai/         # AI integration logic (Genkit, RAG)
│       ├── controllers/# API route controllers
│       ├── middlewares/# Express middlewares (Auth, Roles)
│       ├── routes/     # API route definitions
│       └── utils/      # Utilities (email, SMS, image storage with EgoBlur integration)
├── egoblur-service/    # Python FastAPI sidecar for face/plate redaction
│   ├── main.py         # EgoBlur inference server
│   ├── requirements.txt # Python dependencies (fastapi, torch, cv2)
│   └── .venv/          # Virtual environment (gitignored)
├── public/             # Static assets (images, gifs, icons)
├── src/                # Next.js Frontend
│   ├── middleware.ts   # Next.js Edge Middleware for Role-Based Access
│   ├── app/            # Next.js App Router endpoints & layouts
│   │   ├── actions/    # Server Actions for API communication
│   │   ├── admin/      # Admin dashboard functionalities
│   │   ├── auth/       # Login, Registration, Verification & OAuth
│   │   ├── client/     # Resident reporting portal
│   │   ├── superadmin/ # Super admin dashboard & controls 
│   │   ├── workforce/  # Workforce task management
│   │   └── workforce-admin/ # Workforce management panel
│   ├── components/     # UI components (shadcn/ui), navigation docks
│   ├── hooks/          # React hooks for animations/counters
│   ├── lib/            # Utility functions & API clients
│   └── types/          # Global TypeScript typings
├── apphosting.yaml     # App Hosting configuration
├── next.config.ts      # Next.js configuration
├── tailwind.config.ts  # Theme configuration
└── README.md           # This file
```

---

## System Workflow

1. User submits a complaint/service request
2. System validates and stores the data
3. Complaint is routed to the appropriate LGU department
4. LGU updates the status of the request
5. User receives real-time updates and notifications

---

## Security & Privacy

* User data is securely stored and protected
* Authentication and verification are required
* Compliance with data privacy standards
* Controlled access for admin and LGU users
* **Automatic PII redaction:** Faces and license plates in report photos are blurred using EgoBlur before storage, so admins view anonymized images while original (unblurred) copies are archived in a private bucket for legal/evidence purposes.

---

## Testing & Validation

* Functional testing for all features
* Usability testing with real users
* Performance testing for responsiveness
* Feedback collection for improvements

---

## Expected Outputs

* Fully functional PWA system
* User and admin interfaces
* Technical documentation
* Research paper (Capstone)
* Presentation and system demo

---

## Recommendations for Future Enhancements

* Deeper AI-based issue categorization (building upon current Genkit/RAG logic)
* AI-generated uploads detection and validation
* Chatbot for instant assistance
* Direct integration with emergency response services
* Mobile push notifications
* Community feed
* Upvoting system for issue prioritization

---

## Privacy & Data Protection

This project integrates **EgoBlur** (Meta, Apache-2.0) to automatically redact faces and license plates from user-submitted images before storage, protecting PII in reports and ensuring admin dashboards respect user privacy.

**Citation:** 
```bibtex
@misc{raina2023egoblur,
  title={EgoBlur: Responsible Innovation in Aria},
  author={Raina, Nikhil and Somasundaram, Guruprasad and Zheng, Kang and Miglani, Sagar and Saarinen, Steve and Meissner, Jeff and Schwesinger, Mark and Pesqueira, Luis and Prasad, Ishita and Miller, Edward and Gupta, Prince and Yan, Mingfei and Newcombe, Richard and Ren, Carl and Parkhi, Omkar M},
  year={2023},
  eprint={2308.13093},
  archivePrefix={arXiv},
  primaryClass={cs.CV}
}
```

---

## Contributors

* **France Laurence Velarde** (Project Developer)
* **John Norman Curato** (Project Finance Manager)

---

## License

This project is developed for academic purposes. Future versions may adopt an open-source license or contribute to this repository.

EgoBlur integration is licensed under Apache 2.0 (see `egoblur-service/README.md`).

---

**SEEBU — Report. Connect. Resolve.** 🚀
