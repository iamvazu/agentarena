from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

def get_database_url():
    url = os.getenv("DATABASE_URL")
    if not url:
        # Fallback for local development
        url = "postgresql://postgres:password@localhost:5432/agent_arena"
        print("DATABASE_URL not found, defaulting to localhost.")
    else:
        # Masked print for debugging
        masked_url = url.split("@")[-1] if "@" in url else url
        print(f"Connecting to database at: {masked_url}")

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

DATABASE_URL = get_database_url()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
