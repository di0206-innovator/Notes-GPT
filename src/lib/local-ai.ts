/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Client-side On-Device AI Service.
 * 
 * --- Developer Overview ---
 * Handles dispatching offline AI inference requests to three different client-side engines:
 * 1. Chrome Built-in AI (Gemini Nano) via experimental window.ai Prompt API
 * 2. Ollama Local Server (Proxied through Next.js proxy route to bypass CORS)
 * 3. WebLLM WebGPU (Compiles and runs WASM/WebGPU models directly in browser tab)
 * 
 * Features automatic localStorage preference loading fallback if settings are omitted.
 */

import { saveLocalStudyKit } from './indexed-db-store';

export interface LocalAIStatus {
  available: boolean;
  status: 'readily' | 'after-download' | 'no' | 'unsupported';
  message: string;
}

export interface LocalAIChunk {
  filename: string;
  pageNumber: number;
  content: string;
}

export interface LocalAIUncertainty {
  id: string;
  source: string;
  excerpt: string;
  reason: string;
}

interface AISession {
  prompt: (prompt: string) => Promise<string>;
  destroy: () => void;
}

interface WindowWithAI extends Window {
  ai?: {
    languageModel?: {
      capabilities: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>;
      create: (options: { systemPrompt: string; temperature: number }) => Promise<AISession>;
    };
    assistant?: {
      capabilities: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>;
      create: (options: { systemPrompt: string; temperature: number }) => Promise<AISession>;
    };
  };
  assistant?: {
    create: (options: { systemPrompt: string; temperature: number }) => Promise<AISession>;
  };
}

// WebLLM Engine Singleton Caches
let webLlmEngine: any = null;
let currentWebLlmModelId = '';

/**
 * Load user settings from localStorage (Client-side helper).
 * Safe to execute on both client and server side.
 */
function getSettingsFromStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('campus_study_settings');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse local storage settings in local-ai:', e);
  }
  return null;
}

/**
 * Merge passed settings with local preference defaults.
 */
function getActiveSettings(passedSettings?: any) {
  if (passedSettings) return passedSettings;
  const stored = getSettingsFromStorage();
  return stored || {
    localProvider: 'window-ai',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'deepseek-r1:8b',
    webLlmModel: 'Phi-3-mini-4k-instruct-q4f16-1K-MLC',
    temperature: 0.2,
  };
}

/**
 * Initialize or retrieve the cached WebLLM Engine singleton.
 * Loads `@mlc-ai/web-llm` dynamically to prevent server-side Node SSR compiling errors.
 * 
 * @param {string} modelId - MLC formatted model catalog string
 * @param {Function} onProgress - Optional callback monitoring weight download progress
 */
async function getWebLlmEngine(modelId: string, onProgress?: (step: string) => void) {
  if (typeof window === 'undefined') return null;
  
  if (webLlmEngine && currentWebLlmModelId === modelId) {
    return webLlmEngine;
  }
  
  onProgress?.(`Initializing WebGPU Model ${modelId}...`);
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
  
  const initProgressCallback = (report: any) => {
    onProgress?.(`Model loading: ${report.text}`);
  };
  
  webLlmEngine = await CreateMLCEngine(modelId, { initProgressCallback });
  currentWebLlmModelId = modelId;
  return webLlmEngine;
}

/**
 * Check if the currently configured local provider is supported and reachable.
 * 
 * - For Ollama: Hits our CORS proxy check endpoint to ping the tags list.
 * - For WebLLM: Checks if browser supports 'gpu' property in navigator.
 * - For window.ai: Probes the experimental window.ai capabilities.
 * 
 * @param {any} passedSettings - Optional active settings object override
 */
