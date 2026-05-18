# Handwritten Medical Prescription Recognition System

AI-powered prescription extraction app with a Next.js dashboard, FastAPI backend, PostgreSQL persistence, and pluggable Vision/NLP services.

> This project is a clinical documentation assistant, not a medical decision system. Always verify extracted prescriptions with a qualified professional before use.

## Features

- User sign up and sign in with JWT authentication.
- User-scoped prescription uploads, history, analytics, and exports.
- Upload handwritten prescription images or PDFs.
- Preview files before processing.
- Extract structured medicines, dosage, frequency, duration, doctor, date, and notes.
- Provider-based Vision extraction using Gemini, OpenAI, or local mock mode.
- NLP normalization with fuzzy medicine matching.
- Confidence scores per entity.
- Drug interaction warnings using an extendable local dataset.
- Auth-ready JWT APIs.
- PostgreSQL schema with prescription history.
- JSON and PDF export endpoints.
- Modern responsive dashboard built with Next.js, Tailwind CSS, TypeScript, and shadcn-style components.
- Docker Compose for local full-stack development.

## Project Structure

```text
frontend/   Next.js 15 app
backend/    FastAPI app and AI pipeline
datasets/   Medicine and interaction seed datasets
docker/     Docker notes and deployment helpers
docs/       API and deployment documentation
models/     Placeholder for local ML artifacts
samples/    Fictional sample prescription assets
```

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

The default local `.env.example` uses SQLite so you can run the backend without installing PostgreSQL. Docker Compose and production deployment still use PostgreSQL.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Create an account in the dashboard before uploading. Authenticated uploads are saved with that user, and the history panel shows that user’s records.

## Docker

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

## AI Providers

Set `VISION_PROVIDER=mock` for local development. Use `gemini` or `openai` when API keys are available.

```env
VISION_PROVIDER=mock
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=
```

The mock provider returns deterministic data for demos and tests. For real image extraction, set `VISION_PROVIDER=gemini`, add your Gemini key, and keep `GEMINI_MODEL=gemini-2.5-flash`. The real providers are implemented behind one interface in `backend/app/ai/vision.py`.

## GitHub

This workspace is ready to connect to:

```bash
git remote add origin https://github.com/harsh1891/ai-prescription-recognition.git
git add .
git commit -m "Build AI prescription recognition system"
git push -u origin master
```
