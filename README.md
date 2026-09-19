# Student Hub — Multi-Portal College Management Platform

A full-stack college management system with five role-based portals: Student, Faculty, Parent, Admin, and AI-Admin. Built to handle real academic workflows — attendance, grades, fees, exams, HR/payroll, hostel/mess, placements, and transport — behind a single authenticated platform.

## Portals & Features

- **Student Portal** — attendance, grades, fees, assignments, hall ticket PDF generation, AI Interview & DSA Coach
- **Faculty Portal** — grading, attendance management, exam cell tools
- **Parent Portal** — live bus GPS simulation, demo payment gateway, wellness alerts, multi-child switching
- **Admin Portal** — HR/payroll (with Indian TDS slab tax calculation), hostel/mess management, placements & alumni mock interviews, transport module
- **AI-Admin** — AI-assisted administration backed by a retrieval-augmented assistant

## Authentication

- JWT-based session auth
- OAuth2 login via Google, LinkedIn, and GitHub
- Passwords hashed with bcrypt; tokens signed via HMAC

## AI Layer

- TF-IDF + cosine similarity retrieval for a lightweight RAG-based AI assistant with contextual memory
- AI routing: Gemini as primary provider, with automatic fallback
- Rule-based risk scoring and percentile ranking for academic analytics

## Algorithms Used

- TF-IDF & cosine similarity (AI retrieval)
- Feature hashing
- bcrypt password hashing
- JWT / HMAC token signing
- Rule-based risk scoring
- Percentile ranking
- Slab-based tax calculation (Indian TDS logic)
- SHA-256 hash anchoring

## Tech Stack

- **Backend:** Node.js, Express, SQLite
- **Frontend:** Single-page application (vanilla/large single-file frontend)
- **Auth:** JWT, OAuth2 (Google, LinkedIn, GitHub)
- **AI:** Gemini API (primary), with fallback routing
- **Deployment:** Render

## Setup

\`\`\`bash
git clone https://github.com/Eswereddy/student-hub.git
cd student-hub
npm install
npm start
\`\`\`

Set the following environment variables
