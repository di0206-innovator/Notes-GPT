# NotesGPT 📚

An AI-powered, offline-capable study companion that transforms your PDFs, textbooks, and handwritten notes into structured revision materials, flashcards, question banks, and mock exams. Works like NotebookLM — but runs locally on your device or in-browser.

---

## Key Features

- **📄 Robust Document Ingestion** — Upload PDF textbooks, note images (PNG/JPG/WEBP), Word documents (.docx), and PowerPoint presentations (.pptx). Extract text locally via PDF.js and Tesseract.js OCR, or on the server via pdf-parse, Gemini Generative Vision, and OfficeParser.
- **💬 Context-Grounded Chat** — Ask questions about your materials. Answers are strictly grounded in retrieved segments and feature inline source citations.
- **📝 Revision Notes** — Automatically generates structured, topic-wise study notes with complete LaTeX math equation formatting ($$...$$).
- **❓ Practice Q&A Bank** — Creates Multiple Choice Questions (MCQs), short definitions, and long analytical prompts with full answer keys.
- **🃏 Memory Flashcards** — Study with a client-side interactive flip-card review deck built dynamically from notes.
- **📑 Mock Exam Simulator** — Generates university-style exam papers with complete rubrics and answer sheets, styled for clean physical printing.
- **🔒 Multi-Engine Local AI** — Supports three local execution methods for full offline privacy:
  - **Ollama Local Server** — metal-accelerated, high-performance offline queries via system daemons.
  - **WebLLM WebGPU** — in-browser WebGPU runtime model runner; requires zero external apps.
  - **Chrome window.ai (Gemini Nano)** — built-in Chrome experimental prompt engine.
- **☁️ Cloud Mode** — Employs `gemini-2.0-flash` for high-throughput generation and semantic vector search backed by Firestore.

---

## Technical Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Styling & UI** | React 19, Tailwind CSS 4, Framer Motion, Lucide Icons |
| **AI (Cloud)** | Gemini 2.0 Flash via Vercel AI SDK |
| **AI (Local)** | Ollama (Local Daemon), WebLLM (Browser WebGPU), Chrome window.ai |
| **Vector DB** | Firestore vector collections + Cosine similarity (Cloud) |
| **Client Storage** | IndexedDB with Local TF-IDF search index |
| **PDF & Office Extraction** | PDF.js (Browser), pdf-parse, officeparser (Node.js API) |
| **OCR Engines** | Tesseract.js (Client), Gemini Generative Vision (Server) |
| **User Identity** | Firebase Auth (Guest Sessions & Email Signups) |

---

## Setup & Run Instructions

For detailed installation and setup instructions, please see the [CONTRIBUTING.md](CONTRIBUTING.md) guide.

### Quick Start:

1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-username/Rag-Notes-GPT.git
   cd Rag-Notes-GPT
   npm install
   ```
2. **Environment**:
   Copy `.env.example` to `.env` and paste your Google Gemini API Key:
   ```bash
   GEMINI_API_KEY=your-gemini-key
   ```
3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Local AI Setup

To run Local AI offline without consuming any cloud tokens:

### 1. Using Ollama (Recommended)
1. Download and start [Ollama](https://ollama.com).
2. Download a model:
   ```bash
   ollama run deepseek-r1:8b
   # Or a smaller model:
   ollama run gemma2:2b
   ```
3. Open settings in the app dashboard, select **Ollama** as your Local Engine, enter the model name (`deepseek-r1:8b`), and verify connection status.

### 2. Using WebLLM (WebGPU)
1. Open settings in the app.
2. Select **WebLLM** as your Local Engine.
3. Select a model version (e.g. `Phi-3-Mini` or `Gemma-2B`). The app will cache weights in your browser local cache and run inference offline using WebGPU.

---

## Deployed Link to access Cloud: https://rag-campus-gpt-kcu56w4ltq-uc.a.run.app

## Recent Improvements & Optimizations

We recently performed a comprehensive codebase quality audit and implemented several performance, stability, and UX optimizations:

- **🚀 70%+ Faster Study Kit Generation** — Consolidated the study kit compiler from 4 sequential LLM requests with 12-second sleep delays into a **single structured request** (for both cloud and local engines). This cuts generation time from 60 seconds down to under 15 seconds, reduces token costs, and avoids API rate limits.
- **⚡ High-Efficiency Vector Search** — Optimized cloud RAG queries in `vector-store.ts` to use Firestore `.select()` to retrieve only chunk metadata and embedding arrays. Similarity calculation is done in memory, and the heavy text `content` is fetched via point reads *only* for the top-K chunks, drastically reducing network egress bandwidth.
- **🛠️ Firestore Batch Limits Fixes** — Added automatic partition logic in `vector-store.ts` to chunk Firestore batch writes and deletes into groups of 500 items, resolving transaction failures when processing documents with more than 500 chunks.
- **🎯 Robust JSON Extraction** — Implemented index-of braces matching (`{` to `}`) to extract valid JSON blocks from LLM responses, eliminating parsing crashes when Gemini includes conversational introduction or conclusion text.
- **💻 Local AI session optimization** — Streamlined Chrome's `window.ai` Nano model session creation in `local-ai.ts` by keeping the creation-time system prompt short and static, and moving the retrieved context segments into the user query. This avoids Gemini Nano session instantiation failures.
- **📱 Polished Brutalist UI & UX Controls**:
  - **Interruption Controls** — Integrated `AbortController` in `ChatInterface.tsx` to let users immediately cancel hanging or slow cloud/local AI queries.
  - **Isolated Settings Inputs** — Saved typing overhead in `SettingsModal.tsx` by using local React states for the Ollama configuration text fields, which only sync to parent and `localStorage` on clicking **"APPLY CHANGES"** or successfully testing connections.
  - **Thematic Dialogs** — Replaced native browser `confirm`/`alert` popups for database wipes with a clean styled retro-brutalist modal overlay.
  - **File Validation** — Added file type checks on upload in `DocumentPanel.tsx` to prevent invalid files from crashing Tesseract OCR in local mode.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).

