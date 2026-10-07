import os
import psutil
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from apps.api.core.database import get_db
from apps.api.core.security import get_current_user
from apps.api.models.models import User, Document, DocumentChunk, AuditLog, SystemSetting
from apps.api.schemas.schemas import SystemStatsResponse, ModelSettingsUpdate, ReindexRequest
from apps.api.services.ingestion import reindex_workspace_documents
from apps.api.core.config import settings

router = APIRouter(prefix="/admin", tags=["Administrator & System"])

def require_superuser(current_user: User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System Administrator privileges required."
        )
    return current_user

@router.get("/stats", response_model=SystemStatsResponse)
def get_system_stats(
    admin: User = Depends(require_superuser),
    db: Session = Depends(get_db)
):
    total_docs = db.query(Document).filter(Document.is_deleted == False).count()
    total_pages = db.query(func.sum(Document.page_count)).filter(Document.is_deleted == False).scalar() or 0
    total_chunks = db.query(DocumentChunk).count()
    total_storage = db.query(func.sum(Document.file_size_bytes)).filter(Document.is_deleted == False).scalar() or 0

    mem = psutil.virtual_memory()
    mem_info = {
        "total_mb": round(mem.total / (1024 * 1024), 1),
        "available_mb": round(mem.available / (1024 * 1024), 1),
        "percent_used": mem.percent
    }

    tess_ok = bool(settings.TESSERACT_PATH and os.path.exists(settings.TESSERACT_PATH))

    return SystemStatsResponse(
        total_documents=total_docs,
        total_pages=int(total_pages),
        total_chunks=total_chunks,
        total_storage_bytes=int(total_storage),
        model_profile=settings.MODEL_PROFILE,
        system_memory_mb=mem_info,
        active_jobs=0,
        queue_name="celery / local_threadpool",
        tesseract_available=tess_ok
    )

@router.post("/settings")
def update_settings(
    settings_in: ModelSettingsUpdate,
    admin: User = Depends(require_superuser),
    db: Session = Depends(get_db)
):
    settings.MODEL_PROFILE = settings_in.model_profile
    if settings_in.enable_cloud_models is not None:
        settings.ENABLE_CLOUD_MODELS = settings_in.enable_cloud_models
    if settings_in.github_token is not None:
        settings.GITHUB_TOKEN = settings_in.github_token

    # Store in system settings table
    profile_rec = db.query(SystemSetting).filter(SystemSetting.key == "model_profile").first()
    if not profile_rec:
        profile_rec = SystemSetting(key="model_profile", value=settings.MODEL_PROFILE)
        db.add(profile_rec)
    else:
        profile_rec.value = settings.MODEL_PROFILE

    db.add(AuditLog(
        workspace_id="system",
        user_id=admin.id,
        action="update_model_settings",
        details={"model_profile": settings.MODEL_PROFILE, "cloud_models": settings.ENABLE_CLOUD_MODELS}
    ))
    db.commit()

    return {"status": "updated", "current_profile": settings.MODEL_PROFILE}

@router.post("/reindex")
def trigger_reindex(
    req: ReindexRequest,
    workspace_id: str,
    admin: User = Depends(require_superuser),
    db: Session = Depends(get_db)
):
    res = reindex_workspace_documents(workspace_id, req.target_embedding_model, db)
    db.add(AuditLog(
        workspace_id=workspace_id,
        user_id=admin.id,
        action="reindex_embeddings",
        details=res
    ))
    db.commit()
    return res

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    admin: User = Depends(require_superuser),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs
