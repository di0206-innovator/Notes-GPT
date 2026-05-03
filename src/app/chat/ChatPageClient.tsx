'use client';

import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import DocumentPanel from '@/components/DocumentPanel';

export default function ChatPageClient() {
  const [showPanel, setShowPanel] = useState(true);

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Document Sidebar */}
      {showPanel && (
        <aside className="w-72 border-r border-white/10 bg-slate-900/60 backdrop-blur-xl p-4 flex flex-col">
          <DocumentPanel />
        </aside>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-slate-900/30">
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            title={showPanel ? 'Hide documents' : 'Show documents'}
          >
            {showPanel ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
          <span className="text-xs text-slate-500">
            {showPanel ? '' : 'Show documents'}
          </span>
        </div>

        {/* Chat */}
        <div className="flex-1 p-4 min-h-0">
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
