# CampusStudyGPT 📚

An AI-powered offline-capable study companion that transforms your PDFs and handwritten notes into structured revision materials, flashcards, question banks, and mock exams. Works like NotebookLM — but runs locally in your browser.

## Features

- **📄 Document Ingestion** — Upload PDFs and note images (PNG/JPG/WEBP). Text is extracted via PDF.js and Tesseract.js OCR, then chunked and indexed.
- **💬 RAG Chat Assistant** — Ask questions grounded in your uploaded study materials. Uses retrieval-augmented generation with inline source citations.
- **📝 Revision Notes** — Auto-generates structured, topic-wise revision summaries with LaTeX math support.
- **❓ Question Bank** — Creates MCQs, short-answer, and long analytical questions with model answers.
- **🃏 Flashcards** — Interactive flip-card study deck generated from your notes.
- **📑 Mock Exam Simulator** — Produces university-style exam papers with answer keys and grading rubrics. Print-ready.
- **🔒 Offline Local Mode** — Runs entirely on-device using Chrome's built-in Gemini Nano (via Prompt API). Zero API calls, zero tokens, full privacy.
- **☁️ Cloud Mode** — Uses Gemini 2.5 Flash API for higher quality generation and vector embeddings stored in Firestore.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| AI (Cloud) | Gemini 2.5 Flash via Vercel AI SDK |
| AI (Local) | Chrome Built-in AI (Gemini Nano) |
| PDF Parsing | PDF.js (client), pdf-parse (server) |
| OCR | Tesseract.js (client), Gemini Vision (server) |
| Vector Store | Firestore + cosine similarity |
| Local Storage | IndexedDB with TF-IDF search |
| Auth | Firebase Authentication |

## Getting Started

### Prerequisites
- Node.js 18+
- A Gemini API key (for cloud mode)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Enabling Local/Offline Mode

To use the fully offline mode with Chrome's built-in Gemini Nano:

1. Open `chrome://flags` in Chrome 127+
2. Enable **"Prompt API for Gemini Nano"**
3. Enable **"Enables optimization guide on device"** → set to **Enabled BypassPerfRequirement**
4. Restart Chrome and wait for the model to download (~1.7 GB)
5. The app will auto-detect Gemini Nano and switch to Local mode

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # RAG chat endpoint
│   │   ├── documents/
│   │   │   ├── route.ts           # List/delete documents
│   │   │   └── upload/route.ts    # Upload & ingest documents
│   │   └── study-materials/route.ts # Generate/fetch study kit
│   ├── chat/
│   │   ├── page.tsx               # Chat page entry
│   │   └── ChatPageClient.tsx     # Main app shell
│   ├── globals.css                # Design system (retro brutalist)
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
├── components/
│   ├── AuthGate.tsx               # Login/signup terminal
│   ├── ChatInterface.tsx          # Multi-turn RAG chat
│   ├── DocumentPanel.tsx          # File upload & management
│   ├── Markdown.tsx               # Markdown renderer
│   └── StudyWorkspace.tsx         # Notes/Q&A/Flashcards/Exam tabs
└── lib/
    ├── chunker.ts                 # Text chunking with overlap
    ├── embeddings.ts              # Gemini embedding generation
    ├── firebase.ts                # Firebase client SDK
    ├── firebase-admin.ts          # Firebase Admin (auth verification)
    ├── gemini.ts                  # Gemini chat generation
    ├── indexed-db-store.ts        # IndexedDB for local mode
    ├── local-ai.ts                # Chrome Gemini Nano integration
    ├── local-parser.ts            # Client-side PDF.js + Tesseract OCR
    ├── ocr.ts                     # Server-side Gemini Vision OCR
    ├── pdf-extractor.ts           # Server-side PDF text extraction
    ├── rag-pipeline.ts            # Full ingestion & retrieval pipeline
    ├── study-generator.ts         # Study kit generation orchestrator
    └── vector-store.ts            # Firestore vector store + search
```

## License

Private project. All rights reserved.
