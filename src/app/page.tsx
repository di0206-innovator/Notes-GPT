import Link from 'next/link';
import { Sparkles, BookOpen, Layers, HelpCircle, FileSignature } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0A0B]">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[#8B5CF6] opacity-[0.06] blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#EC4899] opacity-[0.05] blur-[120px] animate-pulse-slow"></div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center glow-primary">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            CampusStudy<span className="gradient-text">GPT</span>
          </span>
        </div>

        <Link
          href="/chat"
          className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
        >
          Open Study Workspace
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass-thin border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC] animate-pulse"></span>
          <span>Next-Gen Student Study Companion</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-8 animate-fade-in leading-[1.1]" style={{ animationDelay: '0.1s' }}>
          Study Smarter.<br />
          <span className="gradient-text">Ace Your Exams.</span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mb-12 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Upload lecture PDFs or handwritten note images. Instantly generate structured revision notes, interactive memory flashcards, practice question banks, and simulated exams—strictly grounded in your course materials.
        </p>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Link
            href="/chat"
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-purple-600 text-white font-bold text-base hover:bg-purple-500 hover:scale-[1.02] active:scale-[0.98] transition-all glow-primary flex items-center justify-center space-x-3 shadow-lg shadow-purple-500/25"
          >
            <span>Start Preparing Now</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-32 w-full animate-fade-in" style={{ animationDelay: '0.5s' }}>
          {/* Notes Card */}
          <div className="glass-thin p-6 rounded-[2rem] border border-white/5 text-left group hover:border-purple-500/30 hover:bg-white/[0.01] transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Revision Notes</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Synthesizes PDFs and note images into topic-wise summaries, complete with formulas, definitions, and LaTeX equations.
            </p>
          </div>

          {/* Flashcards Card */}
          <div className="glass-thin p-6 rounded-[2rem] border border-white/5 text-left group hover:border-purple-500/30 hover:bg-white/[0.01] transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Active Recall</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Auto-generates study flashcards for critical terms and principles. Interactive flips help solidify retention.
            </p>
          </div>

          {/* Questions Card */}
          <div className="glass-thin p-6 rounded-[2rem] border border-white/5 text-left group hover:border-purple-500/30 hover:bg-white/[0.01] transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Predicted Q&As</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Generates MCQ pools, short definition checks, and deep essay prompts with grading answer keys.
            </p>
          </div>

          {/* Exam Simulator Card */}
          <div className="glass-thin p-6 rounded-[2rem] border border-white/5 text-left group hover:border-purple-500/30 hover:bg-white/[0.01] transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <FileSignature className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Practice Exams</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Assembles university-style mock tests with grading rubrics. Built-in clean formatting styles for printing.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs">
          <p>© 2026 CampusStudyGPT. Built for the modern student.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
