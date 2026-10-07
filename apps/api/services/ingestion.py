import logging
import traceback
from typing import Dict, Any, Optional
from pathlib import Path
from sqlalchemy.orm import Session

from apps.api.models.models import Document, DocumentChunk
from apps.api.services.parser import parser_service
from apps.api.services.chunker import chunker_service
from apps.api.services.embeddings import embedding_service
from apps.api.core.storage import storage_service
from apps.api.core.config import settings

logger = logging.getLogger("docmind.ingestion")

def process_document_pipeline(document_id: str, db: Session) -> bool:
    """
    Executes the durable document ingestion pipeline:
    uploaded -> parsing -> ocr -> chunking -> embedding -> ready (or failed)
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        logger.error(f"Document {document_id} not found for ingestion.")
        return False

    try:
        # Step 1: Update status to parsing
        doc.status = "parsing"
        db.commit()

        file_path = storage_service.get_file_path(doc.storage_path)
        if not file_path.exists():
            raise FileNotFoundError(f"Underlying storage file not found: {file_path}")

        # Parse document
        blocks, metadata = parser_service.parse_file(file_path, doc.mime_type)
        doc.page_count = metadata.get("page_count")
        doc.metadata_json = {**doc.metadata_json, **metadata}

        # Step 2: OCR state if OCR was performed
        if metadata.get("has_ocr"):
            doc.status = "ocr"
            db.commit()

        # Step 3: Chunking
        doc.status = "chunking"
        db.commit()

        raw_chunks = chunker_service.chunk_blocks(
            blocks=blocks,
            workspace_id=doc.workspace_id,
            document_id=doc.id,
            version=doc.version
        )

        if not raw_chunks:
            # Document had no text
            doc.status = "failed"
            doc.status_message = "Document contained no extractable text or readable pages."
            db.commit()
            return False

        # Step 4: Embedding
        doc.status = "embedding"
        db.commit()

        texts_to_embed = [c["content"] for c in raw_chunks]
        embeddings = embedding_service.embed_texts(texts_to_embed, is_query=False)

        # Clear any pre-existing chunks for this document (e.g., if retrying)
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()

        current_model_name = embedding_service.current_model_name
        current_dim = embedding_service.current_dim

        for idx, (c_data, emb) in enumerate(zip(raw_chunks, embeddings)):
            chunk_obj = DocumentChunk(
                document_id=doc.id,
                workspace_id=doc.workspace_id,
                version=doc.version,
                chunk_index=c_data["chunk_index"],
                page_number=c_data["page_number"],
                section_heading=c_data["section_heading"],
                content=c_data["content"],
                token_count=c_data["token_count"],
                bounding_boxes=c_data["bounding_boxes"],
                embedding_model=current_model_name,
                embedding_dim=current_dim,
                embedding_json=emb
            )
            db.add(chunk_obj)

        # Step 5: Mark ready
        doc.status = "ready"
        doc.status_message = None
        db.commit()
        logger.info(f"Document {doc.id} ({doc.original_filename}) successfully indexed into {len(raw_chunks)} chunks.")
        return True

    except Exception as e:
        logger.error(f"Ingestion failed for {document_id}: {e}\n{traceback.format_exc()}")
        doc.status = "failed"
        doc.status_message = f"Processing error: {str(e)[:300]}"
        db.commit()
        return False

def reindex_workspace_documents(workspace_id: str, target_model: str, db: Session) -> Dict[str, Any]:
    """
    Controlled reindexing of active documents for a new embedding model.
    """
    docs = db.query(Document).filter(
        Document.workspace_id == workspace_id,
        Document.is_deleted == False,
        Document.status == "ready"
    ).all()

    reindexed_count = 0
    for doc in docs:
        success = process_document_pipeline(doc.id, db)
        if success:
            reindexed_count += 1

    return {"total": len(docs), "reindexed": reindexed_count, "target_model": target_model}
