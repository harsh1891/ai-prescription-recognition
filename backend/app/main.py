from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database.session import engine
from app.models import Base
# These imports must match your actual folder structure
from app.routes import auth, prescriptions 

# Lifespan ensures the DB tables are created when the app starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # This creates your tables based on your SQLAlchemy models
        await conn.run_sync(Base.metadata.create_all)
    yield

# Load settings
settings = get_settings()

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="OCR, VLM, NLP, and medical entity extraction APIs.",
    lifespan=lifespan,
)

# Configure CORS so your Vercel frontend can talk to Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend-eta-one-97.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your routers (these connect your auth.py and prescriptions.py logic)
app.include_router(auth.router)
app.include_router(prescriptions.router)

# Basic health check endpoint
@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok", "provider": settings.vision_provider}