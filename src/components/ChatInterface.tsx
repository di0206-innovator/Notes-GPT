'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User } from 'lucide-react';
import { Markdown } from './Markdown';
import { searchLocalChunks } from '@/lib/indexed-db-store';
import { getLocalAISupport, generateLocalResponse } from '@/lib/local-ai';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const SUGGESTED_CHIPS = [
  { label: '📝 Summarize Notes', prompt: 'Please summarize the core concepts of the uploaded documents.' },
  { label: '✏️ Generate Quiz', prompt: 'Create a practice quiz with 3 MCQs and 2 short answer questions based on the notes.' },
  { label: '🎯 Predict Exams', prompt: 'Based on these notes, what are the most likely exam questions? Categorize them by priority.' },
  { label: '💡 Key Terms', prompt: 'Provide a list of all key definitions and mathematical formulas found in the documents.' },
];

interface ChatInterfaceProps {
  mode: 'cloud' | 'local';
  sessionId: string;
}

export default function ChatInterface({ mode, sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI Study Assistant. I can help you revise, explain specific concepts, generate practice quizzes, or predict exam questions based **strictly** on your uploaded materials. Ask me anything!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      if (mode === 'local') {
        // Retrieve local context via IndexedDB search
        const localChunks = await searchLocalChunks(textToSend, 5);
        
        let contextText = '';
        localChunks.forEach((chunk) => {
          contextText += `[File: ${chunk.filename}, Page ${chunk.pageNumber || 1}]\n${chunk.content}\n\n`;
        });

        const systemPrompt = `You are a highly precise and strict AI study assistant for CampusStudyGPT.
Your primary task is to answer user questions based ONLY on the provided context excerpts from the uploaded study materials.

Follow these rules strictly:
1. Grounding: Keep your answers strictly based on the retrieved excerpts. Do not invent facts, introduce outside information, or hallucinate.
2. If the answer is not contained in the provided excerpts, state clearly: "I don't have enough information from the uploaded documents to answer that."
3. Citations: You must always cite your sources when presenting information from the context. Use the format [Source: filename, p.X] inline where the fact is mentioned.
4. Formats: Format your output in clean Markdown. For mathematical equations, use LaTeX notation enclosed in double dollar signs (e.g. $$E = mc^2$$).
5. Unclear OCR: If the user refers to parts of documents that contain "[OCR_UNCERTAIN: ...]", remind them that those sections were flagged as unreadable in their original notes.

Here is the retrieved context:
${contextText || 'No local document context available.'}
`;

        // Check Local AI Support
        const support = await getLocalAISupport();
        if (!support.available) {
          throw new Error(`Local AI is not available: ${support.message}`);
        }

        const reply = await generateLocalResponse(systemPrompt, textToSend);
        
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: reply },
        ]);
      } else {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
          },
          body: JSON.stringify({ messages: newMessages }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch response');
        }

        const data = await response.json();
        setMessages((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const err = error as Error;
      
      const isLocalError = mode === 'local' && (err.message || '').includes('Local AI');
      const content = isLocalError 
        ? `On-Device AI is not active. **To enable Gemini Nano in Chrome:**\n\n` +
          `1. Open **chrome://flags** in Chrome.\n` +
          `2. Search for **"Prompt API for Gemini Nano"** and set to **Enabled**.\n` +
          `3. Search for **"Enables optimization guide text"** and set to **Enabled ByPass list**.\n` +
          `4. Restart your browser and allow Chrome to download the model (takes a few minutes).\n\n` +
          `*Or switch to **Cloud Mode** in the top bar to use API-based learning.*`
        : 'Sorry, I encountered an error answering your question. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
      {/* Top Border Glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Study Companion</h2>
        </div>
      </div>

      {/* Message History Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role !== 'user' && (
              <div className="w-8 h-8 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-md backdrop-blur-sm text-xs md:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-tr-sm border border-purple-400/20'
                  : 'bg-slate-800/80 text-slate-200 rounded-tl-sm border border-white/5'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose prose-invert max-w-none prose-sm">
                  <Markdown content={msg.content} />
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/80 text-slate-200 rounded-2xl rounded-tl-sm px-5 py-3 border border-white/5">
              <div className="flex space-x-1.5 py-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips & Input container */}
      <div className="p-4 border-t border-white/5 bg-[#0F0F12]/60 backdrop-blur-xl space-y-4">
        {/* Suggested Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 max-w-4xl mx-auto custom-scrollbar">
          {SUGGESTED_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(chip.prompt)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-purple-500/10 hover:border-purple-500/30 text-slate-400 hover:text-purple-300 font-semibold text-[10px] md:text-xs transition-all shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input box form */}
        <form onSubmit={handleSubmit} className="relative flex items-center gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up or clarify a topic..."
            className="flex-1 px-5 py-3.5 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm text-slate-100 placeholder-slate-400 transition-all shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 flex-shrink-0 group flex items-center justify-center"
          >
            <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
