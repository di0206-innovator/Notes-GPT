'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Loader2,
  BookOpen,
  MessageSquare,
  Columns,
  UploadCloud,
  Globe,
  Cpu,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatInterface from '@/components/ChatInterface';
import DocumentPanel from '@/components/DocumentPanel';
import StudyWorkspace from '@/components/StudyWorkspace';
import { StudyKit } from '@/lib/study-generator';
import { getLocalStudyKit, getLocalChunks } from '@/lib/indexed-db-store';
import { generateLocalStudyKit, getLocalAISupport } from '@/lib/local-ai';

export default function ChatPageClient() {
  const [showPanel, setShowPanel] = useState(true);
  const [studyKit, setStudyKit] = useState<StudyKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'split' | 'workspace' | 'chat'>('split');
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [mode, setMode] = useState<'cloud' | 'local'>('cloud');
  const [sessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('campus-gpt-session-id');
      if (!sid) {
        sid = typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'session_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('campus-gpt-session-id', sid);
      }
      return sid;
    }
    return '';
  });
  const [localAISupport, setLocalAISupport] = useState<{ available: boolean; message: string }>({
    available: false,
    message: 'Checking...',
  });

  // Check browser local AI support on mount
  useEffect(() => {
    const checkLocalAI = async () => {
      try {
        const support = await getLocalAISupport();
        setLocalAISupport(support);
        if (support.available) {
          // If Gemini Nano is ready, auto-select local mode to save tokens/energy
          setMode('local');
        }
      } catch (e) {
        console.error('Failed to query local AI support:', e);
      }
    };
    checkLocalAI();
  }, []);

  const fetchStudyKit = useCallback(async (activeMode = mode, activeSessionId = sessionId) => {
    setLoading(true);
    try {
      if (activeMode === 'local') {
        const kit = await getLocalStudyKit() as StudyKit | null;
        setStudyKit(kit);
      } else {
        const res = await fetch('/api/study-materials', {
          headers: {
            'x-session-id': activeSessionId,
          },
        });
        const data = await res.json();
        if (data.studyKit) {
          setStudyKit(data.studyKit as StudyKit);
        } else {
          setStudyKit(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch study kit:', error);
    } finally {
      setLoading(false);
    }
  }, [mode, sessionId]);

  // Re-fetch study kit when mode or sessionId changes
  useEffect(() => {
    if (sessionId) {
      Promise.resolve().then(() => {
        fetchStudyKit(mode, sessionId);
      });
    }
  }, [mode, sessionId, fetchStudyKit]);

  async function handleGenerateStudyKit() {
    setIsGenerating(true);
    setGenStep('Initializing Study Generation...');

    if (mode === 'local') {
      try {
        const chunks = await getLocalChunks();
        if (chunks.length === 0) {
          throw new Error('Please upload at least one document before generating study materials.');
        }

        const kit = await generateLocalStudyKit(chunks, (step) => {
          setGenStep(step);
        });

        setStudyKit(kit as unknown as StudyKit);
        setLayoutMode('split');
      } catch (error) {
        const err = error as Error;
        alert(err.message || 'Generation failed.');
      } finally {
        setIsGenerating(false);
        setGenStep('');
      }
    } else {
      // Simulate steps for Cloud mode
      const steps = [
        'Reading uploaded PDF text & Note images...',
        'Running OpenAI OCR Vision on scans...',
        'Chunking and indexing material...',
        'Structuring chapter-wise Revision Notes...',
        'Compiling MCQ & Short Answer Q&A Bank...',
        'Creating interactive Memory Flashcards...',
        'Drafting mock exam papers & answer keys...',
        'Assembling final Study Prep Workspace...'
      ];

      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < steps.length) {
          setGenStep(steps[stepIdx]);
          stepIdx++;
        }
      }, 3500);

      try {
        const res = await fetch('/api/study-materials', {
          method: 'POST',
          headers: {
            'x-session-id': sessionId,
          },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to generate study kit.');
        }

        setStudyKit(data.studyKit);
        setLayoutMode('split');
      } catch (error) {
        const err = error as Error;
        alert(err.message || 'Generation failed.');
      } finally {
        clearInterval(interval);
        setIsGenerating(false);
        setGenStep('');
      }
    }
  }

  const handleDocumentChange = () => {
    setRefreshCounter((prev) => prev + 1);
    fetchStudyKit(mode, sessionId);
  };

  return (
    <div className="flex h-screen bg-[#0A0A0B] overflow-hidden text-slate-100 font-sans">
      {/* Document Sidebar (collapsible) */}
      {showPanel && (
        <aside className="w-80 border-r border-white/10 bg-[#0F0F12]/80 backdrop-blur-xl p-4 flex flex-col h-full flex-shrink-0">
          <DocumentPanel
            onGenerateStudyKit={handleGenerateStudyKit}
            isGeneratingStudyKit={isGenerating}
            hasStudyKit={!!studyKit}
            refreshCounter={refreshCounter}
            onRefresh={handleDocumentChange}
            mode={mode}
            sessionId={sessionId}
          />
        </aside>
      )}

      {/* Main Study Arena */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0F0F12]/30 backdrop-blur-md z-10 gap-3 md:gap-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 text-slate-400 hover:text-white transition-all shadow-sm"
              title={showPanel ? 'Hide documents' : 'Show documents'}
            >
              {showPanel ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">CampusStudy<span className="gradient-text">GPT</span></span>
              <span className="text-[10px] font-semibold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
                Exam Prep RAG
              </span>
            </div>
          </div>

          {/* Hybrid Mode Toggle Segment Control */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setMode('cloud')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all ${
                mode === 'cloud'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cloud SaaS Mode (High performance, OpenAI APIs)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Cloud Mode</span>
            </button>
            <button
              onClick={() => setMode('local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all relative ${
                mode === 'local'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={
                localAISupport.available
                  ? 'Local Device Mode (Runs locally on browser, offline, 0-tokens)'
                  : 'Local Device Mode (Chrome Built-in AI not active)'
              }
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Local Mode</span>
              {localAISupport.available && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping border border-slate-950" />
              )}
            </button>
          </div>

          {/* View Toggles (Only show if study kit exists) */}
          {studyKit && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setLayoutMode('workspace')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  layoutMode === 'workspace'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Workspace Only"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Workspace</span>
              </button>
              <button
                onClick={() => setLayoutMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  layoutMode === 'split'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Split Screen"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Split View</span>
              </button>
              <button
                onClick={() => setLayoutMode('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  layoutMode === 'chat'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Chat Assistant Only"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Chat</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex min-h-0 p-4 gap-4 overflow-hidden relative">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading Workspace...</p>
            </div>
          ) : !studyKit ? (
            /* EMPTY STATE: Force full width placeholder & Chat side-by-side */
            <div className="flex-1 grid lg:grid-cols-2 gap-4 h-full">
              {/* Left Placeholder Card */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-white/10 bg-slate-900/10 backdrop-blur-sm text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 border border-purple-500/20">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Create Your Study Workspace</h3>
                <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
                  Upload PDF lecture notes or handwritten image notes in the left panel, then click &ldquo;Generate Study Kit&rdquo; to build your exam prep material.
                </p>
                <button
                  onClick={handleGenerateStudyKit}
                  disabled={isGenerating}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Generate Study Kit
                </button>
              </div>

              {/* Right Chat companion */}
              <div className="h-full min-h-0">
                <ChatInterface mode={mode} sessionId={sessionId} />
              </div>
            </div>
          ) : (
            /* WORKSPACE LOADED: Flexible responsive columns */
            <div className="flex-1 flex gap-4 min-h-0 h-full overflow-hidden relative">
              {/* Workspace column */}
              {(layoutMode === 'workspace' || layoutMode === 'split') && (
                <div className={`h-full min-h-0 flex flex-col transition-all duration-300 ${
                  layoutMode === 'split' ? 'w-full lg:w-[55%] flex-shrink-0' : 'w-full'
                }`}>
                  <StudyWorkspace
                    studyKit={studyKit}
                    onRegenerate={handleGenerateStudyKit}
                    isGenerating={isGenerating}
                  />
                </div>
              )}

              {/* Chat column */}
              {(layoutMode === 'chat' || layoutMode === 'split') && (
                <div className={`h-full min-h-0 flex flex-col transition-all duration-300 ${
                  layoutMode === 'split' ? 'w-full lg:w-[45%] flex-shrink-0' : 'w-full'
                }`}>
                  <ChatInterface mode={mode} sessionId={sessionId} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Loading / Generating Overlay */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A0A0B]/90 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-md"
            >
              <div className="max-w-md w-full flex flex-col items-center text-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-500/25 border-t-purple-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Generating Study Kit</h3>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Analyzing, compiling and transforming your study resources into high-yield exam material. This may take up to a minute...
                  </p>
                </div>

                {/* Simulated Loading Step */}
                <div className="w-full bg-slate-900 border border-white/5 rounded-xl p-3.5">
                  <span className="text-xs font-mono text-purple-400">{genStep}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
