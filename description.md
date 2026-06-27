# StudyPal — AI-Powered Study Assistant for Course Materials

## One-Line Summary

**StudyPal turns lecture notes, slides, PDFs, and web pages into a course-aware AI tutor that students can question instantly — with no sign-in required for public courses.**

---

## The Problem

University students are drowning in unstructured course material. PDFs, PowerPoints, scanned notes, and scattered web resources sit in folders and drives, but there is no easy way to *interact* with that content. Searching a 200-page PDF for one definition, or cross-referencing three lecture decks before an exam, wastes hours. Generic chatbots hallucinate answers because they were never trained on *your* syllabus. Existing tools often require accounts, per-document setup, or expensive subscriptions before a student can ask a single question.

StudyPal addresses this gap: **upload once, chat forever — and share the result with an entire class.**

---

## Our Solution

StudyPal is a full-stack **Retrieval-Augmented Generation (RAG)** platform built around **courses**, not isolated files. A student or lecturer creates a course (e.g. *Information Literacy — INF 101*), uploads all related materials, and gets an AI assistant grounded exclusively in those documents. When the course is marked public, anyone with the link can open it and start chatting — no account, no friction.

The experience is designed to feel like a modern study workspace: a three-panel layout with **Sources** (uploaded documents), **Chat** (streaming AI answers with citations), and **Studio** (planned study tools such as quizzes and audio summaries).

---

## Key Features

### 1. Course-Centric Organization
- Create courses with title, code, level (e.g. Level 100), and description.
- Attach multiple documents to a single course; the AI searches across *all* of them when answering.
- Dashboard for owners; **Explore** page for discovering public courses.

### 2. Instant Public Access (No Login Required)
- Course owners can toggle **Public** visibility with one click.
- Visitors browse `/explore`, open any public course, and chat immediately.
- Public chat is stateless (no history stored) — privacy-friendly for casual visitors.
- Shareable links make it easy to distribute a course AI to classmates.

### 3. Multi-Format Document Ingestion
Supported inputs include:
| Format | Handling |
|--------|----------|
| PDF | Local parsing (`pdf-parse`), Docling fallback for complex layouts |
| Word (`.docx`) | Local parsing via Mammoth |
| PowerPoint / legacy Office | Docling microservice |
| Images (PNG, JPG, WebP) | **Snwolley Vision API** — describes diagrams, slides, and scanned pages |
| Plain text / Markdown | Direct ingestion |
| Web URLs | Fetches and extracts readable text from public HTTP/HTTPS pages |

Documents are processed asynchronously. The UI polls status (`pending` → `processing` → `ready` / `failed`) so users always know when chat is available.

### 4. Grounded AI Chat with Source Citations
- Questions are answered **only from retrieved course excerpts** (strict mode), with inline citations like `[Source 1]`, `[Source 2]`.
- Optional **Web + AI** mode supplements incomplete excerpts with clearly labeled background knowledge under *"Beyond your sources:"* so students know what came from their materials vs. general knowledge.
- Responses stream in real time via Server-Sent Events (SSE) for a responsive feel.
- The Sources panel shows which document chunks were used for each answer.

### 5. Voice Input (Speech-to-Text)
- Students can record a question instead of typing.
- Audio is sent to the **Snwolley STT API** and transcribed before entering the RAG pipeline.
- Makes the app accessible on mobile and useful during revision sessions.

### 6. Pluggable AI Backend
The backend supports multiple providers via a single interface:
- **Snwolley Agents** (default for hackathon deployment) — chat completions via the Snwolley platform
- **OpenAI** (`gpt-4o-mini`) — streaming native support
- **Google Gemini** — via OpenAI-compatible endpoint

Switching providers is a single environment variable (`AI_PROVIDER`).

### 7. Authentication Flexibility
- **Firebase Auth** (Google sign-in) for quick onboarding
- **Supabase Auth** (email/password) as fallback
- Dual-provider middleware verifies either token type seamlessly

### 8. Production-Ready Deployment on Netlify
The project ships as a **unified Netlify deployment**:
- Next.js frontend (App Router)
- Express API exposed as a Netlify Function (`/api/*`)
- Long-running document processing as a **background function** (up to 15 minutes)
- No separate VPS required for a hackathon demo

---

## How It Works — RAG Pipeline

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Upload    │────▶│  Parse document  │────▶│  Chunk text     │
│  (Supabase  │     │  (local libs /   │     │  (~512 tokens,  │
│   Storage)  │     │   Docling /      │     │   50-token      │
└─────────────┘     │   Snwolley Vision)│     │   overlap)      │
                    └──────────────────┘     └────────┬────────┘
                                                      │
                    ┌──────────────────┐              ▼
                    │  Store chunks in │     ┌─────────────────┐
                    │  Redis (per doc  │◀────│  Index by       │
                    │  + course index) │     │  document/course│
                    └────────┬─────────┘     └─────────────────┘
                             │
         User question       │
              │              │
              ▼              ▼
     ┌────────────────────────────────┐
     │  Keyword relevance scoring   │
     │  (top-K chunks per course)   │
     └──────────────┬─────────────────┘
                    │
                    ▼
     ┌────────────────────────────────┐
     │  Build system prompt with      │
     │  retrieved excerpts + citation │
     │  instructions                  │
     └──────────────┬─────────────────┘
                    │
                    ▼
     ┌────────────────────────────────┐
     │  Snwolley Agent / OpenAI /     │
     │  Gemini — stream answer (SSE)  │
     └────────────────────────────────┘
