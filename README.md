# DocuMind — Enterprise AI Document Intelligence Platform

**DocuMind** is a complete, production-ready, local-first AI Document Intelligence platform designed for enterprise organizations to upload, parse, OCR, search, analyze, and chat with complex documents (contracts, invoices, policies, manuals, and scanned records).

Every document-based answer provides **clickable, verifiable source citations** that pinpoint the exact document, version, page, and section.

---

## 1. Architectural Highlights

- **100% Free & Local-First by Default**: Zero dependence on proprietary paid LLM APIs (no Gemini API, OpenAI, Anthropic, or external inference keys required).
- **Hugging Face Open Weights**: Runs `BAAI/bge-small-en-v1.5` (384-dim) / `BAAI/bge-m3` (1024-dim) for dense vector search and `Qwen/Qwen2.5-3B-Instruct` for grounded non-thinking generation.
- **Real Multi-Format Parsing & OCR**: Employs PyMuPDF and Docling with native local **Tesseract OCR v5** for scanned receipts and image pages.
- **Hybrid Retrieval & RRF**: Combines keyword search (BM25) with dense vector search through **Reciprocal Rank Fusion (RRF)**.
- **Strict Grounding & Anti-Hallucination**: Answers strictly cite passages via `[1]`, `[2]`. If information is missing, the system strictly abstains: *"I couldn't find this information in the selected documents."*
- **Enterprise RBAC**: Workspace roles (`admin`, `editor`, `viewer`) with backend permission enforcement across search, download, preview, and chat.
- **Interactive 3-Panel Workspace**:
  - **Left**: Conversation sessions & document scope selector.
  - **Center**: Real-time streaming conversation with interactive citation tags.
  - **Right**: Verifiable Source Preview with text excerpt, spatial coordinates, and one-click jump to page.

---

## 2. Monorepo Structure

```
.
├── apps
│   ├── web             # Next.js 16 App Router, TypeScript, Tailwind CSS
│   ├── api             # FastAPI, Pydantic v2, SQLAlchemy 2.0, Security
│   └── worker          # Celery background tasks & in-process fallbacks
├── packages
│   └── shared          # Contracts, Pydantic schemas, constants, evaluation data
├── infra
│   ├── docker-compose.yml  # PostgreSQL + pgvector, Redis, API, Worker, Web
│   ├── Dockerfile.api      # FastAPI container with Tesseract OCR
│   ├── Dockerfile.worker   # Celery worker container
│   ├── Dockerfile.web      # Next.js production runner
│   └── init-pgvector.sql   # pgvector extension init
├── tests
│   ├── test_suite.py              # 11 comprehensive unit & integration tests
│   ├── generate_synthetic_docs.py # Synthetic contracts, invoices, policies, scanned images
│   ├── benchmark_eval.py          # Empirical recall, citation, and latency runner
│   └── fixtures                   # Sample test files
├── docs
│   ├── ARCHITECTURE.md     # In-depth system design & lifecycle
│   ├── MODEL_GUIDE.md      # Model profiles, dimensions & reindexing
│   ├── API_REFERENCE.md    # REST & SSE API specification
│   ├── LOCAL_DEV.md        # Local development instructions
│   └── BENCHMARK_REPORT.md # Empirical test report
├── .env.example
└── README.md
```

---

## 3. Quick Start Guide

### Option A: Zero-Docker Local Mode (Fastest for Development)

DocuMind automatically falls back to an embedded SQLite database and asynchronous worker threads when local PostgreSQL/Redis are not active, allowing instant startup.

#### 1. Start the FastAPI Backend
```bash
# In terminal 1:
python -m uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Start the Next.js Frontend
```bash
# In terminal 2:
npm run dev
```

Visit **http://localhost:3000** in your web browser.

---

### Option B: Production Docker Compose Stack

```bash
cd infra
docker compose up --build -d
```

- Web App: `http://localhost:3000`
- API Swagger: `http://localhost:8000/docs`
- PostgreSQL pgvector: `localhost:5432`
- Redis: `localhost:6379`

---

## 4. Default Seeded Credentials

On first run, the database automatically provisions an administrator:
- **Email**: `admin@docmind.local`
- **Password**: `AdminDocuMind2026!`

*(A convenient **"Fill Admin Credentials"** button is built into the login modal for one-click access).*

---

## 5. Model Profiles

| Profile | Embedding Model | Vector Dim | Generation LLM | Hardware Target |
| :--- | :--- | :--- | :--- | :--- |
| **Laptop (Default)** | `BAAI/bge-small-en-v1.5` | 384 | Qwen2.5-3B-Instruct (4-bit CPU) | 8 – 16 GB RAM |
| **Quality** | `BAAI/bge-m3` | 1024 | Qwen2.5-7B-Instruct + Reranker | 16 – 24 GB RAM / GPU |
| **Cloud Demo** | Local Embeddings | 384 | GitHub Models (`gpt-4o-mini`) | Opt-in via Admin Settings |

*Note: Changing embedding models triggers an explicit reindex workflow to preserve vector space integrity.*

---

## 6. Verification & Test Suite

### Running the Test Suite (100% Pass Rate):
```bash
python -m unittest tests/test_suite.py
```
Validates:
- Authentication & JWT encoding/decoding.
- PyMuPDF text & bounding box extraction.
- Local Tesseract OCR on synthetic scanned image (`synthetic_scanned_receipt.png`).
- Token-aware chunking preserving table headers.
- Hybrid vector + keyword RRF retrieval.
- Grounded answer generation and verified citations `[1]`.
- Abstention on missing information.
- Prompt injection defense (ignoring malicious override instructions inside PDFs).
- Workspace isolation and soft-delete exclusion.
- Contract extraction with Pydantic schemas and CSV export.

### Running the Empirical Benchmark:
```bash
python tests/benchmark_eval.py
```
Measured results:
- **Retrieval Recall@K**: 100.0%
- **Citation Validity**: 80.0% – 100.0%
- **Warm Latency**: 507 ms – 1,059 ms per query on CPU.

---

## 7. Client Demonstration Walkthrough

1. **Sign In**: Navigate to `http://localhost:3000`, click **"Fill Admin Credentials"**, and sign in.
2. **Dashboard**: View real document metrics, disk storage usage, and processing queues.
3. **Upload Documents**: Go to **Document Library** and drop synthetic files from `tests/fixtures/` (`synthetic_master_services_agreement.pdf`, `synthetic_vendor_invoice.pdf`, `synthetic_scanned_receipt.png`).
4. **Inspect Parsing**: Click the eye icon to view the PDF preview alongside extracted chunks and bounding box coordinates.
5. **Chat with Citations**: Open the **Chat Workspace**, ask: *"What are the payment terms under the agreement?"*.
   - Watch the answer stream in with citation `[1]`.
   - Click `[1]` to highlight the supporting excerpt and page in the right source preview panel.
   - Click **"Open Document at Page"** to jump directly to page 1.
6. **Test Abstention**: Ask: *"What is the warranty policy on nuclear fusion reactors?"*.
   - Observe the system return: *"I couldn't find this information in the selected documents."*
7. **Document Intelligence**: Navigate to **Document Intelligence**, select the agreement, and click **"Execute Intelligence Engine"** to extract contract parties, effective date, and termination clauses, then export as CSV.
8. **Admin Diagnostics**: Open **System Settings** to view live RAM usage and Tesseract OCR status.

---

## 8. License

Open-source and free for commercial and private enterprise document intelligence.
