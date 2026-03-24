Health Twin — Future Self Simulation

Keywords: digital health · preventive care · health literacy · lifestyle risk · AI health twin · parallel futures · hackathon · Imperial College London

Explore how daily choices shape long-term health. Prototype only; not medical advice.

Event: Claude Hackathon, Imperial College London
 · Track: Biology & Physical Health

Purpose
Audience: People seeking insight into lifestyle patterns.
Function:
Frontend: Sliders for sleep, stress, activity, live metrics, insight panels.
Backend: REST API with PostgreSQL; simulations via Amazon Bedrock.
Ethics: Prototype only; clinicians handle decisions; privacy respected; limits noted.
Repo Structure
Path	Role
/	Express API, Sequelize, Bedrock integration
claude-health-frontend/	Next.js 16 dashboard
Quick Start

Environment

cp .env.example .env

Fill values: DATABASE_URL, PORT (default 3001), AWS_* + BEDROCK_MODEL_ID, FRONTEND_ORIGIN.

Database & Run

npm install
npm run dev
API Overview
GET /health — liveness
POST /api/simulation — text → timelines
GET /api/simulation/history · GET /api/simulation/:id
POST /api/health/simulate — lifestyle → metrics + insight
GET /api/health/history · GET /api/health/:id

Optional smoke tests: npm run test:api

Submission Checklist
One-sentence pitch (top paragraph + keywords).
2–3 min demo: input → processing → dashboard (mention API & Bedrock).
Rubric hooks: impact, technical stack, ethics, presentation.
Repo link: public GitHub or zip with README + .env.example.
Safeguards
Not medical advice; for demo only.
Models can be inaccurate; meant for design critique.
Do not submit real PHI; use synthetic profiles.