export async function getLocalAISupport(passedSettings?: any): Promise<LocalAIStatus> {
  if (typeof window === 'undefined') {
    return { available: false, status: 'unsupported', message: 'Not in browser environment' };
  }

  const settings = getActiveSettings(passedSettings);
  const provider = settings.localProvider || 'window-ai';

  // --- Ollama Provider Check ---
  if (provider === 'ollama') {
    try {
      const response = await fetch('/api/local-ai/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          url: settings.ollamaUrl,
          model: settings.ollamaModel,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        return { available: false, status: 'no', message: data.error || 'Failed to ping Ollama server.' };
      }
      
      if (data.available && data.hasModel) {
        return { available: true, status: 'readily', message: `Ollama is ready (${settings.ollamaModel}).` };
      } else {
        return { available: false, status: 'no', message: data.message || `Ollama is missing model '${settings.ollamaModel}'.` };
      }
    } catch {
      return { available: false, status: 'no', message: `Cannot connect to Ollama. Ensure Ollama is running at ${settings.ollamaUrl || 'localhost:11434'}` };
    }
  }

  // --- WebLLM Provider Check ---
  if (provider === 'web-llm') {
    const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
    if (hasWebGPU) {
      return {
        available: true,
        status: 'readily',
        message: `WebGPU is supported. Ready to run ${settings.webLlmModel || 'Phi-3-mini'}.`
      };
    } else {
      return {
        available: false,
        status: 'unsupported',
        message: 'WebGPU is not supported on this browser. Please use Chrome 113+ or Edge 113+.'
      };
    }
  }

  // --- Chrome window.ai Prompt API Check ---
  const win = window as unknown as WindowWithAI;
  
  if (win.ai && win.ai.languageModel) {
    try {
      const capabilities = await win.ai.languageModel.capabilities();
      const availability = capabilities.available;
      
      if (availability === 'readily') {
        return { available: true, status: 'readily', message: 'Gemini Nano is available locally.' };
      } else if (availability === 'after-download') {
        return { available: false, status: 'after-download', message: 'Gemini Nano is supported but model needs downloading (Chrome is downloading in background).' };
      } else {
        return { available: false, status: 'no', message: 'Gemini Nano is supported but disabled or unavailable.' };
      }
    } catch {
      return { available: false, status: 'no', message: 'Failed to query window.ai capabilities.' };
    }
  }

  const assistant = win.ai?.assistant;
  if (assistant) {
    try {
      const capabilities = await assistant.capabilities();
      if (capabilities.available === 'readily') {
        return { available: true, status: 'readily', message: 'Built-in assistant is ready.' };
      }
      return { available: false, status: 'unsupported', message: 'Built-in assistant is unsupported.' };
    } catch {
      return { available: false, status: 'unsupported', message: 'Querying built-in assistant failed.' };
    }
  }

  return {
    available: false,
    status: 'unsupported',
    message: 'Chrome Built-in AI is not enabled. Go to chrome://flags, enable "Prompt API for Gemini Nano" and "Enables optimization guide text", and restart Chrome.',
  };
}

/**
 * Generate a single text response using the selected Local AI provider.
 * 
 * @param {string} systemPrompt - Formatting constraints or behavioral guides
 * @param {string} userPrompt - Context segments merged with the user request
 * @param {number} temperature - Generation creativity
 * @param {any} passedSettings - Optional explicit settings overrides
 * @param {Function} onProgress - Live progress logs listener (for WebGPU compilation/downloads)
 */
export async function generateLocalResponse(
  systemPrompt: string,
  userPrompt: string,
  temperature?: number,
  passedSettings?: any,
  onProgress?: (step: string) => void
): Promise<string> {
  const settings = getActiveSettings(passedSettings);
  const provider = settings.localProvider || 'window-ai';

  // --- Generate using Ollama ---
  if (provider === 'ollama') {
    onProgress?.(`Querying Ollama (${settings.ollamaModel})...`);
    const response = await fetch('/api/local-ai/ollama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: settings.ollamaUrl,
        model: settings.ollamaModel,
        systemPrompt,
        userPrompt,
        temperature: temperature ?? settings.temperature,
      }),
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Ollama generation failed.');
    }
    return data.text || '';
  }

  // --- Generate using WebLLM WebGPU ---
  if (provider === 'web-llm') {
    const engine = await getWebLlmEngine(settings.webLlmModel, onProgress);
    if (!engine) {
      throw new Error('WebLLM engine could not be initialized.');
    }
    
    onProgress?.('Generating response via WebGPU...');
    const chatCompletion = await engine.chat.completions.create({
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt }
      ],
      temperature: temperature ?? settings.temperature ?? 0.2,
    });
    
    return chatCompletion.choices[0]?.message?.content || '';
  }

  // --- Generate using Built-in window.ai ---
  const support = await getLocalAISupport(settings);
  if (!support.available) {
    throw new Error(support.message);
  }

  const win = window as unknown as WindowWithAI;
  let session: AISession | undefined;

  try {
    if (win.ai && win.ai.languageModel) {
      session = await win.ai.languageModel.create({
        systemPrompt: systemPrompt,
        temperature: temperature ?? settings.temperature ?? 0.2,
      });
    } else if (win.ai && win.ai.assistant) {
      session = await win.ai.assistant.create({
        systemPrompt: systemPrompt,
        temperature: temperature ?? settings.temperature ?? 0.2,
      });
    } else if (win.assistant) {
      session = await win.assistant.create({
        systemPrompt: systemPrompt,
        temperature: temperature ?? settings.temperature ?? 0.2,
      });
    }

    if (!session) {
      throw new Error('Could not initialize local AI session.');
    }

    onProgress?.('Generating response via Gemini Nano...');
    const response = await session.prompt(userPrompt);
    return response || '';
  } catch (error) {
    console.error('Local window.ai prompt failed:', error);
    throw new Error('On-device inference failed. Check chrome://flags settings.');
  } finally {
    if (session && typeof session.destroy === 'function') {
      session.destroy();
    }
  }
}

