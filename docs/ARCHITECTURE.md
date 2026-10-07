# DocuMind Architecture & System Design

## 1. High-Level System Architecture

DocuMind is an enterprise-grade, local-first AI Document Intelligence Platform built to eliminate third-party API dependencies and protect sensitive documents (contracts, financial reports, policies, invoices).

```
                      +---------------------------------------+
                      |         Next.js 16 Web Client         |
                      |   (App Router, Tailwind, TypeScript)  |
                      +-------------------+-------------------+
                                          | HTTP / SSE
                                          v
                      +---------------------------------------+
                      |          FastAPI Application          |
                      |   (Auth, RBAC, Validation, Dispatch)  |
                      +---------+-------------------+---------+
                                |                   |
             +------------------+                   +------------------+
             |                                                         |
             v                                                         v
+--------------------------+                               +--------------------------+
|  Ingestion & OCR Worker  |                               |   Hybrid RAG Pipeline    |
| - PyMuPDF / Docling      |                               | - Vector Cosine Rank     |
| - Tesseract OCR (Local)  |                               | - Keyword BM25 / TSV     |
| - Token-Aware Chunker    |                               | - Reciprocal Rank Fusion |
| - BGE Embeddings (Torch) |                               | - Grounded LLM Stream    |
+------------+-------------+                               +-------------+------------+
             |                                                           |
             +-----------------------+   +-------------------------------+
                                     |   |
                                     v   v
                      +---------------------------------------+
                      |       Storage & Persistence Layer     |
                      | - PostgreSQL + pgvector (or SQLite)   |
                      | - Private Filesystem (SHA-256 scopes) |
                      | - Redis Queue (or in-process threads) |
                      +---------------------------------------+
```

---

## 2. Monorepo Organization

- **`apps/web` / root**: Next.js 16 App Router interface featuring a 3-panel chat workspace, interactive document preview with bounding box coordinates, document library, and administrative health dashboard.
- **`apps/api`**: FastAPI service handling authentication, role-based access control, file upload validation, and search/retrieval endpoints.
- **`apps/worker`**: Celery worker executing ingestion pipelines, Tesseract OCR on scanned pages, chunking, and embedding creation.
- **`packages/shared`**: Shared Pydantic contracts, extraction schemas, and model specifications.
- **`infra`**: Docker Compose definition, pgvector initialization scripts, and production container builds.
- **`tests`**: Comprehensive unit and integration test suite, synthetic contract/invoice generators, and benchmark evaluation harness.
- **`docs`**: In-depth operational documentation.

---

## 3. Document Ingestion Lifecycle

1. **Upload & Signature Validation**: File magic bytes and extensions are verified (`.pdf`, `.docx`, `.txt`, `.png`, `.jpg`).
2. **Workspace Isolation & Deduplication**: Files are SHA-256 hashed. If an identical file exists in the workspace, duplicates are linked without redundant re-indexing.
3. **Multi-Format Parsing**:
   - **PDF**: PyMuPDF extracts text, headings, layout positions, and page numbers.
   - **Scanned Pages**: Low-density pages automatically trigger native Tesseract OCR.
   - **DOCX / TXT**: Paragraphs, section headings, and table headers are preserved. Page numbers are intentionally set to `null` to avoid fabricating pagination.
4. **Token-Aware Chunking**: Chunks observe max context windows (500 tokens for laptop, 800 tokens for quality). Table headers are prepended to subsequent sub-chunks when tables span multiple splits.
5. **Local Vectorization**: Chunks are embedded locally via `BAAI/bge-small-en-v1.5` or `bge-m3` using mean pooling and L2 normalization.
6. **Persistence**: Chunks, bounding boxes, tokens, and vectors are committed, moving document status to `ready`.

---

## 4. Hybrid Retrieval & Grounded Generation

1. **Strict Authorization Scope**: Document permissions are enforced inside the database query. Deleted documents (`is_deleted=True`) and restricted documents are excluded before any ranking occurs.
2. **Dense Vector Ranking**: Normalized inner products calculate cosine similarity against query embeddings.
3. **Keyword Ranking**: Term frequency scoring matches query keywords against passage content and section headings.
4. **Reciprocal Rank Fusion (RRF)**:
   $$RRF\_Score(d) = \frac{1}{60 + rank_{vec}(d)} + \frac{1}{60 + rank_{kw}(d)}$$
5. **Prompt Injection Defense**: Uploaded text is encapsulated within `<document_context>` XML tags and declared untrusted. System instructions within documents are rendered inert.
6. **Strict Citation Validation**: Assistant answers cite evidence as `[1]`, `[2]`. Post-processing parses these markers and verifies each reference exists in the supplied context before finalizing citations. Missing information triggers explicit abstention.
