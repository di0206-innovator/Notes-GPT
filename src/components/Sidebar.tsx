'use client';

import React from 'react';
import { Sparkles, Library, Layers, FileSignature, BookOpen } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'My Library', icon: <Library className="w-4 h-4" /> },
    { name: 'Study Sets', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Flashcards', icon: <Layers className="w-4 h-4" /> },
    { name: 'Practice Exams', icon: <FileSignature className="w-4 h-4" /> },
  ];

  const recentStudySets = [
    'Physics 101: Midterm Prep',
    'Biology: Cellular Division',
    'Calculus III: Key Formulas',
  ];

  return (
    <aside className="w-72 border-r border-white/10 bg-[#0F0F12]/80 backdrop-blur-xl flex flex-col h-full text-slate-100">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
          <Sparkles className="text-white w-4 h-4" />
        </div>
        <h2 className="text-base font-bold text-white tracking-tight">CampusStudy<span className="gradient-text">GPT</span></h2>
      </div>

      {/* Main navigation menu */}
      <div className="p-4 flex-1 flex flex-col gap-6 overflow-y-auto">
        <nav className="flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-xs shadow-md transition-all">
            ✨ Create Study Set
          </button>
          <div className="h-px bg-white/5 my-2" />
          {menuItems.map((item) => (
            <button
              key={item.name}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-transparent border-none text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold text-left cursor-pointer"
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Recent Sets section */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-4">
            Recent Study Sets
          </h3>
          <div className="flex flex-col gap-1">
            {recentStudySets.map((setName) => (
              <button
                key={setName}
                className="px-4 py-2 text-left rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs font-medium truncate block w-full bg-transparent border-none cursor-pointer"
                title={setName}
              >
                📚 {setName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-xs">
            DS
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-200 truncate">Divyanshu</div>
            <div className="text-[10px] text-slate-500 font-semibold tracking-wide">Premium Student Plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
