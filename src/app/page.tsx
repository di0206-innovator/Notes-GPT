import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden hero-gradient">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#4F46E5] opacity-[0.03] blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#EC4899] opacity-[0.03] blur-[120px] animate-pulse-slow"></div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#9333EA] flex items-center justify-center glow-primary">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Campus<span className="gradient-text">GPT</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">Community</a>
          <a href="#" className="hover:text-white transition-colors">Safety</a>
        </div>

        <Link 
          href="/chat" 
          className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all shadow-xl"
        >
          Launch App
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass-thin border border-white/10 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-pulse"></span>
          <span>Next Generation Campus Assistant</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Navigate Campus<br />
          <span className="gradient-text">Like Never Before</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Your intelligent companion for academic success, community discovery, and seamless campus navigation. Powered by state-of-the-art AI.
        </p>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Link 
            href="/chat" 
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#4F46E5] text-white font-bold text-lg hover:bg-[#4338CA] transition-all glow-primary flex items-center justify-center space-x-3"
          >
            <span>Get Started</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
          <button className="w-full sm:w-auto px-10 py-4 rounded-2xl glass-thick text-white font-bold text-lg hover:bg-white/5 transition-all">
            Watch Demo
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="glass-thin p-8 rounded-[2rem] border border-white/5 text-left group hover:border-[#4F46E5]/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#4F46E5]/10 flex items-center justify-center text-[#4F46E5] mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Instant Directions</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Find any classroom, library, or hidden study spot with precise turn-by-turn navigation.</p>
          </div>

          <div className="glass-thin p-8 rounded-[2rem] border border-white/5 text-left group hover:border-[#9333EA]/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#9333EA]/10 flex items-center justify-center text-[#9333EA] mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Academic Sync</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Sync your courses, deadlines, and exam schedules automatically for personalized reminders.</p>
          </div>

          <div className="glass-thin p-8 rounded-[2rem] border border-white/5 text-left group hover:border-[#EC4899]/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#EC4899]/10 flex items-center justify-center text-[#EC4899] mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Community Hub</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Discover student clubs, upcoming events, and find study partners in real-time.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>© 2024 CampusGPT. Built for the modern student.</p>
          <div className="flex space-x-8 mt-6 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
