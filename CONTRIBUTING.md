# Contributing to CampusStudyGPT 📚

First off, thank you for considering contributing to CampusStudyGPT! It's people like you who make this project such a great local-first RAG learning utility.

Please take a moment to review this document to ensure a smooth development setup and contribution process.

---

## 🛠️ Developer Environment Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher is required.
- **Package Manager**: npm (bundled with Node.js).
- **Local LLM Engine (Optional)**: Ollama (highly recommended for local mode development on macOS/Windows).

### 2. Initial Setup
Clone the repository and install the development dependencies:
```bash
git clone https://github.com/your-username/Rag-Campus-GPT.git
cd Rag-Campus-GPT
npm install
```

### 3. Environment Configuration
Copy the template `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and configure your API key for Cloud Mode (using Gemini 2.0 Flash and Firestore vectors):
- `GEMINI_API_KEY`: Get your free/paid key from [Google AI Studio](https://aistudio.google.com/).

### 4. Running the App
Launch the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port specified in terminal) to view the application.

---

## 🧠 Local AI Engine Setup (Offline Mode)

CampusStudyGPT supports three different local engines for on-device inference:

### Option A: Ollama Local Server (Recommended for Desktop Devs)
1. Install Ollama by downloading it from [ollama.com](https://ollama.com) or running:
   ```bash
   brew install ollama
   ```
2. Pull the default model in your terminal:
   ```bash
   ollama run deepseek-r1:8b
   # Or a lighter weight model:
   ollama run gemma2:2b
   ```
3. Open Settings in the app, set **Local AI Engine Type** to **Ollama**, and set the model name (e.g. `deepseek-r1:8b`). Click **Test Connection** to verify.

### Option B: WebLLM (In-Browser WebGPU)
1. Ensure you are developing in a WebGPU-compatible browser (Chrome 113+, Edge 113+, Safari 18+).
2. Open Settings, set **Local AI Engine Type** to **WebLLM**, and select a model (e.g. `Phi-3-Mini` or `Gemma-2B`).
3. The weights will download and compile to WebGPU shaders dynamically in the browser Cache Storage when running local queries.

### Option C: Chrome Built-in AI (Gemini Nano)
1. Open Chrome and go to `chrome://flags`.
2. Set **Prompt API for Gemini Nano** to **Enabled**.
3. Set **Enables optimization guide on device** to **Enabled BypassPerfRequirement**.
4. Restart Chrome and wait for Chrome to download the model background service (~1.7GB).

---

## 📐 Code Style and Standards

To maintain code readability and prevent build failures:

### Formatting & Linting
We use ESLint for static analysis and type checking. Run the check before making commits:
```bash
npm run lint
```
*Note: Ensure there are no warnings or errors before pushing code. Avoid explicit `any` types unless monkey-patching external libraries (which should be preceded by an eslint ignore comment).*

### Production Compilation
Next.js strict type check runs on compile. Ensure the build completes successfully:
```bash
npm run build
```

---

## 🤝 Submitting Contributions

1. **Fork** the repository and create your branch from `main`.
2. Make your changes, following existing code patterns (monochrome brutalist UI, type safety, modular utility directories).
3. Verify changes with `npm run lint` and `npm run build`.
4. Submit a **Pull Request** detailing:
   - What functionality was added, fixed, or modified.
   - Any new dependencies introduced.
   - Verification logs (linting outputs, local console logs).
