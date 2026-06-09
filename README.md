# CampusStudyGPT 📚

An AI-powered, offline-capable study companion that transforms your PDFs, textbooks, and handwritten notes into structured revision materials, flashcards, question banks, and mock exams. Works like NotebookLM — but runs locally on your device or in-browser.

---

## Key Features

- **📄 Robust Document Ingestion** — Upload textbook PDFs and note images (PNG/JPG/WEBP). Extract text locally via PDF.js and Tesseract.js OCR, or on the server via Gemini Vision.
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
| **PDF Extraction** | PDF.js (Browser), pdf-parse (Node.js API) |
| **OCR Engines** | Tesseract.js (Client), Gemini Generative Vision (Server) |
| **User Identity** | Firebase Auth (Guest Sessions & Email Signups) |

---

## Setup & Run Instructions

For detailed installation and setup instructions, please see the [CONTRIBUTING.md](CONTRIBUTING.md) guide.

### Quick Start:

1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-username/Rag-Campus-GPT.git
   cd Rag-Campus-GPT
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

## License

This project is licensed under the terms of the [MIT License](LICENSE).
