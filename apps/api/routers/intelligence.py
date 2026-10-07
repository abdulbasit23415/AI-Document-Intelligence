from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from apps.api.core.database import get_db
from apps.api.core.security import get_current_user, require_workspace_role
from apps.api.models.models import User, Document, DocumentIntelligenceRecord
from apps.api.services.intelligence import intelligence_service
from packages.shared.contracts import (
    ContractExtraction, InvoiceExtraction, DocumentSummary, DocumentComparison
)

router = APIRouter(prefix="/workspaces/{workspace_id}/intelligence", tags=["Document Intelligence"])

@router.post("/contract/{document_id}", response_model=ContractExtraction)
def extract_contract_terms(
    workspace_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.workspace_id == workspace_id,
        Document.is_deleted == False
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    res = intelligence_service.extract_contract(db, document_id)
    
    # Save record
    rec = DocumentIntelligenceRecord(
        workspace_id=workspace_id,
        document_id=document_id,
        record_type="contract_extraction",
        structured_data=res.model_dump(exclude={"citations"}),
        citations=[c.model_dump() for c in res.citations]
    )
    db.add(rec)
    db.commit()

    return res

@router.post("/invoice/{document_id}", response_model=InvoiceExtraction)
def extract_invoice_data(
    workspace_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.workspace_id == workspace_id,
        Document.is_deleted == False
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    res = intelligence_service.extract_invoice(db, document_id)
    rec = DocumentIntelligenceRecord(
        workspace_id=workspace_id,
        document_id=document_id,
        record_type="invoice_extraction",
        structured_data=res.model_dump(exclude={"citations"}),
        citations=[c.model_dump() for c in res.citations]
    )
    db.add(rec)
    db.commit()

    return res

@router.post("/summary/{document_id}", response_model=DocumentSummary)
def summarize_document(
    workspace_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.workspace_id == workspace_id,
        Document.is_deleted == False
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    res = intelligence_service.summarize_document(db, document_id)
    return res

@router.post("/compare", response_model=DocumentComparison)
def compare_documents(
    workspace_id: str,
    document_a_id: str = Query(...),
    document_b_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    res = intelligence_service.compare_documents(db, document_a_id, document_b_id)
    return res

@router.get("/export/{record_id}")
def export_intelligence_record(
    workspace_id: str,
    record_id: str,
    format: str = Query("json", pattern="^(json|csv)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_workspace_role(["admin", "editor", "viewer"])(workspace_id, current_user, db)
    rec = db.query(DocumentIntelligenceRecord).filter(
        DocumentIntelligenceRecord.id == record_id,
        DocumentIntelligenceRecord.workspace_id == workspace_id
    ).first()

    if not rec:
        raise HTTPException(status_code=404, detail="Intelligence record not found.")

    if format == "csv":
        csv_data = intelligence_service.export_extraction_csv(rec.structured_data)
        return Response(content=csv_data, media_type="text/csv", headers={
            "Content-Disposition": f"attachment; filename=extraction_{record_id[:8]}.csv"
        })
    else:
        return rec.structured_data
