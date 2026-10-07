import logging
import socket
from concurrent.futures import ThreadPoolExecutor
from apps.worker.celery_app import celery_app
from apps.api.core.database import SessionLocal
from apps.api.services.ingestion import process_document_pipeline, reindex_workspace_documents

logger = logging.getLogger("docmind.worker")

# In-process executor for local execution without redis
_local_executor = ThreadPoolExecutor(max_workers=3)

def _is_redis_active() -> bool:
    try:
        s = socket.create_connection(("127.0.0.1", 6379), timeout=0.15)
        s.close()
        return True
    except Exception:
        return False

@celery_app.task(bind=True, max_retries=2, default_retry_delay=10)
def celery_ingest_document(self, document_id: str):
    logger.info(f"[Celery] Ingesting document: {document_id}")
    db = SessionLocal()
    try:
        success = process_document_pipeline(document_id, db)
        if not success:
            raise RuntimeError(f"Processing failed for document {document_id}")
        return {"status": "success", "document_id": document_id}
    except Exception as exc:
        logger.error(f"[Celery] Retrying document {document_id} due to: {exc}")
        raise self.retry(exc=exc)
    finally:
        db.close()

def _run_local_ingest(document_id: str):
    db = SessionLocal()
    try:
        process_document_pipeline(document_id, db)
    finally:
        db.close()

def enqueue_document_ingestion(document_id: str):
    """
    Dispatches ingestion to Celery if available, or in-process executor if running locally.
    """
    if _is_redis_active():
        try:
            celery_ingest_document.delay(document_id)
            logger.info(f"Dispatched document {document_id} to Celery queue.")
            return
        except Exception as e:
            logger.info(f"Celery dispatch failed ({e}). Falling back to local thread.")

    # Local fallback
    logger.info(f"Running ingestion for document {document_id} via local background thread.")
    _local_executor.submit(_run_local_ingest, document_id)
