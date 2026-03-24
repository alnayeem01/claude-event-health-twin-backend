Health Twin — Backend (Future Self API)

Keywords: digital health · preventive care · health literacy · lifestyle risk · AI health twin · parallel futures · hackathon · Imperial College London

Explore how daily choices shape long-term health. Prototype only; not medical advice.

Event: Claude Hackathon, Imperial College London · Track: Biology & Physical Health

Purpose
Audience: People seeking structured insight into lifestyle patterns.
Function:
API: REST endpoints with PostgreSQL for storing lifestyle runs.
Simulation: Decision simulations powered by Amazon Bedrock.
Ethics: Prototype only; clinicians handle decisions; privacy respected; limits noted.
Repo Structure
Path	Role
/	Express API, Sequelize models, Bedrock integration
claude-health-frontend/	Frontend dashboard (Next.js 16)
Quick Start

Environment

cp .env.example .env

Fill values: DATABASE_URL, PORT (default 3001), AWS_* + BEDROCK_MODEL_ID, FRONTEND_ORIGIN.

Install & Run

npm install
npm start

(Runs Express API on configured PORT)

API Overview
Endpoint	Description
GET /health	Liveness check
POST /api/simulation	Text input → generate parallel timelines
GET /api/simulation/history	List all simulation runs
GET /api/simulation/:id	Get simulation by ID
POST /api/health/simulate	Submit lifestyle → returns metrics + insight
GET /api/health/history	List all health simulations
GET /api/health/:id	Get health simulation by ID

Optional: npm run test:api for smoke tests (Bedrock tests need AWS credentials).

Submission Checklist
One-sentence pitch (top paragraph + keywords).
2–3 min demo: input → processing → dashboard (mention API & Bedrock).
Rubric hooks: impact, technical stack, ethics, presentation.
Repo link: public GitHub or zip with README + .env.example.
Safeguards
Not medical advice; for demo only.
Models can be inaccurate; intended for design critique.
Do not submit real PHI; use synthetic profiles.
