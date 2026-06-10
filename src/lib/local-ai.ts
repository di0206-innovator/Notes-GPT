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
    // For local window.ai/assistant, evaluate system prompt context as part of the user query
    // to prevent extremely slow session creation times.
    const cleanSystemPrompt = "You are a precise and grounded study assistant for CampusStudyGPT.";
    const combinedUserPrompt = `${systemPrompt}\n\nUSER QUESTION:\n${userPrompt}`;

    if (win.ai && win.ai.languageModel) {
      session = await win.ai.languageModel.create({
        systemPrompt: cleanSystemPrompt,
        temperature: temperature ?? settings.temperature ?? 0.2,
      });
    } else if (win.ai && win.ai.assistant) {
      session = await win.ai.assistant.create({
        systemPrompt: cleanSystemPrompt,
        temperature: temperature ?? settings.temperature ?? 0.2,
      });
    } else if (win.assistant) {
      session = await win.assistant.create({
        systemPrompt: cleanSystemPrompt,
        temperature: temperature ?? settings.temperature ?? 0.2,
      });
    }

    if (!session) {
      throw new Error('Could not initialize local AI session.');
    }

    onProgress?.('Generating response via Gemini Nano...');
    const response = await session.prompt(combinedUserPrompt);
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

  // Consolidated generation call
  onProgress?.('Running combined Local AI study kit compiler...');
  const prompt = `You are an expert tutor. Generate a complete study kit based ONLY on the provided context.
You must output all sections in a single response, separated by the exact delimiters as shown below. Do not add any conversational text.

Use the following template strictly:

===REVISION_NOTES===
[Structured topic-wise revision notes here, using LaTeX $$ for math formulas. Cite filenames.]

===QUESTION_BANK===
[MCQs, short answer, and long answer questions here. Cite filenames.]

===FLASHCARDS===
[Flashcards in JSON format: A raw JSON array containing 5-8 flashcard objects matching this exact format:
[{"id": "fc-l1", "front": "question?", "back": "answer", "category": "topic"}]
Do not wrap it in markdown block fences, just print raw JSON array.]

===MOCK_EXAM===
[Mock exam paper questions here (total 50 marks, 1.5 hours).]

===ANSWER_KEY===
[Answers and marking instructions here.]

===END===

Here is the context:
${contextText}`;

  const response = await generateLocalResponse(
    'You are an expert tutor. Output all study kit sections separated by the specified delimiters.',
    prompt,
    settings.temperature,
    settings,
    onProgress
  );

  // Parse sections using delimiters
  onProgress?.('Parsing local study materials...');
  const getSection = (name: string, nextName: string): string => {
    const startIdx = response.indexOf(`===${name}===`);
    if (startIdx === -1) return '';
    const contentStart = startIdx + `===${name}===`.length;
    const endIdx = response.indexOf(`===${nextName}===`, contentStart);
    if (endIdx === -1) {
      return response.substring(contentStart).trim();
    }
    return response.substring(contentStart, endIdx).trim();
  };

  const revisionNotes = getSection('REVISION_NOTES', 'QUESTION_BANK') || 'No notes generated.';
  const questionBank = getSection('QUESTION_BANK', 'FLASHCARDS') || 'No questions generated.';
  const flashcardsRaw = getSection('FLASHCARDS', 'MOCK_EXAM');
  const mockExam = getSection('MOCK_EXAM', 'ANSWER_KEY') || 'No mock exam generated.';
  const answerKey = getSection('ANSWER_KEY', 'END') || 'No answer key generated.';

  let flashcards: Record<string, unknown>[] = [];
  try {
    let jsonStr = flashcardsRaw.replace(/^```json/, '').replace(/```$/, '').trim();
    // Remove trailing commas in JSON arrays/objects to prevent parsing crashes
    jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');
    flashcards = JSON.parse(jsonStr);
  } catch {
    // Fallback: parse or generate simple flashcards
    flashcards = [
      { id: 'fc-l1', front: 'Review your revision notes', back: 'Refer to the revision notes tab.', category: 'Notes' },
      { id: 'fc-l2', front: 'Practice the exam questions', back: 'Refer to the mock exam tab.', category: 'Practice' }
    ];
  }

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
