import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# CHANGE: Pull from Environment Variable
SQLALCHEMY_DATABASE_URL = os.getenv("postgresql://neondb_owner:npg_U2gfL6TmapPY@ep-late-cherry-aqe14v2c.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require")

# CHANGE: Add sslmode=require for Neon cloud database
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"sslmode": "require"})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
from app.config import get_settings
print(f"DEBUG: Loading settings: {get_settings().database_url}")
engine = create_engine(...)