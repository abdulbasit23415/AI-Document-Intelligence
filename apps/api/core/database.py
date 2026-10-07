import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from apps.api.core.config import settings

logger = logging.getLogger("docmind.db")

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    try:
        # Test connecting to Postgres
        if "postgresql" in db_url:
            eng = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                connect_args={"connect_timeout": 3}
            )
            with eng.connect() as conn:
                pass
            logger.info("Connected successfully to PostgreSQL database.")
            return eng
    except Exception as e:
        logger.warning(
            f"Could not connect to PostgreSQL ({e}). "
            f"Falling back to local SQLite engine ({settings.SQLITE_FALLBACK_URL})."
        )
    
    # Fallback to SQLite
    return create_engine(
        settings.SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False}
    )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
