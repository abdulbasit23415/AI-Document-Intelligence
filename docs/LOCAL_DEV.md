# DocuMind Local Development & Setup Guide

This guide provides instructions to run DocuMind on your local workstation.

---

## 1. Prerequisites

- **Python**: 3.11 or 3.12+ (Python 3.13 supported)
- **Node.js**: v18+ or v20+
- **OCR Engine**: Tesseract OCR
  - **Windows**: Install via `winget install UB-Mannheim.TesseractOCR` (installed at `C:\Program Files\Tesseract-OCR\tesseract.exe`)
  - **Linux**: `sudo apt install tesseract-ocr`
  - **macOS**: `brew install tesseract`

---

## 2. Quickstart (Zero-Docker Local Mode)

DocuMind includes intelligent fallbacks to run out of the box without requiring Docker Desktop or Redis running.

### Step 1: Start the Backend API
In your terminal, navigate to the project directory and start FastAPI with Uvicorn:

```bash
# Start FastAPI backend on port 8000
python -m uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload
```
*Note: The API automatically initializes the database, creates default tables, and seeds the initial administrator account.*

### Step 2: Start the Next.js Frontend
In a second terminal window:

```bash
# Start Next.js development server
npm run dev
```

Visit **http://localhost:3000** in your web browser.

---

## 3. Seeded Default Credentials

DocuMind creates an administrator on initial startup:
- **Email**: `admin@docmind.local`
- **Password**: `AdminDocuMind2026!`

The login modal contains a one-click button: **"Fill Admin Credentials"** to log in instantly.

---

## 4. Running with Docker Compose (Production Stack)

To run the complete production container stack (PostgreSQL with pgvector, Redis, Celery, API, and Next.js):

```bash
# Navigate to infra directory
cd infra

# Start all containers
docker compose up --build -d

# Check status
docker compose ps
```

Services exposed:
- Web App: `http://localhost:3000`
- API Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## 5. Running the Test Suite & Benchmark Evaluation

### Run Unit & Integration Tests:
```bash
python -m unittest tests/test_suite.py
```

### Run Benchmark Evaluation:
```bash
python tests/benchmark_eval.py
```
This script measures actual recall, citation validity, and latency metrics across synthetic contracts, invoices, and scanned image documents.
