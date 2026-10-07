# DocuMind — Free Cloud Deployment Guide (Render + Vercel)

This guide walks you through deploying **DocuMind** online for free using:
- **Render** (Free Web Service for FastAPI Backend)
- **Vercel** (Free Hobby Tier for Next.js Frontend)

---

## Architecture Overview

```
[ User Browser ]
       |
       v
[ Vercel (Next.js Frontend) ] 
       |  (HTTPS API Requests)
       v
[ Render (FastAPI Backend + SQLite/Postgres) ]
```

---

## Step 1: Deploy Backend on Render (Free Tier)

Render provides free web services for hosting the Python/Docker FastAPI backend.

### Option A: Using Render Blueprint (`render.yaml` - Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `abdulbasit23415/AI-Document-Intelligence`.
4. Render will automatically read `render.yaml` and set up the `documind-api` service.
5. Click **Apply**.

### Option B: Manual Web Service Setup
1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service**.
2. Connect `abdulbasit23415/AI-Document-Intelligence`.
3. Configure the service settings:
   - **Name**: `documind-api`
   - **Region**: Oregon (or nearest)
   - **Runtime**: `Docker` (uses root `Dockerfile`) or `Python 3`
     - If using **Docker**:
       - Dockerfile Path: `Dockerfile` (or `infra/Dockerfile.api`)
     - If using **Python 3**:
       - Build Command: `pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt`
       - Start Command: `uvicorn apps.api.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free` (0.1 CPU, 512 MB RAM)
4. Add Environment Variables under **Environment**:
   - `ENVIRONMENT` = `production`
   - `MODEL_PROFILE` = `laptop`
   - `DATABASE_URL` = `sqlite:///./data/docmind.db`
   - `SECRET_KEY` = *(click Generate or enter any 32-character random string)*
5. Click **Deploy Web Service**.
6. Once deployed, note down your Render service URL (e.g., `https://documind-api.onrender.com`).
   - You can test it by visiting: `https://documind-api.onrender.com/api/v1/health`.

---

## Step 2: Deploy Frontend on Vercel (Free Hobby Tier)

Vercel hosts the Next.js 16 app with automatic global CDN and zero configuration.

1. Go to [Vercel](https://vercel.com/) and log in with your GitHub account.
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository: `abdulbasit23415/AI-Document-Intelligence`.
4. Framework Preset will be automatically detected as **Next.js**.
5. Under **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://<YOUR-RENDER-SERVICE-NAME>.onrender.com` *(your Render backend URL from Step 1)*
6. Click **Deploy**.
7. In ~1-2 minutes, Vercel will complete the build and provide your live production URL (e.g., `https://ai-document-intelligence.vercel.app`).

---

## Step 3: Verify Full Functionality

1. Open your live Vercel URL in your browser.
2. Log in with the pre-seeded admin credentials:
   - **Email**: `admin@docmind.local`
   - **Password**: `AdminDocuMind2026!`
3. Test key workflows:
   - Upload a PDF, TXT, or scanned image.
   - Run a search query.
   - Open the 3-panel chat workspace and ask document questions.
   - Click citation chips `[1]` to verify that document preview and bounding boxes work properly.
   - Toggle between Light and Dark themes.

---

## Summary of Free Tier Limitations & Optimizations

- **Render Free Tier Spin-down**: Free Render Web Services automatically spin down after 15 minutes of inactivity. When a new request arrives, it may take 30-50 seconds to wake up (cold start). Once awake, performance is instant.
- **512 MB RAM Budget**: DocuMind uses CPU-quantized ONNX/BGE-small embeddings and lightweight vector projection to stay safely within Render's 512 MB memory limit.
- **Persistence**: On the free tier, SQLite stores data on ephemeral disk. For permanent multi-instance storage, you can plug in a free PostgreSQL database (e.g., Neon.tech or Supabase) by simply setting `DATABASE_URL` in Render environment variables.
