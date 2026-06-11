'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Layers, HelpCircle, FileSignature, Terminal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function Home() {
  const [history, setHistory] = useState<Message[]>([]);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'manual' | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('notes_gpt_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTimeout(() => {
            setHistory(parsed);
          }, 0);
        }
      } catch (e) {
        console.error('Failed to parse chat history:', e);
      }
    }

    const savedSettings = localStorage.getItem('notes_gpt_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed && typeof parsed.effectsEnabled === 'boolean') {
          setTimeout(() => {
            setEffectsEnabled(parsed.effectsEnabled);
          }, 0);
        }
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  // Filter out system messages and default greeting if other messages exist
  const displayHistory = history.filter((msg, idx) => {
    if (msg.role === 'system') return false;
    if (idx === 0 && msg.role === 'assistant' && history.length > 1) return false;
    return true;
  }).slice(-4); // Keep last 4 messages

  return (
    <div className={`min-h-screen bg-black text-white font-mono relative overflow-hidden flex flex-col justify-between ${effectsEnabled ? 'crt-power' : ''}`}>
      {/* CRT scanline overlay */}
      {effectsEnabled && <div className="crt-overlay" />}

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full border-b-2 border-white bg-black">
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <Terminal className="w-5 h-5 text-white" />
          <span className="text-sm font-bold uppercase tracking-widest text-white">
            [ NOTES_GPT ]
          </span>
        </Link>

        <Link
          href="/chat"
          className="retro-button bg-white text-black text-xs font-bold px-5 py-2.5 hover:bg-black hover:text-white"
        >
          [ ENTER SYSTEM ]
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-8 pt-16 pb-20 flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Banner Tag */}
        <div className="border border-white/50 bg-white/5 px-4 py-1.5 text-[9px] font-bold text-white uppercase tracking-widest mb-8 animate-flash">
          {"// ACADEMIC RAG TERMINAL V1.0.0 INITIALIZED //"}
        </div>

        {/* Big Brutalist Monospace Header */}
        <h1 className={`text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-6 leading-tight max-w-4xl select-none cursor-default ${effectsEnabled ? 'glitch-hover' : ''}`}>
          COMPILE TEXTBOOKS & NOTES.<br />
          ACE YOUR EXAMS.
        </h1>

        {/* ASCII Accent */}
        <pre className="text-[8px] text-white/50 select-none overflow-x-auto whitespace-pre pb-6 leading-none font-mono">
{`+-------------------------------------------------------+
|  [PDF_INDEXER] ========> [EMBED_MODEL] ========> [QA]  |
+-------------------------------------------------------+`}
        </pre>

        <p className="text-xs md:text-sm text-white/80 max-w-xl mb-10 leading-relaxed uppercase">
          Upload course textbooks, slide decks, or handwritten notes. Instantly compile structured revision sheets, active recall flashcards, and university-style exams strictly grounded in your materials. Supports offline on-device inference via Chrome built-in Gemini Nano.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center w-full max-w-md">
          <Link
            href="/chat"
            className="retro-button w-full sm:w-auto px-10 py-4 text-sm font-bold retro-shadow text-center flex items-center justify-center gap-3 bg-white text-black border-2 border-white hover:bg-black hover:text-white"
          >
            <span>[ INITIALIZE PREPARATION ]</span>
            <Terminal className="w-4 h-4" />
          </Link>
        </div>

        {/* Chat History Panel */}
        {displayHistory.length > 0 && (
          <div className={`w-full max-w-2xl mt-12 border-2 border-white bg-black p-6 text-left brutalist-pop ${effectsEnabled ? 'reveal-card reveal-card-delay-4' : ''}`}>
            <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-white animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  [ CHAT_SESSION_HISTORY_LOGS ]
                </span>
              </div>
              <button
                onClick={() => {
                  if (confirm("Wipe all saved chat history logs? This cannot be undone.")) {
                    localStorage.removeItem("notes_gpt_chat_history");
                    setHistory([]);
                  }
                }}
                className="text-[9px] border border-white/40 px-2 py-0.5 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors uppercase font-bold"
              >
                [ PURGE ]
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar text-[11px]">
              {displayHistory.map((msg, idx) => (
                <div key={idx} className="border-l-2 border-white/30 pl-3 py-1">
                  <span className={`font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-white/80' : 'text-green-400'}`}>
                    {msg.role === 'user' ? '> USER' : '> COGNITIVE_ENGINE'}
                  </span>
                  <p className="text-white/60 mt-1 line-clamp-2 uppercase">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/20 text-center">
              <Link
                href="/chat"
                className="text-xs font-bold hover:underline uppercase text-white"
              >
                {"[ CONTINUE ACTIVE TERMINAL SESSION -> ]"}
              </Link>
            </div>
          </div>
        )}

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-20 w-full">
          {/* Notes Card */}
          <div className={`border-2 border-white bg-black p-6 text-left group hover:bg-white hover:text-black transition-all brutalist-pop ${effectsEnabled ? 'reveal-card reveal-card-delay-1' : ''}`}>
            <div className="w-8 h-8 border border-white group-hover:border-black flex items-center justify-center mb-6">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-bold uppercase mb-2">{"// REVISION NOTES"}</h3>
            <p className="opacity-70 text-[10px] uppercase leading-relaxed">
              Synthesizes PDFs and note images into topic summaries, complete with formulas, definitions, and LaTeX equations.
            </p>
          </div>

          {/* Flashcards Card */}
          <div className={`border-2 border-white bg-black p-6 text-left group hover:bg-white hover:text-black transition-all brutalist-pop ${effectsEnabled ? 'reveal-card reveal-card-delay-2' : ''}`}>
            <div className="w-8 h-8 border border-white group-hover:border-black flex items-center justify-center mb-6">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-bold uppercase mb-2">{"// ACTIVE RECALL"}</h3>
            <p className="opacity-70 text-[10px] uppercase leading-relaxed">
              Auto-generates study flashcards for critical terms and principles. Simple monochrome interactive flip panels.
            </p>
          </div>

          {/* Questions Card */}
          <div className={`border-2 border-white bg-black p-6 text-left group hover:bg-white hover:text-black transition-all brutalist-pop ${effectsEnabled ? 'reveal-card reveal-card-delay-3' : ''}`}>
            <div className="w-8 h-8 border border-white group-hover:border-black flex items-center justify-center mb-6">
              <HelpCircle className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-bold uppercase mb-2">{"// PREDICTED Q&AS"}</h3>
            <p className="opacity-70 text-[10px] uppercase leading-relaxed">
              Generates MCQ pools, short definition tests, and deep essay prompts with grading answer keys.
            </p>
          </div>

          {/* Exam Simulator Card */}
          <div className={`border-2 border-white bg-black p-6 text-left group hover:bg-white hover:text-black transition-all brutalist-pop ${effectsEnabled ? 'reveal-card reveal-card-delay-4' : ''}`}>
            <div className="w-8 h-8 border border-white group-hover:border-black flex items-center justify-center mb-6">
              <FileSignature className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-bold uppercase mb-2">{"// MOCK SIMULATOR"}</h3>
            <p className="opacity-70 text-[10px] uppercase leading-relaxed">
              Assembles university-style mock tests with grading rubrics. Plain layout styles for clean physical printing.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t-2 border-white py-8 px-8 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-white/50 text-[10px] uppercase gap-4 md:gap-0 font-mono">
          <div className="flex flex-col gap-1.5">
            <p>© 2026 NotesGPT. SECURE INTERNAL SYSTEM HOSTED LOCALLY.</p>
            <p className="text-white font-bold tracking-wider">[ PROJECT BY DIVYANSHU SINHA ]</p>
          </div>
          <div className="flex space-x-6">
            <button onClick={() => setActiveModal('privacy')} className="hover:text-white underline cursor-pointer">PRIVACY</button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-white underline cursor-pointer">TERMS</button>
            <button onClick={() => setActiveModal('manual')} className="hover:text-white underline cursor-pointer">MANUAL</button>
          </div>
        </div>
      </footer>

      {/* Retro Info Modal Overlay */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-2xl border-2 border-white bg-black p-6 retro-shadow text-white relative flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-white pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    [ NotesGPT_HELP_SHELL: {activeModal} ]
                  </span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 border border-transparent hover:border-white text-white transition-all cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto pr-2 custom-scrollbar text-xs leading-relaxed space-y-4 uppercase flex-1">
                {activeModal === 'manual' && (
                  <div className="space-y-4">
                    <h2 className="font-bold border-b border-white/20 pb-1 text-white"># USER MANUAL & WORKSTATION GUIDE</h2>
                    <p className="text-white/80">
                      NotesGPT is an offline-capable Retrieval-Augmented Generation (RAG) assistant designed to synthesize notes, textbooks, and documents into study kits.
                    </p>
                    
                    <div className="space-y-2">
                      <h3 className="font-bold text-green-400">// 1. DOCUMENT INGESTION</h3>
                      <p className="text-white/70">
                        Upload PDF textbooks or note images (PNG/JPG). In Local Mode, text is extracted privately in your browser using PDF.js and Tesseract OCR. In Cloud Mode, files are securely parsed on the server using Gemini Generative Vision.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-green-400">// 2. COGNITIVE ENGINE MODES</h3>
                      <ul className="list-disc pl-4 space-y-1 text-white/70">
                        <li><strong>CLOUD MODE:</strong> Uses Google Gemini 1.5 Flash for high-speed indexing, search embeddings, and complex study kit generations. RAG chunks are stored securely in your private Firestore sandbox.</li>
                        <li><strong>LOCAL MODE (100% PRIVATE):</strong> Runs completely offline. Select from:
                          <ul className="list-circle pl-4 mt-1 space-y-1">
                            <li><strong>Ollama:</strong> Runs models like DeepSeek-R1 or Gemma2 using your local background daemon.</li>
                            <li><strong>WebLLM:</strong> Compiles and runs model weights directly in the browser sandbox using WebGPU.</li>
                            <li><strong>window.ai:</strong> Probes experimental built-in Chrome Gemini Nano support.</li>
                          </ul>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-green-400">// 3. GENERATED KITS</h3>
                      <p className="text-white/70">
                        Once compiled, your workspace lists summary notes, LaTeX-supported equations, interactive flip flashcards, practice questions with keys, and print-ready mock exams.
                      </p>
                    </div>
                  </div>
                )}

                {activeModal === 'terms' && (
                  <div className="space-y-4">
                    <h2 className="font-bold border-b border-white/20 pb-1 text-white"># TERMS OF SERVICE</h2>
                    <p className="text-white/80">
                      By accessing the NotesGPT RAG workstation, you agree to comply with the following policies:
                    </p>
                    <div className="space-y-2 text-white/70">
                      <p>1. <strong>LICENSE:</strong> NotesGPT is licensed under the MIT open-source license. You may use, copy, modify, and distribute the workstation code for academic and personal use.</p>
                      <p>2. <strong>INTELLECTUAL PROPERTY:</strong> You retain full ownership of all notes, PDF textbooks, and materials you upload. The system does not claim ownership or rights to any of your intellectual work.</p>
                      <p>3. <strong>ACADEMIC INTEGRITY:</strong> NotesGPT is built as a study aid for learning, comprehension, and test preparation. Users are solely responsible for ensuring that their use aligns with their university academic code of conduct.</p>
                    </div>
                  </div>
                )}

                {activeModal === 'privacy' && (
                  <div className="space-y-4">
                    <h2 className="font-bold border-b border-white/20 pb-1 text-white"># PRIVACY POLICY</h2>
                    <p className="text-white/80">
                      NotesGPT treats user privacy as a critical system architecture requirement.
                    </p>
                    <div className="space-y-2 text-white/70">
                      <p>1. <strong>LOCAL MODE PRIVACY:</strong> When running in Local Mode (Ollama or WebLLM), your documents, chunks, and database records remain entirely inside your browser's IndexedDB and local memory. No data is transmitted to external servers.</p>
                      <p>2. <strong>CLOUD MODE PRIVACY:</strong> In Cloud Mode, your uploaded files are securely chunked and indexed in private Firestore databases isolated by your authenticated UID. Network transit is protected via TLS HTTPS encryption, and documents are only processed by Google Gemini APIs to satisfy study kit requests.</p>
                      <p>3. <strong>WIPING RECORDS:</strong> You retain complete control over your data. You can delete individual documents, or trigger a full purge by clicking "WIPE ALL SYSTEM DATA" in your Profile panel, which instantly clears both IndexedDB and Firestore collections.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-dashed border-white/20 pt-3 text-[10px] text-white/40 text-center uppercase mt-4">
                NotesGPT SECURE WORKSTATION HELPDESK
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
