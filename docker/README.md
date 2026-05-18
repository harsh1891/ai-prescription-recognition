# Docker Notes

The root `docker-compose.yml` starts PostgreSQL, FastAPI, and Next.js.

For production, build frontend and backend separately in their target platforms:

- Vercel for `frontend`.
- Railway or Render for `backend`.
- Managed PostgreSQL for persistent data.

