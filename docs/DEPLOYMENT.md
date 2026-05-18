# Deployment

## Frontend on Vercel

1. Import the GitHub repository in Vercel.
2. Set root directory to `frontend`.
3. Add environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-backend.example.com
```

4. Deploy.

## Backend on Railway or Render

1. Create a PostgreSQL database.
2. Deploy from the `backend` directory.
3. Set:

```env
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=change-me
VISION_PROVIDER=gemini
GEMINI_API_KEY=...
```

4. Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Production Notes

- Enable HTTPS-only cookies when adding browser session storage.
- Store uploads in object storage instead of local disk.
- Replace local drug interaction CSV with a licensed clinical data source.
- Add human-in-the-loop review before any medical use.

