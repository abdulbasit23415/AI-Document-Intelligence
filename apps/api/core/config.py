import os
import shutil
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocuMind - AI Document Intelligence"
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    JWT_SECRET: str = os.getenv("DOCMIND_JWT_SECRET", "super-secret-docmind-jwt-key-change-in-production-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "data" / "storage"
    MODELS_DIR: Path = BASE_DIR / "data" / "models"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DOCMIND_DATABASE_URL",
        "postgresql://docmind:docmind_pass@localhost:5432/docmind_db"
    )
    # Automatically permit SQLite fallback when local PostgreSQL is not running
    SQLITE_FALLBACK_URL: str = f"sqlite:///{(BASE_DIR / 'data' / 'docmind.db').as_posix()}"
    
    # Queue / Redis
    REDIS_URL: str = os.getenv("DOCMIND_REDIS_URL", "redis://localhost:6379/0")
    
    # Model Profile: "laptop" | "quality" | "github_models"
    MODEL_PROFILE: str = os.getenv("DOCMIND_MODEL_PROFILE", "laptop")
    
    # OCR / Tesseract
    TESSERACT_PATH: Optional[str] = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
        else (shutil.which("tesseract") or "tesseract")
    )
    
    # Optional Cloud GitHub Models Demo Adapter (Strictly Opt-In)
    ENABLE_CLOUD_MODELS: bool = os.getenv("DOCMIND_ENABLE_CLOUD_MODELS", "false").lower() == "true"
    GITHUB_TOKEN: Optional[str] = os.getenv("GITHUB_TOKEN", None)
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure data directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
