# AI Prescription Recognition

AI Prescription Recognition is a full-stack web app that helps convert prescription uploads into structured, searchable medical information. Users can sign up, upload prescription images or PDFs, review extracted medicines and dosage details, view history and analytics, and export results as JSON or PDF.

> This project is a clinical documentation assistant for demo and learning purposes. It is not a medical diagnosis or prescription decision system. Extracted results should always be verified by a qualified professional.

## Live Demo

- Frontend app: https://frontend-eta-one-97.vercel.app
- Backend API: https://ai-prescription-recognition.onrender.com
- API health check: https://ai-prescription-recognition.onrender.com/health

Use the frontend link for resumes, interviews, and project demos. The backend link powers the frontend API requests behind the scenes.

## Highlights

- Secure user registration and login with JWT authentication.
- Prescription upload flow for images and PDFs.
- AI-powered OCR and structured extraction for medicines, dosage, frequency, duration, doctor name, date, and notes.
- Gemini, OpenAI, and mock provider support through a pluggable vision layer.
- Fuzzy medicine name normalization using a local medicine dataset.
- Drug interaction warnings from an extendable CSV dataset.
- User-specific prescription history, search, analytics, and export.
- JSON and PDF export endpoints.
- Responsive dashboard built with Next.js, TypeScript, Tailwind CSS, and reusable UI components.
- FastAPI backend with SQLAlchemy async database access.
- Production deployment with Vercel frontend and Render backend.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python, Uvicorn |
| Database | PostgreSQL in production, SQLite for local development |
| ORM | SQLAlchemy async |
| Authentication | JWT, Passlib, Python JOSE |
| AI/OCR | Gemini, OpenAI, mock provider |
| Matching | RapidFuzz |
| Export | ReportLab PDF generation |
| Deployment | Vercel, Render |

## Architecture

```text
User Browser
    |
    v
Vercel Frontend
    |
    | NEXT_PUBLIC_API_URL
    v
Render FastAPI Backend
    |
    +-- Auth and prescription APIs
    +-- Vision provider integration
    +-- Medicine matching and interaction checks
    v
Database and CSV datasets
```

The project is split into two deployed services:

- The Vercel frontend is the public website users interact with.
- The Render backend exposes the API used for authentication, uploads, extraction, history, analytics, and exports.

## Project Structure

```text
frontend/   Next.js dashboard application
backend/    FastAPI app, API routes, AI pipeline, database models
datasets/   Medicine and drug interaction CSV datasets
docs/       API and deployment documentation
docker/     Docker notes and deployment helpers
models/     Placeholder for local ML artifacts
samples/    Sample prescription asset
```

## Main API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Backend health check |
| POST | `/api/auth/register` | Create a user account |
| POST | `/api/auth/login` | Login and receive JWT token |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/prescriptions/process` | Upload and process prescription |
| GET | `/api/prescriptions` | List prescription history |
| GET | `/api/prescriptions/analytics/summary` | Get dashboard analytics |
| GET | `/api/prescriptions/{id}/export/json` | Export result as JSON |
| GET | `/api/prescriptions/{id}/export/pdf` | Export result as PDF |

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

The backend will run at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Set the frontend API URL in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The frontend will run at `http://localhost:3000`.

## Docker

```bash
docker compose up --build
```

Local Docker services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

## Environment Variables

### Backend

```env

SECRET_KEY=replace-with-a-secure-random-secret
VISION_PROVIDER=mock
GEMINI_API_KEY=
OPENAI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

Use `VISION_PROVIDER=mock` for local demos without an API key. Use `gemini` or `openai` when real AI extraction is configured.

### Frontend

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

## Deployment

### Frontend on Vercel

1. Import this repository into Vercel.
2. Set the root directory to `frontend`.
3. Add `NEXT_PUBLIC_API_URL` with the Render backend URL.
4. Deploy.

### Backend on Render

1. Create a Render web service from this repository.
2. Set the root directory to `backend`.
3. Use this build command:

```bash
pip install -r requirements.txt
```

4. Use this start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

5. Add backend environment variables such as `DATABASE_URL`, `SECRET_KEY`, `VISION_PROVIDER`, and provider API keys.

## Resume Description

AI Prescription Recognition is a full-stack AI web app built with Next.js, FastAPI, PostgreSQL, and Gemini/OpenAI vision providers. It supports authenticated prescription uploads, structured OCR extraction, medicine normalization, interaction warnings, analytics, and JSON/PDF exports, deployed with Vercel and Render.

## Future Improvements

- Add object storage for uploaded prescription files.
- Add stronger validation and human review workflows.
- Add automated backend and frontend test coverage.
- Add production monitoring and error tracking.
- Replace sample CSV datasets with licensed clinical data sources.

## License

This project is currently for educational and portfolio use.
