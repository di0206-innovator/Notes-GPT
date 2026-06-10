import { generateChatResponse } from './gemini';
import { getDocumentChunks, StoredChunk } from './vector-store';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
}

export interface UncertainSection {
  id: string;
  source: string;
  excerpt: string;
  reason: string;
}

export interface StudyKit {
  revisionNotes: string;
  questionBank: string;
  flashcards: Flashcard[];
  mockExam: string;
  answerKey: string;
  uncertainSections: UncertainSection[];
  updatedAt: string;
}

/**
 * Compile all chunks from vectors.json into a combined source context.
 */
function compileSourceContext(chunks: StoredChunk[]): { contextText: string; filenames: string[] } {
  const filenames = Array.from(new Set(chunks.map((c) => c.filename)));
  
  // Sort chunks by filename and page/index to keep chronological order
  const sortedChunks = [...chunks].sort((a, b) => {
    if (a.filename !== b.filename) return a.filename.localeCompare(b.filename);
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
    return a.chunkIndex - b.chunkIndex;
  });

  let contextText = '';
  sortedChunks.forEach((chunk) => {
    contextText += `[File: ${chunk.filename}, p.${chunk.pageNumber}]\n${chunk.content}\n\n`;
  });

  return { contextText, filenames };
}

/**
 * Extract [OCR_UNCERTAIN: ...] tags from notes to show in UI warnings.
 */
function extractOCRUncertainties(chunks: StoredChunk[]): UncertainSection[] {
  const uncertainties: UncertainSection[] = [];
  const regex = /\[OCR_UNCERTAIN:\s*([^\]]+)\]/g;

  chunks.forEach((chunk, i) => {
    let match;
    while ((match = regex.exec(chunk.content)) !== null) {
      uncertainties.push({
        id: `ocr-${i}-${uncertainties.length}`,
        source: `${chunk.filename} (Page ${chunk.pageNumber})`,
        excerpt: chunk.content.substring(
          Math.max(0, match.index - 50),
          Math.min(chunk.content.length, match.index + match[0].length + 50)
        ),
        reason: match[1],
      });
    }
  });

  return uncertainties;
}

/**
 * Generate all study assets in a single optimized Gemini API call.
 */
async function generateAllStudyAssets(context: string): Promise<Omit<StudyKit, 'updatedAt' | 'uncertainSections'>> {
  const prompt = `You are an expert tutor, exam examiner, and university final exam writer. Your task is to generate a comprehensive Study Kit based ONLY on the provided document excerpts.
You must return the output STRICTLY as a single JSON object. Do not include any introductory remarks, conversation, or markdown wrapping blocks outside the JSON (e.g. return ONLY the JSON payload).

The JSON object must match this schema:
{
  "revisionNotes": "string (Markdown format, containing comprehensive, highly structured revision notes divided topic-wise)",
  "questionBank": "string (Markdown format, containing 5-8 MCQs with options and answers, 5 short Q&As, and 3 long/analytical Q&As)",
  "flashcards": [
    {
      "id": "string (unique code, e.g., fc-1, fc-2)",
      "front": "string (question or concept to remember)",
      "back": "string (short definition or answer)",
      "category": "string (topic name)"
    }
  ],
  "mockExam": "string (Markdown format, containing a realistic practice exam paper with marks, duration, and instructions)",
  "answerKey": "string (Markdown format, containing the comprehensive answer key and grading rubric for the mock exam)"
}

Formatting and Grounding Rules:
1. Grounding: All content, questions, notes, and answers must be strictly derived from the provided excerpts. Do not invent any outside facts, assumptions, or details.
2. Math/Latex: Format all mathematical equations, formulas, and symbols in LaTeX style enclosed in double dollar signs (e.g. $$E=mc^2$$ or $$\\int_0^\\infty e^{-x^2} dx$$).
3. Notes: In "revisionNotes", organize topic-wise, use clean markdown, bold key terms, use blockquotes for important concepts, and cite sources inline (e.g. (Source: filename, p.X)).
4. Question Bank: In "questionBank", structure into three sections (1. MCQs, 2. Short Answer, 3. Long/Analytical). Make sure to explain the correct answers for MCQs.
5. Flashcards: Generate 12-18 flashcards representing high-yield concepts and formulas.
6. Mock Exam & Answer Key: Separate the exam paper questions ("mockExam") and the answer key/rubric ("answerKey") into the respective fields.

Source Excerpts:
${context}`;

  const content = await generateChatResponse([{ role: 'user', content: prompt }], 0.2);
  const trimmed = content.trim();
  try {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || start >= end) {
      throw new Error('No valid JSON object structure found in LLM response.');
    }
    let jsonStr = trimmed.substring(start, end + 1);
    // Remove trailing commas in JSON arrays/objects to prevent parsing crashes
    jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');
    const result = JSON.parse(jsonStr);
    return {
      revisionNotes: result.revisionNotes || 'No notes generated.',
      questionBank: result.questionBank || 'No questions generated.',
      flashcards: Array.isArray(result.flashcards) ? result.flashcards : [],
      mockExam: result.mockExam || 'No exam paper generated.',
      answerKey: result.answerKey || 'No answer key generated.',
    };
  } catch (error) {
    console.error('Failed to parse combined study kit JSON:', trimmed, error);
    throw new Error('Failed to parse generated study materials JSON. Please try again.');
  }
}

/**
 * Main Orchestrator: Generate the full Study Kit.
 */
export async function generateStudyKit(sessionId: string): Promise<StudyKit> {
  // 1. Get all chunks
  const chunks = await getDocumentChunks(sessionId);
  if (chunks.length === 0) {
    throw new Error('No documents found in the database. Please upload notes first.');
  }

  // 2. Compile text context
  const { contextText } = compileSourceContext(chunks);
  const ocrUncertainties = extractOCRUncertainties(chunks);

  console.log(`[StudyKit] Generating study materials using ${chunks.length} chunks...`);

  // 3. Generate all assets in a single API call
  const assets = await generateAllStudyAssets(contextText);

  return {
    ...assets,
    uncertainSections: ocrUncertainties,
    updatedAt: new Date().toISOString(),
  };
}
