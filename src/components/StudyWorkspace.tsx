'use client';

import React, { useState } from 'react';
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
  Terminal,
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
    <div className="flex flex-col h-full border-2 border-white bg-black retro-shadow relative overflow-hidden font-mono">
      
      {/* Header / Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b-2 border-white bg-black gap-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">[ STUDY_WORKSPACE ]</h2>
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="retro-button py-1 px-2.5 text-[9px] font-bold"
            title="Update Study Kit"
          >
            [ UPDATE ]
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 border border-white p-1 bg-black overflow-x-auto">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap retro-button border-none hover:bg-white hover:text-black ${
              activeTab === 'notes' ? 'bg-white text-black' : 'bg-black text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            REVISION NOTES
          </button>
          <button
            onClick={() => setActiveTab('qna')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap retro-button border-none hover:bg-white hover:text-black ${
              activeTab === 'qna' ? 'bg-white text-black' : 'bg-black text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Q&A BANK
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap retro-button border-none hover:bg-white hover:text-black ${
              activeTab === 'flashcards' ? 'bg-white text-black' : 'bg-black text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            CARDS ({flashcards?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('exam')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap retro-button border-none hover:bg-white hover:text-black ${
              activeTab === 'exam' ? 'bg-white text-black' : 'bg-black text-white'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" />
            MOCK EXAM
          </button>
        </div>
      </div>

      {/* OCR Warnings Alerts */}
      {uncertainSections && uncertainSections.length > 0 && (
        <div className="bg-black border-b-2 border-white px-6 py-3 flex items-start gap-2.5 text-xs text-white">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-white animate-pulse" />
          <div className="flex-1">
            <span className="font-bold">[ OCR_ALERT ]</span> OCR flagged {uncertainSections.length} uncertain segments in notes.
            <button
              onClick={() => {
                const modal = document.getElementById('ocr-alert-modal') as HTMLDialogElement;
                if (modal) modal.showModal();
              }}
              className="ml-2 font-bold underline hover:text-white/60 transition-colors uppercase"
            >
              [ View Log ]
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto print:p-0 print:bg-white print:text-black bg-black">
        <AnimatePresence mode="wait">
          {/* REVISION NOTES TAB */}
          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 max-w-4xl mx-auto print:max-w-none"
            >
              <div className="flex justify-between items-center border-b border-white/20 pb-4 print:hidden">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">
                  {"// REVISION NOTES SUMMARY"}
                </h3>
                <button
                  onClick={handlePrint}
                  className="retro-button text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  [ PRINT NOTES ]
                </button>
              </div>
              <div className="prose prose-invert max-w-none prose-sm leading-relaxed text-white font-mono print:text-black">
                <Markdown content={revisionNotes} />
              </div>
            </motion.div>
          )}

          {/* Q&A BANK TAB */}
          {activeTab === 'qna' && (
            <motion.div
              key="qna"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 max-w-4xl mx-auto print:max-w-none"
            >
              <div className="flex justify-between items-center border-b border-white/20 pb-4 print:hidden">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">
                  {"// IMPORTANT QUESTIONS & ANSWERS"}
                </h3>
                <button
                  onClick={handlePrint}
                  className="retro-button text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  [ PRINT Q&AS ]
                </button>
              </div>
              <div className="prose prose-invert max-w-none prose-sm text-white font-mono print:text-black">
                <Markdown content={questionBank} />
              </div>
            </motion.div>
          )}

          {/* FLASHCARDS TAB */}
          {activeTab === 'flashcards' && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto py-8"
            >
              {!flashcards || flashcards.length === 0 ? (
                <div className="text-center py-12 text-white/50 border border-white/20 p-6 w-full">
                  <Layers className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-xs uppercase">No flashcards available in study kit.</p>
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
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
                      {/* Front Card Face */}
                      <div
                        className="absolute inset-0 border-2 border-white bg-black p-8 flex flex-col justify-between retro-shadow-black"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="flex items-center justify-between border-b border-white/20 pb-2">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            [{currentCard?.category || 'GENERAL'}]
                          </span>
                          <span className="text-[10px] text-white/50 uppercase font-mono">
                            [ QUESTION_SIDE ]
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center">
                          <h4 className="text-base md:text-lg font-bold text-white leading-relaxed">
                            {currentCard?.front}
                          </h4>
                        </div>
                        <div className="text-center text-[9px] text-white/40 uppercase tracking-widest font-bold">
                          [ CLICK TO FLIP CARD ]
                        </div>
                      </div>

                      {/* Back Card Face */}
                      <div
                        className="absolute inset-0 border-2 border-white bg-white text-black p-8 flex flex-col justify-between retro-shadow-black"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <div className="flex items-center justify-between border-b border-black/20 pb-2">
                          <span className="text-[10px] font-bold text-black uppercase tracking-wider">
                            [{currentCard?.category || 'GENERAL'}]
                          </span>
                          <span className="text-[10px] text-black/50 uppercase font-mono">
                            [ ANSWER_SIDE ]
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center overflow-y-auto py-4">
                          <p className="text-xs md:text-sm font-bold leading-relaxed text-black">
                            {currentCard?.back}
                          </p>
                        </div>
                        <div className="text-center text-[9px] text-black/40 uppercase tracking-widest font-bold">
                          [ CLICK TO FLIP BACK ]
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevFlashcard();
                      }}
                      className="retro-button p-2"
                      title="Previous Card"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-mono font-bold border-2 border-white px-4 py-2 bg-black text-white">
                      [ CARD {flashcardIndex + 1} OF {flashcards.length} ]
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextFlashcard();
                      }}
                      className="retro-button p-2"
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 max-w-4xl mx-auto print:max-w-none"
            >
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/20 pb-4 print:hidden">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">
                  {"// UNIVERSITY PRACTICE EXAM SIMULATOR"}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className="retro-button text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    {showAnswerKey ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        [ HIDE ANSWER KEY ]
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        [ SHOW ANSWER KEY ]
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="retro-button bg-white text-black border-2 border-white hover:bg-black hover:text-white text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    [ PRINT EXAM ]
                  </button>
                </div>
              </div>

              {/* Exam Content Area */}
              <div className="space-y-8 border-2 border-white bg-black p-8 print:border-none print:p-0 print:bg-white text-white">
                <div className="prose prose-invert max-w-none prose-sm text-white font-mono print:text-black leading-relaxed">
                  <Markdown content={mockExam} />
                </div>

                {showAnswerKey && (
                  <div className="border-t-2 border-dashed border-white pt-8 mt-12 bg-black print:border-t-2 print:border-black print:mt-16">
                    <h2 className="text-base font-bold text-white mb-6 uppercase flex items-center gap-2 print:text-black">
                      [ EXAM ANSWER KEY & GRADING SCHEME ]
                    </h2>
                    <div className="prose prose-invert max-w-none prose-sm text-white font-mono print:text-black leading-relaxed">
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
      <dialog id="ocr-alert-modal" className="modal bg-black text-white border-2 border-white p-6 max-w-2xl w-full shadow-2xl backdrop:bg-black/80 font-mono">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-white pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              [ OCR UNCERTAINTIES LOG ]
            </h3>
            <button
              onClick={() => {
                const modal = document.getElementById('ocr-alert-modal') as HTMLDialogElement;
                if (modal) modal.close();
              }}
              className="text-white hover:text-white/60 font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-[10px] text-white/70 leading-normal uppercase">
            The OCR text engine flagged the following segments as low-confidence or handwritten unreadable values. Please review these:
          </p>
          <div className="overflow-y-auto max-h-80 space-y-3 pr-2 custom-scrollbar">
            {uncertainSections?.map((item) => (
              <div key={item.id} className="border border-white/30 bg-black p-4 text-xs flex flex-col gap-2">
                <div className="flex justify-between items-center border-b border-white/20 pb-1.5">
                  <span className="font-bold text-white uppercase">{item.source}</span>
                  <span className="text-[8px] border border-white px-2 py-0.5 font-bold uppercase">
                    UNCERTAIN_READ
                  </span>
                </div>
                <p className="text-[10px] text-white/80 italic font-mono bg-white/5 p-2 border border-dashed border-white/10">
                  &ldquo;...{item.excerpt}...&rdquo;
                </p>
                <div className="text-[10px] text-white/50 uppercase">
                  <span className="font-bold text-white">REASON:</span> {item.reason}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-3 border-t-2 border-white">
            <button
              onClick={() => {
                const modal = document.getElementById('ocr-alert-modal') as HTMLDialogElement;
                if (modal) modal.close();
              }}
              className="retro-button text-xs py-2 px-4"
            >
              [ CLOSE ]
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
