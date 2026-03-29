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
* **Backend API:** Next.js Server Actions
* **AI Integration:** Firebase Genkit, RAG (Retrieval-Augmented Generation)
* **Hosting/Config:** Firebase App Hosting
* **Tools:** VS Code, Git, GitHub

---

## Project Structure

```
SEEBU/
├── backend/            # Additional backend services & documents
├── public/             # Static assets (images, gifs)
├── src/
│   ├── ai/             # AI integration logic (Genkit, RAG)
│   ├── app/            # Next.js App Router endpoints & layouts
│   │   ├── admin/      # Admin dashboard functionalities
│   │   ├── superadmin/ # Super admin dashboard & controls 
│   │   ├── workforce/  # Workforce task management
│   │   ├── workforce-admin/ # Workforce management panel
│   │   └── client/     # Resident reporting portal
│   ├── components/     # UI components (shadcn/ui), navigation docks
│   ├── hooks/          # React hooks for animations/counters
│   ├── lib/            # Utility functions
│   └── types/          # Global TypeScript typings
├── apphosting.yaml     # App Hosting configuration
├── next.config.ts      # Next.js configuration
└── tailwind.config.ts  # Theme configuration
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

## Contributors

* **France Laurence Velarde** (Project Developer)
* **John Norman Curato** (Project Finance Manager)

---

## License

This project is developed for academic purposes. Future versions may adopt an open-source license or contribute to this repository.

---

**SEEBU — Report. Connect. Resolve.** 🚀
