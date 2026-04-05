from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "mockvue")

# Strategy: Prefer single DATABASE_URL (Standard for Render), fallback to components.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "mockvue")
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Add SSL for Cloud DBs (TiDB Cloud requires it)
connect_args = {}
if "tidb" in DATABASE_URL.lower() or os.getenv("DB_SSL") == "true":
    connect_args = {"ssl": {"ca": "/etc/ssl/cert.pem"}} # Standard path on Render

engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True, 
    echo=False,
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
