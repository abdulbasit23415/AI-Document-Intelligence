# DocuMind API Specification Reference

All endpoints are prefixed with `/api/v1` unless noted otherwise.

---

## 1. Authentication (`/auth`)

### `POST /auth/register`
Creates an enterprise user account and auto-provisions a default workspace.
- **Request Body**: `{ "email": "user@example.com", "password": "...", "full_name": "..." }`
- **Response**: `{ "access_token": "...", "token_type": "bearer", "user": { ... } }`

### `POST /auth/login`
OAuth2 password form login.
- **Form Data**: `username` (email), `password`
- **Response**: `{ "access_token": "...", "token_type": "bearer", "user": { ... } }`

### `GET /auth/me`
Retrieves current authenticated user identity and superuser status.

---

## 2. Workspaces (`/workspaces`)

- `GET /workspaces`: Lists workspaces user belongs to.
- `POST /workspaces`: Creates a new workspace (creator is assigned `admin`).
- `GET /workspaces/{id}/members`: Lists workspace collaborators and roles (`admin`, `editor`, `viewer`).
- `POST /workspaces/{id}/members`: Invites a member by email.
- `PATCH /workspaces/{id}/members/{user_id}`: Modifies a member's role.
- `DELETE /workspaces/{id}/members/{user_id}`: Removes a collaborator.

---

## 3. Documents (`/workspaces/{id}/documents`)

- `POST /workspaces/{id}/documents/upload`: Multi-part upload with SHA-256 duplicate detection.
- `GET /workspaces/{id}/documents`: Paginated list of documents with status and search filters.
- `GET /workspaces/{id}/documents/{doc_id}`: Full detail with chunk coordinates and provenance.
- `GET /workspaces/{id}/documents/{doc_id}/download`: Streams binary file for PDF.js preview.
- `POST /workspaces/{id}/documents/{doc_id}/retry`: Re-queues a failed document.
- `DELETE /workspaces/{id}/documents/{doc_id}`: Soft-deletes to immediately exclude from retrieval, then purges files.

---

## 4. Chat & Grounded Retrieval (`/workspaces/{id}/chat`)

- `GET /workspaces/{id}/chat/conversations`: Lists user conversations.
- `POST /workspaces/{id}/chat/conversations`: Creates a conversation session.
- `GET /workspaces/{id}/chat/conversations/{id}/messages`: Fetches chat history with verified citations.
- `POST /workspaces/{id}/chat/conversations/{id}/messages`:
  - Request: `{ "content": "query string", "selected_document_ids": [] }`
  - Response: Server-Sent Events (`text/event-stream`) streaming text tokens followed by `{"event": "done", "citations": [...], "timings": { ... }}`.

---

## 5. Document Intelligence (`/workspaces/{id}/intelligence`)

- `POST /workspaces/{id}/intelligence/contract/{doc_id}`: Extracts parties, effective date, payment terms, renewal, termination, and governing law into `ContractExtraction`.
- `POST /workspaces/{id}/intelligence/invoice/{doc_id}`: Extracts supplier, invoice #, dates, line items, and totals into `InvoiceExtraction`.
- `POST /workspaces/{id}/intelligence/summary/{doc_id}`: Summarizes whole document in bounded batches into `DocumentSummary`.
- `POST /workspaces/{id}/intelligence/compare?document_a_id=...&document_b_id=...`: Side-by-side comparison matrix.
- `GET /workspaces/{id}/intelligence/{record_id}/export?format=csv|json`: Exports structured output.

---

## 6. System & Diagnostics (`/admin`, `/health`)

- `GET /health`: Basic liveness check.
- `GET /ready`: Readiness probe verifying PostgreSQL/SQLite, storage write permissions, and Tesseract OCR.
- `GET /admin/stats`: Returns corpus counts, physical RAM allocations, and queue health.
- `POST /admin/settings`: Toggles model profiles and cloud demo adapters.
- `POST /admin/reindex`: Triggers controlled vector re-indexing for a target embedding model.