```

**Design choice:** Chunks are stored in **Redis** with keyword-based relevance scoring rather than pgvector embeddings. This keeps latency low, avoids per-query embedding API costs, and works reliably within serverless time limits — while the PostgreSQL schema retains vector columns for future upgrade paths.

---

## Snwolley AI Integration

StudyPal is built for the Snwolley hackathon and uses the platform across the full stack:

| Snwolley API | Role in StudyPal |
|--------------|------------------|
| **Agents / Chat Completions** | Primary LLM for course and document Q&A |
| **Speech-to-Text (STT)** | Voice question input in the chat panel |
| **Text-to-Speech (TTS)** | Backend endpoint ready for audio playback of answers |
| **Vision** | Image and diagram understanding during document ingestion |

This demonstrates a cohesive use of Snwolley's multimodal stack: vision to *read* materials, agents to *reason* over them, and speech to *interact* naturally.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NETLIFY (Production)                      │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │  Next.js Frontend   │    │  Netlify Functions              │ │
│  │  • Landing / Explore│    │  • api.ts → Express app         │ │
│  │  • Dashboard        │───▶│  • process-document-background  │ │
│  │  • Course chat UI   │    │    (15 min background worker)   │ │
│  └─────────────────────┘    └───────────────┬─────────────────┘ │
└─────────────────────────────────────────────┼───────────────────┘
                                              │
              ┌───────────────────────────────┼───────────────────┐
              ▼                               ▼                   ▼
     ┌─────────────────┐            ┌─────────────────┐   ┌──────────────┐
     │  Supabase       │            │  Redis          │   │  Snwolley    │
     │  • PostgreSQL   │            │  • Chunk store  │   │  • Agents    │
     │  • Auth         │            │  • Course index │   │  • STT/TTS   │
     │  • File storage │            └─────────────────┘   │  • Vision    │
     └─────────────────┘                                  └──────────────┘
                                              │
                                              ▼
                                   ┌─────────────────┐
                                   │  Docling Service │
                                   │  (Python/FastAPI)│
                                   │  Complex PDF/PPT │
                                   └─────────────────┘
```

### Repository Structure

```
studybuddy/
├── frontend/           Next.js 14 app (App Router, Tailwind, Framer Motion)
├── backend/            Express + TypeScript API, services, workers
├── docling-service/    Python FastAPI document parser (optional microservice)
└── netlify/            Serverless function wrappers for unified deploy
    └── functions/
        ├── api.ts                          Main API handler
        └── process-document-background.ts  Async document processor
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (Supabase) with Row-Level Security |
| **File Storage** | Supabase Storage |
| **Chunk Cache** | Redis (Upstash-compatible) |
| **Job Queue** | BullMQ + Redis (local/VPS) · Netlify Background Functions (production) |
| **Document Parsing** | pdf-parse, Mammoth, Docling, Snwolley Vision |
| **AI** | Snwolley Agents, OpenAI, Gemini (pluggable) |
| **Auth** | Firebase Auth + Supabase Auth |
| **Deployment** | Netlify (frontend + API + background jobs) |

---

## Security & Privacy

- **Row-Level Security (RLS)** on all Supabase tables — users can only access their own data.
- Public courses expose read-only access to documents and chunks via explicit RLS policies.
- API routes protected with Bearer token authentication (Firebase or Supabase JWT).
- Rate limiting on read/write endpoints in production.
- Internal background job endpoint secured with `INTERNAL_JOB_SECRET`.
- Service role keys and API keys are server-side only — never exposed to the browser.

---

## User Journeys

### Lecturer / Course Creator
1. Sign in with Google or email.
2. Create a course (*"Data Structures — CS 201"*, Level 200).
3. Upload PDFs, slides, or paste a web URL as a source.
4. Wait for documents to reach `ready` status.
5. Chat privately to test answers, then toggle **Public**.
6. Share the `/explore/{courseId}` link with students.

### Student (No Account)
1. Visit the landing page or `/explore`.
2. Browse public courses filtered by level.
3. Click **Try Chat** on any course with materials.
4. Ask questions by typing or voice; read cited sources in the panel.
5. Optionally enable **Web + AI** for broader context when course notes are incomplete.

---

## What Makes StudyPal Different

| Typical AI chatbot | StudyPal |
|--------------------|----------|
| General knowledge, may hallucinate | Answers grounded in *your* uploaded materials |
| One file at a time | Entire course corpus searched at once |
| Account required | Public courses open to anyone |
| Text only | Voice input via Snwolley STT; vision for image-based notes |
| Desktop-first | Mobile-responsive three-panel workspace |

---

## Demo Flow for Judges

1. **Landing page** — highlight *"No account needed to chat"* and popular public courses.
2. **Explore** — search/filter courses by level; open a public course.
3. **Public chat** — ask *"Summarize the key topics"* or *"What are the main concepts?"*; show streaming response and source citations.
4. **Voice** — tap the microphone, ask a question verbally; show transcription → answer pipeline.
5. **Owner dashboard** (if signed in) — create a course, upload a PDF, show processing status → ready → chat.
6. **Toggle public** — share link; open in incognito to prove zero-auth access.

---

## Future Roadmap (Studio Panel)

The **Studio** sidebar previews planned study tools that will extend the same course knowledge base:

- Audio Overview (TTS-powered summaries)
- Slide Deck generation
- Mind Map
- Quiz generator
- Data Table extraction

The UI scaffolding is in place; generation logic is the next development phase.

---

## Conclusion

StudyPal is a practical, deployable answer to a real student pain point: **making course materials conversational**. By combining course-centric organization, public sharing, multimodal ingestion (Snwolley Vision + Docling), voice interaction (Snwolley STT), and grounded AI answers (Snwolley Agents), it delivers a complete study workflow — from upload to exam prep — in a single web app that works on Netlify without dedicated server infrastructure.

**Built for students. Powered by Snwolley. Ready to demo.**
