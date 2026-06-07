/**
 * Client-side On-Device AI Service.
 * Leverages Chrome's built-in window.ai (Gemini Nano) for local offline RAG.
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

/**
 * Check if the browser supports window.ai (Prompt API)
 */
export async function getLocalAISupport(): Promise<LocalAIStatus> {
  if (typeof window === 'undefined') {
    return { available: false, status: 'unsupported', message: 'Not in browser environment' };
  }

  const win = window as unknown as WindowWithAI;
  
  // Try new Prompt API spec: window.ai.languageModel
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

  // Fallback to older window.ai.assistant or window.assistant
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
 * Generate a response using Chrome's built-in AI session.
 */
export async function generateLocalResponse(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const support = await getLocalAISupport();
  if (!support.available) {
    throw new Error(support.message);
  }

  const win = window as unknown as WindowWithAI;
  let session: AISession | undefined;

  try {
    if (win.ai && win.ai.languageModel) {
      session = await win.ai.languageModel.create({
        systemPrompt: systemPrompt,
        temperature: 0.2,
      });
    } else if (win.ai && win.ai.assistant) {
      session = await win.ai.assistant.create({
        systemPrompt: systemPrompt,
        temperature: 0.2,
      });
    } else if (win.assistant) {
      session = await win.assistant.create({
        systemPrompt: systemPrompt,
        temperature: 0.2,
      });
    }

    if (!session) {
      throw new Error('Could not initialize local AI session.');
    }

    const response = await session.prompt(userPrompt);
    return response || '';
  } catch (error) {
    console.error('Local on-device prompt failed:', error);
    throw new Error('On-device inference failed. Check chrome://flags settings.');
  } finally {
    if (session && typeof session.destroy === 'function') {
      session.destroy();
    }
  }
}

/**
 * Generate a complete local study kit using Chrome's built-in AI.
 * Compiles IndexedDB chunks, feeds them to Gemini Nano, and saves to studyKits.
 */
export async function generateLocalStudyKit(
  allChunks: LocalAIChunk[],
  onProgress?: (step: string) => void
): Promise<Record<string, unknown>> {
  if (allChunks.length === 0) {
    throw new Error('No local documents found. Please upload notes first.');
  }

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
    notesPrompt
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
    qnaPrompt
  );

  // 3. Generate Flashcards (mock JSON array of 5-8 cards since Nano is smaller)
  onProgress?.('Formatting local Memory Flashcards...');
  const fcPrompt = `Create a list of 5-8 flashcard JSON objects based on the context.
Strictly return a raw JSON array of objects without markdown wrappers:
[{"id": "fc-1", "front": "question?", "back": "answer", "category": "topic"}]
Context:
${contextText}`;
  const fcResponse = await generateLocalResponse(
    'You are a study card generator. Return ONLY a valid JSON array of flashcards.',
    fcPrompt
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
    examPrompt
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
