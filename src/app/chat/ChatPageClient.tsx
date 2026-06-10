'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  MessageSquare,
  Columns,
  UploadCloud,
  Globe,
  Cpu,
  LogOut,
  Terminal,
  Settings,
  User,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatInterface from '@/components/ChatInterface';
import DocumentPanel from '@/components/DocumentPanel';
import StudyWorkspace from '@/components/StudyWorkspace';
import AuthGate from '@/components/AuthGate';
import SettingsModal from '@/components/SettingsModal';
import ProfileModal from '@/components/ProfileModal';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { StudyKit } from '@/lib/study-generator';
import { getLocalStudyKit, getLocalChunks, clearLocalStore } from '@/lib/indexed-db-store';
import { generateLocalStudyKit, getLocalAISupport } from '@/lib/local-ai';

export default function ChatPageClient() {
  const [showPanel, setShowPanel] = useState(true);
  const [studyKit, setStudyKit] = useState<StudyKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'split' | 'workspace' | 'chat'>('split');
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [mode, setMode] = useState<'cloud' | 'local'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('campus_study_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.defaultMode === 'local' ? 'local' : 'cloud';
        }
      } catch (e) {
        console.error('Failed to parse stored defaultMode settings:', e);
      }
    }
    return 'cloud';
  });

  // Authentication State
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [localAISupport, setLocalAISupport] = useState<{ available: boolean; message: string }>({
    available: false,
    message: 'Checking...',
  });

  // User Configurable Settings
  const [settings, setSettings] = useState<{
    theme: 'dark' | 'light';
    topK: number;
    temperature: number;
    defaultMode: 'cloud' | 'local';
    localProvider: 'window-ai' | 'ollama' | 'web-llm';
    ollamaUrl: string;
    ollamaModel: string;
    webLlmModel: string;
  }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('campus_study_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            theme: parsed.theme === 'light' ? 'light' : 'dark',
            topK: typeof parsed.topK === 'number' ? parsed.topK : 5,
            temperature: typeof parsed.temperature === 'number' ? parsed.temperature : 0.2,
            defaultMode: parsed.defaultMode === 'local' ? 'local' : 'cloud',
            localProvider: parsed.localProvider || 'window-ai',
            ollamaUrl: parsed.ollamaUrl || 'http://localhost:11434',
            ollamaModel: parsed.ollamaModel || 'deepseek-r1:8b',
            webLlmModel: parsed.webLlmModel || 'Phi-3-mini-4k-instruct-q4f16-1K-MLC',
          };
        }
      } catch (e) {
        console.error('Failed to parse stored settings:', e);
      }
    }
    return {
      theme: 'dark',
      topK: 5,
      temperature: 0.2,
      defaultMode: 'cloud',
      localProvider: 'window-ai',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'deepseek-r1:8b',
      webLlmModel: 'Phi-3-mini-4k-instruct-q4f16-1K-MLC',
    };
  });

  // Modal display toggles
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Apply CSS Class for Theme
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [settings.theme]);

  const handleUpdateSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    setMode(newSettings.defaultMode);
    try {
      localStorage.setItem('campus_study_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  // Listen for Firebase Authentication changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Check browser local AI support when settings or provider changes
  useEffect(() => {
    const checkLocalAI = async () => {
      try {
        const support = await getLocalAISupport(settings);
        setLocalAISupport(support);
      } catch (e) {
        console.error('Failed to query local AI support:', e);
      }
    };
    checkLocalAI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.localProvider, settings.ollamaUrl, settings.ollamaModel, settings.webLlmModel]);

  const fetchStudyKit = useCallback(async (activeMode = mode, activeSessionId = userId) => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      if (activeMode === 'local') {
        const kit = await getLocalStudyKit() as StudyKit | null;
        setStudyKit(kit);
      } else {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/study-materials', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
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
  }, [mode, userId]);

  // Re-fetch study kit when mode or userId changes
  useEffect(() => {
    if (userId) {
      let active = true;
      Promise.resolve().then(() => {
        if (active) {
          fetchStudyKit(mode, userId);
        }
      });
      return () => {
        active = false;
      };
    }
  }, [mode, userId, fetchStudyKit]);

  async function handleGenerateStudyKit() {
    if (!userId) return;
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
        }, settings);

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
      // Steps for Cloud mode
      const steps = [
        'Reading uploaded PDF text & Note images...',
        'Running Gemini Generative Vision on scans...',
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
      }, 2500);

      try {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/study-materials', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
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
    fetchStudyKit(mode, userId);
  };

  const handleLogout = async () => {
    try {
      await clearLocalStore().catch((e) => console.error('IndexedDB clear error:', e));
      await signOut(auth);
      setStudyKit(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Render Auth Gate if user is not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono">
        <div className="crt-overlay" />
        <span className="text-sm font-bold text-white animate-flash">[ INITIALIZING SECURE SHELL... ]</span>
      </div>
    );
  }

  if (!userId) {
    return <AuthGate onAuthenticated={(uid) => setUserId(uid)} />;
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden text-white font-mono relative">
      <div className="crt-overlay" />

      {/* Document Sidebar (collapsible) */}
      {showPanel && (
        <aside className="w-80 border-r-2 border-white bg-black p-4 flex flex-col h-full flex-shrink-0 relative z-10">
          <DocumentPanel
            onGenerateStudyKit={handleGenerateStudyKit}
            isGeneratingStudyKit={isGenerating}
            hasStudyKit={!!studyKit}
            refreshCounter={refreshCounter}
            onRefresh={handleDocumentChange}
            mode={mode}
            sessionId={userId}
          />
        </aside>
      )}

      {/* Main Study Arena */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b-2 border-white bg-black gap-3 md:gap-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="retro-button py-1 px-2.5 text-xs flex items-center justify-center"
              title={showPanel ? 'Hide documents' : 'Show documents'}
            >
              {showPanel ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-sm font-bold tracking-tight text-white uppercase">[ CAMPUS_STUDY_GPT ]</span>
              <span className="text-[9px] font-bold border border-white px-2 py-0.5 bg-black">
                RAG_COMPILER
              </span>
            </Link>
          </div>

          {/* Hybrid Mode Toggle Segment Control */}
          <div className="flex items-center gap-1 border border-white p-1 bg-black">
            <button
              onClick={() => setMode('cloud')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase transition-all retro-button border-none ${
                mode === 'cloud'
                  ? 'bg-white text-black'
                  : 'text-white bg-black hover:bg-white/10'
              }`}
              title="Cloud SaaS Mode (High performance, Gemini 2.5 API)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Cloud</span>
            </button>
            <button
              onClick={() => setMode('local')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase transition-all retro-button border-none relative ${
                mode === 'local'
                  ? 'bg-white text-black'
                  : 'text-white bg-black hover:bg-white/10'
              }`}
              title={
                localAISupport.available
                  ? 'Local Device Mode (Runs locally on browser, offline, 0-tokens)'
                  : 'Local Device Mode (Chrome Built-in AI not active)'
              }
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Local</span>
              {localAISupport.available && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white border border-black animate-ping" />
              )}
            </button>
          </div>

          {/* Layout & Session Control (Logout) */}
          <div className="flex items-center gap-2">
            {/* View Toggles (Only show if study kit exists) */}
            {studyKit && (
              <div className="flex items-center gap-1 border border-white p-1 bg-black">
                <button
                  onClick={() => setLayoutMode('workspace')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase retro-button border-none ${
                    layoutMode === 'workspace' ? 'bg-white text-black' : 'text-white bg-black'
                  }`}
                  title="Workspace Only"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Workspace</span>
                </button>
                <button
                  onClick={() => setLayoutMode('split')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase retro-button border-none ${
                    layoutMode === 'split' ? 'bg-white text-black' : 'text-white bg-black'
                  }`}
                  title="Split Screen"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Split</span>
                </button>
                <button
                  onClick={() => setLayoutMode('chat')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase retro-button border-none ${
                    layoutMode === 'chat' ? 'bg-white text-black' : 'text-white bg-black'
                  }`}
                  title="Chat Assistant Only"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Chat</span>
                </button>
              </div>
            )}

            {/* Profile Button */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="retro-button py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold"
              title="View User Profile"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">PROFILE</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="retro-button py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold"
              title="Open System Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">SETTINGS</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="retro-button py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold hover:bg-red-600 hover:text-white hover:border-red-600"
              title="Terminate Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">EXIT</span>
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex min-h-0 p-4 gap-4 overflow-hidden relative">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <span className="text-xs text-white animate-flash">[ INITIATING STUDY DESK... ]</span>
            </div>
          ) : !studyKit ? (
            /* EMPTY STATE: Force full width placeholder & Chat side-by-side */
            <div className="flex-1 grid lg:grid-cols-2 gap-4 h-full">
              {/* Left Placeholder Card */}
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white bg-black text-center">
                <div className="w-14 h-14 border-2 border-white flex items-center justify-center text-white mb-6 retro-shadow-black bg-black">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-md font-bold text-white mb-2 uppercase tracking-wide">
                  [ COMPILE STUDY WORKSPACE ]
                </h3>
                <p className="text-xs text-white/70 max-w-sm mb-6 leading-relaxed uppercase">
                  Index lecture materials or image note files on the left, then click &ldquo;Compile Study Kit&rdquo; to generate revision notes, question banks, and simulated exams.
                </p>
                <button
                  onClick={handleGenerateStudyKit}
                  disabled={isGenerating}
                  className="retro-button py-3 px-6 text-xs font-bold retro-shadow"
                >
                  COMPILE STUDY KIT
                </button>
              </div>

              {/* Right Chat companion */}
              <div className="h-full min-h-0">
                <ChatInterface mode={mode} temperature={settings.temperature} topK={settings.topK} settings={settings} />
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
                  <ChatInterface mode={mode} temperature={settings.temperature} topK={settings.topK} settings={settings} />
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
              className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-8"
            >
              <div className="max-w-md w-full border-2 border-white bg-black p-6 retro-shadow flex flex-col items-center text-center gap-6">
                <div className="relative">
                  <Terminal className="w-8 h-8 text-white animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    [ COMPILING STUDY COMPANION ]
                  </h3>
                  <p className="text-[10px] text-white/60 leading-normal uppercase">
                    Analyzing study resources, compiling and structuring revision assets. Estimated compilation time: 10-30 seconds.
                  </p>
                </div>

                {/* Loading Step Console */}
                <div className="w-full border border-white/30 bg-black p-3.5 text-left">
                  <span className="text-[10px] font-mono text-white/50 block mb-1">STDOUT_MONITOR:</span>
                  <span className="text-[10px] font-mono text-white font-bold animate-flash">
                    &gt; {genStep}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSettingsOpen && (
            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isProfileOpen && (
            <ProfileModal
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              userId={userId}
              mode={mode}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
