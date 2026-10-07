import os
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import text

from apps.api.core.database import get_db
from apps.api.core.config import settings

router = APIRouter(tags=["Health & Readiness"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "model_profile": settings.MODEL_PROFILE
    }

@router.get("/ready")
def readiness_check(response: Response, db: Session = Depends(get_db)):
    checks = {
        "database": False,
        "storage": False,
        "tesseract_ocr": False,
    }

    # DB test
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception as e:
        checks["database_error"] = str(e)

    # Storage test
    try:
        if settings.STORAGE_DIR.exists() and os.access(settings.STORAGE_DIR, os.W_OK):
            checks["storage"] = True
    except Exception as e:
        checks["storage_error"] = str(e)

    # Tesseract
    if settings.TESSERACT_PATH and os.path.exists(settings.TESSERACT_PATH):
        checks["tesseract_ocr"] = True

    is_ready = checks["database"] and checks["storage"]
    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "ready": is_ready,
        "checks": checks,
        "model_profile": settings.MODEL_PROFILE
    }
