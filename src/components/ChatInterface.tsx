'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, User } from 'lucide-react';
import { Markdown } from './Markdown';
import { searchLocalChunks } from '@/lib/indexed-db-store';
import { getLocalAISupport, generateLocalResponse } from '@/lib/local-ai';
import { auth } from '@/lib/firebase';
import { Settings } from './SettingsModal';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const SUGGESTED_CHIPS = [
  { label: '[ 📝 SUMMARIZE ]', prompt: 'Please summarize the core concepts of the uploaded documents.' },
  { label: '[ ✏️ QUIZ ]', prompt: 'Create a practice quiz with 3 MCQs and 2 short answer questions based on the notes.' },
  { label: '[ 🎯 EXAM_PRED ]', prompt: 'Based on these notes, what are the most likely exam questions? Categorize them by priority.' },
  { label: '[ 💡 EQUATIONS ]', prompt: 'Provide a list of all key definitions and mathematical formulas found in the documents.' },
];

interface ChatInterfaceProps {
  mode: 'cloud' | 'local';
  temperature?: number;
  topK?: number;
  settings?: Settings;
}

export default function ChatInterface({
  mode,
  temperature = 0.2,
  topK = 5,
  settings,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI Study Assistant. I can help you revise, explain specific concepts, generate practice quizzes, or predict exam questions based **strictly** on your uploaded materials. Ask me anything!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    setProgressMessage('');

    try {
      if (mode === 'local') {
        const localChunks = await searchLocalChunks(textToSend, topK);
        
        let contextText = '';
        localChunks.forEach((chunk) => {
          contextText += `[File: ${chunk.filename}, Page ${chunk.pageNumber || 1}]\n${chunk.content}\n\n`;
        });

        // Build conversation history for multi-turn context
        const recentHistory = newMessages
          .slice(-10) // Keep last 10 messages for context window management
          .map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`)
          .join('\n\n');

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

        const support = await getLocalAISupport(settings);
        if (!support.available) {
          throw new Error(`Local AI is not available: ${support.message}`);
        }

        // Include conversation history in the user prompt for multi-turn
        const userPromptWithHistory = recentHistory
          ? `Previous conversation:\n${recentHistory}\n\nNow answer the latest question above.`
          : textToSend;

        const reply = await generateLocalResponse(
          systemPrompt,
          userPromptWithHistory,
          temperature,
          settings,
          (step) => setProgressMessage(step)
        );
        
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: reply },
        ]);
      } else {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          signal: controller.signal,
          body: JSON.stringify({ messages: newMessages, temperature, topK }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch response');
        }

        const data = await response.json();
        setMessages((prev) => [...prev, data]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Fetch request aborted by user.');
        return;
      }
      console.error('Error sending message:', error);
      
      const isLocalError = mode === 'local';
      let content = 'Sorry, I encountered an error answering your question. Please try again.';

      if (isLocalError) {
        const engine = settings?.localProvider || 'window-ai';
        if (engine === 'ollama') {
          content = `### 🐑 Ollama Server Connection Failed\n\n` +
            `Could not run Local AI query using model \`${settings?.ollamaModel || 'gemma2:2b'}\`.\n\n` +
            `**Troubleshooting Steps:**\n` +
            `1. Make sure the Ollama application is running on your Mac.\n` +
            `2. Open your terminal and verify the model is pulled:\n` +
            `   \`\`\`bash\n` +
            `   ollama run ${settings?.ollamaModel || 'gemma2:2b'}\n` +
            `   \`\`\`\n` +
            `3. Check that your server endpoint URL in **Settings** matches: \`${settings?.ollamaUrl || 'http://localhost:11434'}\`.\n` +
            `4. Go to **Settings** and click **Test Connection** to confirm status.`;
        } else if (engine === 'web-llm') {
          content = `### 🌐 WebLLM WebGPU Error\n\n` +
            `Failed to execute model \`${settings?.webLlmModel || 'Phi-3-mini'}\` in your browser.\n\n` +
            `**Troubleshooting Steps:**\n` +
            `1. Verify your browser supports **WebGPU** (supported natively in Chrome 113+, Edge 113+, Safari 18+).\n` +
            `2. On first usage, loading weights (~1.5GB to 2.5GB) requires a stable internet connection. Ensure download completed successfully.\n` +
            `3. If the browser ran out of VRAM/memory, try reloading the page and choosing a smaller model like \`Qwen2.5-1.5B\` in **Settings**.`;
        } else {
          content = `### 💻 Built-in AI (window.ai) Failed\n\n` +
            `Chrome built-in Gemini Nano model is not active on your browser.\n\n` +
            `**To enable it:**\n` +
            `1. Open **chrome://flags** in Chrome.\n` +
            `2. Enable **"Prompt API for Gemini Nano"**.\n` +
            `3. Enable **"Enables optimization guide text"** (set to *Enabled Bypass list*).\n` +
            `4. Restart your browser and allow Chrome to download the model background service.\n\n` +
            `*Or, switch to **Ollama** or **WebLLM** inside **Settings**, or toggle to **Cloud Mode** in the top bar.*`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content,
        },
      ]);
    } finally {
      setIsLoading(false);
      setProgressMessage('');
      abortControllerRef.current = null;
    }
  };

  const handleInterrupt = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setProgressMessage('');
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '⚠️ *Inference task terminated by user. Workspace reset.*' }
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full border-2 border-white bg-black retro-shadow relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-white bg-black">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-white bg-white animate-pulse" />
          <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
            [ REMOTE_STUDY_SHELL ]
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirm('Wipe chat history and reset session?')) {
                setMessages([
                  {
                    role: 'assistant',
                    content: 'Hello! I am your AI Study Assistant. I can help you revise, explain specific concepts, generate practice quizzes, or predict exam questions based **strictly** on your uploaded materials. Ask me anything!',
                  }
                ]);
              }
            }}
            className="retro-button py-0.5 px-2 text-[9px] font-bold"
            title="Clear Chat History"
          >
            CLEAR
          </button>
          <span className="text-[10px] uppercase font-mono text-white/50">
            Mode: {mode.toUpperCase()} {mode === 'local' && `(${settings?.localProvider || 'window-ai'})`}
          </span>
        </div>
      </div>

      {/* Message History Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-black">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 border border-white bg-black flex items-center justify-center text-white flex-shrink-0 mt-1">
                  <Terminal className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[82%] p-4 border-2 border-white text-xs md:text-sm font-mono leading-relaxed ${
                  isUser
                    ? 'bg-white text-black border-white retro-shadow-black'
                    : 'bg-black text-white border-white'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-invert max-w-none prose-sm leading-relaxed font-mono">
                    <Markdown content={msg.content} />
                  </div>
                )}
              </div>
              {isUser && (
                <div className="w-8 h-8 border border-white bg-white flex items-center justify-center text-black flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-4 justify-start items-start">
            <div className="w-8 h-8 border border-white bg-black flex items-center justify-center text-white flex-shrink-0 mt-1 animate-pulse">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-black text-white border-2 border-white p-4 font-mono text-xs animate-flash">
                {progressMessage ? `[ ${progressMessage.toUpperCase()} ]` : '[ ACCESSING COMPREHENSION DIRECTORY... ]'}
              </div>
              <button
                type="button"
                onClick={handleInterrupt}
                className="retro-button py-1 px-3 text-[9px] font-bold self-start bg-red-600 border-red-600 text-white hover:bg-red-700"
              >
                INTERRUPT GENERATION
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips & Input container */}
      <div className="p-4 border-t-2 border-white bg-black space-y-4">
        {/* Suggested Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 max-w-4xl mx-auto custom-scrollbar">
          {SUGGESTED_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(chip.prompt)}
              disabled={isLoading}
              className="retro-button py-1.5 px-3 text-[10px] font-mono font-bold cursor-pointer"
            >
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
            placeholder="Type query or instruction..."
            className="retro-input flex-1 font-mono text-xs py-3.5 focus:bg-white focus:text-black focus:border-black transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="retro-button py-3.5 px-6 font-mono text-xs flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