/**
 * Orchestrate compiling multiple study kit assets (Revision Notes, Q&As, Flashcards, Mock Exams)
 * sequentially by querying the active Local AI inference engine.
 * 
 * Saves the compiled study kit in the local browser IndexedDB store.
 * 
 * @param {LocalAIChunk[]} allChunks - Vector database segments extracted from notes
 * @param {Function} onProgress - UI progress text updater callback
 * @param {any} passedSettings - Optional explicit settings overrides
 */
export async function generateLocalStudyKit(
  allChunks: LocalAIChunk[],
  onProgress?: (step: string) => void,
  passedSettings?: any
): Promise<Record<string, unknown>> {
  if (allChunks.length === 0) {
    throw new Error('No local documents found. Please upload notes first.');
  }

  const settings = getActiveSettings(passedSettings);

  // Compile context
  onProgress?.('Compiling local study notes context...');
  let contextText = '';
  allChunks.forEach((c) => {
    contextText += `[File: ${c.filename}, Page ${c.pageNumber || 1}]\n${c.content}\n\n`;
  });

  // Extract OCR uncertainties
  const uncertainties: LocalAIUncertainty[] = [];
  const regex = /\[OCR_UNCERTAIN:\s*([^\]]+)\]/g;
  allChunks.forEach((chunk, i) => {
    let match;
    while ((match = regex.exec(chunk.content)) !== null) {
      uncertainties.push({
        id: `ocr-local-${i}-${uncertainties.length}`,
        source: `${chunk.filename} (Page ${chunk.pageNumber || 1})`,
        excerpt: chunk.content.substring(
          Math.max(0, match.index - 50),
          Math.min(chunk.content.length, match.index + match[0].length + 50)
        ),
        reason: match[1],
      });
    }
  });

  // 1. Generate Revision Notes
  onProgress?.('Generating local Revision Notes...');
  const notesPrompt = `Generate structured topic-wise revision notes based ONLY on the provided context. Use LaTeX $$ math formulas. Cite filenames.
Context:
${contextText}`;
  const revisionNotes = await generateLocalResponse(
    'You are an expert tutor. Provide concise, clear, and structured revision notes.',
    notesPrompt,
    settings.temperature,
    settings,
    onProgress
  );

  // 2. Generate Q&A Bank
  onProgress?.('Compiling local Practice Q&As...');
  const qnaPrompt = `Create a Question Bank based ONLY on this context:
1. 3 Multiple Choice Questions (MCQs) with options A, B, C, D and correct answers.
2. 3 Short Answer questions with answers.
3. 2 Long Analytical questions with answers.
Context:
${contextText}`;
  const questionBank = await generateLocalResponse(
    'You are an examiner. Generate a clean MCQ, short, and long question bank.',
    qnaPrompt,
    settings.temperature,
    settings,
    onProgress
  );

  // 3. Generate Flashcards (mock JSON array of 5-8 cards)
  onProgress?.('Formatting local Memory Flashcards...');
  const fcPrompt = `Create a list of 5-8 flashcard JSON objects based on the context.
Strictly return a raw JSON array of objects without markdown wrappers:
[{"id": "fc-1", "front": "question?", "back": "answer", "category": "topic"}]
Context:
${contextText}`;
  const fcResponse = await generateLocalResponse(
    'You are a study card generator. Return ONLY a valid JSON array of flashcards.',
    fcPrompt,
    settings.temperature,
    settings,
    onProgress
  );
  
  let flashcards: Record<string, unknown>[] = [];
  try {
    const jsonStr = fcResponse.replace(/^```json/, '').replace(/```$/, '').trim();
    flashcards = JSON.parse(jsonStr) as Record<string, unknown>[];
  } catch {
    // Fallback manual parsing or simple generation if local model output fails JSON parsing
    flashcards = [
      { id: 'fc-l1', front: 'Define the main topic', back: 'Refer to revision notes tab.', category: 'Notes' },
      { id: 'fc-l2', front: 'Explain key formula', back: 'Refer to equations in notes.', category: 'Formulas' }
    ];
  }

  // 4. Generate Mock Exam
  onProgress?.('Drafting local Mock Exam paper...');
  const examPrompt = `Generate a realistic exam paper (total 50 marks, 1.5 hours) and an answer key separated by unique delimiter "===ANSWER_KEY_START===".
Context:
${contextText}`;
  const examResponse = await generateLocalResponse(
    'You are a professor. Create an exam paper and answer key separated by ===ANSWER_KEY_START===.',
    examPrompt,
    settings.temperature,
    settings,
    onProgress
  );

  const parts = examResponse.split('===ANSWER_KEY_START===');
  const mockExam = parts[0]?.trim() || 'Failed to generate mock exam.';
  const answerKey = parts[1]?.trim() || 'Answer key not found.';

  const studyKit: Record<string, unknown> = {
    revisionNotes,
    questionBank,
    flashcards,
    mockExam,
    answerKey,
    uncertainSections: uncertainties,
    updatedAt: new Date().toISOString(),
  };

  onProgress?.('Saving local study kit...');
  await saveLocalStudyKit(studyKit);
  return studyKit;
}
