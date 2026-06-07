'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  HelpCircle,
  Layers,
  FileSignature,
  AlertTriangle,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { Markdown } from './Markdown';
import { StudyKit, Flashcard } from '@/lib/study-generator';

interface StudyWorkspaceProps {
  studyKit: StudyKit;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export default function StudyWorkspace({
  studyKit,
  onRegenerate,
  isGenerating,
}: StudyWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'qna' | 'flashcards' | 'exam'>('notes');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const {
    revisionNotes,
    questionBank,
    flashcards,
    mockExam,
    answerKey,
    uncertainSections,
  } = studyKit;

  // Print function for Exam or Notes
  const handlePrint = () => {
    window.print();
  };

  const handleNextFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev + 1) % flashcards.length);
    }, 200);
  };

  const handlePrevFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 200);
  };

  const currentCard: Flashcard | undefined = flashcards?.[flashcardIndex];

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
      {/* Background glow effects */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      
      {/* Header / Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01] gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Study Workspace</h2>
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[10px] font-bold border border-purple-500/20 disabled:opacity-50 transition-all ml-2"
            title="Update Study Kit"
          >
            Update Kit
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Revision Notes
          </button>
          <button
            onClick={() => setActiveTab('qna')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'qna'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Q&A Bank
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'flashcards'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Flashcards ({flashcards?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('exam')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'exam'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" />
            Mock Exam
          </button>
        </div>
      </div>

      {/* OCR Warnings Alerts (if any) */}
      {uncertainSections && uncertainSections.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-start gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
          <div className="flex-1">
            <span className="font-semibold">OCR Alerts:</span> We found {uncertainSections.length} unclear, blurry, or handwritten sections in your notes.
            <button
              onClick={() => {
                const modal = document.getElementById('ocr-alert-modal') as HTMLDialogElement;
                if (modal) modal.showModal();
              }}
              className="ml-2 underline font-bold hover:text-amber-200 transition-colors"
            >
              Review Flagged Sections
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto print:p-0 print:bg-white print:text-black">
        <AnimatePresence mode="wait">
          {/* REVISION NOTES TAB */}
          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 max-w-4xl mx-auto print:max-w-none"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4 print:hidden">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Revision Notes Summary
                </h3>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Notes
                </button>
              </div>
              <div className="prose prose-invert max-w-none prose-sm leading-relaxed text-slate-300 print:text-black">
                <Markdown content={revisionNotes} />
              </div>
            </motion.div>
          )}

          {/* Q&A BANK TAB */}
          {activeTab === 'qna' && (
            <motion.div
              key="qna"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 max-w-4xl mx-auto print:max-w-none"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4 print:hidden">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Important Questions & Answers
                </h3>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Questions
                </button>
              </div>
              <div className="prose prose-invert max-w-none prose-sm text-slate-300 print:text-black">
                <Markdown content={questionBank} />
              </div>
            </motion.div>
          )}

          {/* FLASHCARDS TAB */}
          {activeTab === 'flashcards' && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto py-8"
            >
              {!flashcards || flashcards.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No flashcards generated for this set.</p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-8">
                  {/* Card Section */}
                  <div
                    className="w-full h-80 relative cursor-pointer"
                    style={{ perspective: 1000 }}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <motion.div
                      className="w-full h-full relative"
                      style={{ transformStyle: 'preserve-3d' }}
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {/* Front Card Face */}
                      <div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-white/10 p-8 flex flex-col justify-between shadow-xl"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                            {currentCard?.category || 'General'}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            Question
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center">
                          <h4 className="text-lg md:text-xl font-bold text-white leading-relaxed">
                            {currentCard?.front}
                          </h4>
                        </div>
                        <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                          Click card to flip
                        </div>
                      </div>

                      {/* Back Card Face */}
                      <div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-900/60 to-slate-950 border border-purple-500/20 p-8 flex flex-col justify-between shadow-xl"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {currentCard?.category || 'General'}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            Answer
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center overflow-y-auto py-4">
                          <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium">
                            {currentCard?.back}
                          </p>
                        </div>
                        <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                          Click card to flip back
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center gap-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevFlashcard();
                      }}
                      className="p-3 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-400 hover:text-white transition-all shadow-md"
                      title="Previous Card"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-mono text-slate-400 bg-slate-950/60 px-4 py-1.5 rounded-full border border-white/5">
                      {flashcardIndex + 1} / {flashcards.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextFlashcard();
                      }}
                      className="p-3 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-400 hover:text-white transition-all shadow-md"
                      title="Next Card"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* MOCK EXAM TAB */}
          {activeTab === 'exam' && (
            <motion.div
              key="exam"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-4xl mx-auto print:max-w-none"
            >
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 print:hidden">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Practice Exam Simulator
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all text-xs"
                  >
                    {showAnswerKey ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide Answer Key
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Show Answer Key
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-all text-xs shadow-lg shadow-purple-500/15"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Exam Paper
                  </button>
                </div>
              </div>

              {/* Exam Content Area */}
              <div className="space-y-8 bg-slate-950/20 border border-white/5 rounded-2xl p-8 print:border-none print:p-0 print:bg-white">
                <div className="prose prose-invert max-w-none prose-sm text-slate-300 print:text-black">
                  <Markdown content={mockExam} />
                </div>

                {showAnswerKey && (
                  <div className="border-t border-purple-500/30 pt-8 mt-12 bg-purple-950/5 p-6 rounded-2xl border border-purple-500/10 print:border-t-2 print:border-black print:mt-16">
                    <h2 className="text-xl font-bold text-purple-400 mb-6 flex items-center gap-2 print:text-black">
                      <Sparkles className="w-5 h-5 print:hidden" />
                      Answer Key & Grading Rubric
                    </h2>
                    <div className="prose prose-invert max-w-none prose-sm text-slate-300 print:text-black">
                      <Markdown content={answerKey} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OCR Uncertainties Modal Dialog */}
      <dialog id="ocr-alert-modal" className="modal bg-slate-950/90 text-white rounded-2xl border border-white/10 p-6 max-w-2xl w-full shadow-2xl backdrop:bg-black/80">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              OCR Uncertainties & Handwriting Flags
            </h3>
            <button
              onClick={() => {
                const modal = document.getElementById('ocr-alert-modal') as HTMLDialogElement;
                if (modal) modal.close();
              }}
              className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The OCR engine flagged the following text segments from your uploaded study materials as blurry, illegible, or cut-off. Please check your original physical files to ensure accuracy:
          </p>
          <div className="overflow-y-auto max-h-80 space-y-3 pr-2">
            {uncertainSections?.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-purple-400">{item.source}</span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Flagged Section
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 italic bg-black/40 p-2 rounded-lg font-mono">
                  &ldquo;...{item.excerpt}...&rdquo;
                </p>
                <div className="text-[10px] text-slate-400">
                  <span className="font-bold text-slate-300">Observation:</span> {item.reason}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2 border-t border-white/5">
            <button
              onClick={() => {
                const modal = document.getElementById('ocr-alert-modal') as HTMLDialogElement;
                if (modal) modal.close();
              }}
              className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
