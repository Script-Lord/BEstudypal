# StudyBuddy – AI Document Chat Platform

A full-stack RAG (Retrieval-Augmented Generation) platform. Upload any document (PDF, DOCX, PPTX, images) and chat with it using AI.

## Architecture

```
Frontend (Vercel/CSR)  →  Backend (Railway/VPS)  →  Docling (Python FastAPI)
     Next.js                Express + BullMQ            PDF/DOCX Parser
        ↓                        ↓
  Supabase Auth           PostgreSQL + pgvector
  Supabase Storage        OpenAI Embeddings + Chat
```

## Project Structure

```
studybuddy/
├── frontend/          # Next.js app → deploy to Vercel
├── backend/           # Express API + BullMQ worker → deploy to Railway/VPS
└── docling-service/   # Python FastAPI document parser → deploy to Railway
```

## Quick Start

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `backend/src/db/migrations/001_init.sql` via the Supabase SQL editor
3. Create a storage bucket named `documents` (public: false)
4. Enable Row Level Security on the bucket

### 2. Docling Service

```bash
cd docling-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
```

Requires Redis running locally: `docker run -d -p 6379:6379 redis:alpine`

### 4. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in Supabase + backend URL
npm install
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string from Supabase |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (never expose client-side) |
| `AI_PROVIDER` | `openai` (default), `gemini`, or `anthropic` |
| `OPENAI_API_KEY` | OpenAI API key |
| `DOCLING_SERVICE_URL` | URL to your Docling FastAPI service |
| `REDIS_URL` | Redis connection URL |
| `FRONTEND_URL` | Your Vercel frontend URL (for CORS) |
| `PORT` | Server port (default: 3001) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Your backend URL |

## Supported File Types

- PDF (`.pdf`)
- Word Documents (`.docx`, `.doc`)
- PowerPoint (`.pptx`, `.ppt`)
- Images (`.png`, `.jpg`, `.jpeg`, `.webp`)
- Plain text (`.txt`, `.md`)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, CSR) |
| Styling | Tailwind CSS + Framer Motion |
| Backend | Node.js + Express + TypeScript |
| Job Queue | BullMQ + Redis |
| Doc Parser | Docling (Python FastAPI) |
| Database | PostgreSQL via Supabase |
| Vector Search | pgvector |
| Embeddings | OpenAI `text-embedding-3-small` |
| AI Completion | OpenAI / Gemini / Anthropic (pluggable) |
| Auth | Supabase Auth (email + OAuth) |
| File Storage | Supabase Storage |

## Deployment

- **Frontend**: Vercel (push `frontend/` or set root directory)
- **Backend**: Railway (Dockerfile or Node buildpack)
- **Docling**: Railway or separate VPS (needs Python 3.10+, ~2GB RAM)
- **Redis**: Railway Redis plugin or Upstash
