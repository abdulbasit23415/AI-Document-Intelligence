import os
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from apps.api.core.database import get_db
from apps.api.core.security import get_current_user, require_workspace_role
from apps.api.core.storage import storage_service, sanitize_filename
from apps.api.models.models import User, Document, DocumentChunk, AuditLog
from apps.api.schemas.schemas import DocumentResponse, DocumentDetailResponse
from apps.worker.tasks import enqueue_document_ingestion
from packages.shared.constants import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES

router = APIRouter(prefix="/workspaces/{workspace_id}/documents", tags=["Documents"])

@router.post("/upload", response_model=List[DocumentResponse])
async def upload_documents(
    workspace_id: str,
    files: List[UploadFile] = File(...),
    is_restricted: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin", "editor"])(workspace_id, current_user, db)
    uploaded_docs: List[Document] = []

    for file in files:
        # Validate extension
        suffix = Path(file.filename).suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format '{suffix}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Save to storage & compute hash
        try:
            rel_path, file_hash, file_size = storage_service.save_file(
                workspace_id=workspace_id,
                file_obj=file.file,
                original_filename=file.filename
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Storage error: {e}")

        if file_size > MAX_FILE_SIZE_BYTES:
            storage_service.delete_file(rel_path)
            raise HTTPException(status_code=400, detail=f"File exceeds maximum limit of 50MB.")

        # Workspace duplicate detection
        existing_doc = db.query(Document).filter(
            Document.workspace_id == workspace_id,
            Document.file_hash == file_hash,
            Document.is_deleted == False
        ).first()

        if existing_doc:
            # Re-queue or return existing document
            uploaded_docs.append(existing_doc)
            continue

        doc = Document(
            workspace_id=workspace_id,
            original_filename=sanitize_filename(file.filename),
            storage_path=rel_path,
            file_hash=file_hash,
            file_size_bytes=file_size,
            mime_type=file.content_type or "application/octet-stream",
            status="uploaded",
            version=1,
            is_restricted=is_restricted,
            metadata_json={"tags": [], "collections": []}
        )
        db.add(doc)
        db.flush()

        # Audit log
        db.add(AuditLog(
            workspace_id=workspace_id,
            user_id=current_user.id,
            action="document_upload",
            details={"document_id": doc.id, "filename": doc.original_filename, "size": file_size}
        ))
        db.commit()
        db.refresh(doc)

        # Enqueue processing
        doc.status = "queued"
        db.commit()
        enqueue_document_ingestion(doc.id)

        uploaded_docs.append(doc)

    return uploaded_docs

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    workspace_id: str,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    tag: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    query = db.query(Document).filter(
        Document.workspace_id == workspace_id,
        Document.is_deleted == False
    )

    if role == "viewer":
        query = query.filter(Document.is_restricted == False)

    if status_filter:
        query = query.filter(Document.status == status_filter)

    if search:
        query = query.filter(Document.original_filename.ilike(f"%{search}%"))

    docs = query.order_by(desc(Document.created_at)).all()
    return docs

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_detail(
    workspace_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.workspace_id == workspace_id,
        Document.is_deleted == False
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if role == "viewer" and doc.is_restricted:
        raise HTTPException(status_code=403, detail="Access denied to restricted document.")

    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == doc.id
    ).order_by(DocumentChunk.chunk_index).all()

    resp = DocumentDetailResponse.model_validate(doc)
    resp.chunks = chunks
    return resp

@router.get("/{document_id}/download")
def download_document(
    workspace_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.workspace_id == workspace_id,
        Document.is_deleted == False
    ).first()

    if not doc or (role == "viewer" and doc.is_restricted):
        raise HTTPException(status_code=404, detail="Document not accessible.")

    file_path = storage_service.get_file_path(doc.storage_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Underlying file not found on disk.")

    return FileResponse(
        path=str(file_path),
        filename=doc.original_filename,
        media_type=doc.mime_type
    )

@router.post("/{document_id}/retry")
def retry_document_ingestion(
    workspace_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin", "editor"])(workspace_id, current_user, db)
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.workspace_id == workspace_id,
        Document.is_deleted == False
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc.status = "queued"
    doc.status_message = None
    doc.version += 1
    db.commit()

    enqueue_document_ingestion(doc.id)
    return {"status": "retry_queued", "version": doc.version}

@router.delete("/{document_id}")
def delete_document(
    workspace_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin", "editor"])(workspace_id, current_user, db)
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.workspace_id == workspace_id,
        Document.is_deleted == False
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # 1. Immediately soft-delete to exclude from all retrieval queries
    doc.is_deleted = True
    db.commit()

    # 2. Asynchronously / immediately purge chunks & underlying storage
    try:
        storage_service.delete_file(doc.storage_path)
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
        db.delete(doc)
        db.add(AuditLog(
            workspace_id=workspace_id,
            user_id=current_user.id,
            action="document_delete",
            details={"document_id": document_id, "filename": doc.original_filename}
        ))
        db.commit()
    except Exception as e:
        logger.warning(f"Error purging document files: {e}")

    return {"status": "deleted"}
