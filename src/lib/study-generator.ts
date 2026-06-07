import { openai } from './openai';
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
 * Generate study notes from the uploaded documents.
 */
async function generateRevisionNotes(context: string): Promise<string> {
  const prompt = `You are an expert tutor. Your task is to generate comprehensive, highly structured, and easy-to-read Revision Notes based ONLY on the provided document excerpts.
Format requirements:
- Organize notes topic-wise or chapter-wise.
- Use clean Markdown formatting, including bullet points, bold text for key terms, and code blocks for code.
- Format all math formulas in LaTeX style enclosed in double dollar signs (e.g. $$E=mc^2$$).
- Include core concepts, definitions, explanations, formulas, and examples.
- Highlight important concepts in blockquotes.
- Base everything strictly on the text. Do not invent any outside facts or details.
- Cite sources inline when introducing key topics, e.g. (Source: filename, p.X).

Source Document Excerpts:
${context}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Generate question bank (MCQs, short and long Q&A).
 */
async function generateQuestionBank(context: string): Promise<string> {
  const prompt = `You are an exam examiner. Generate a comprehensive Question Bank based ONLY on the provided study materials.
Structure the response in three clear sections:
1. **Multiple Choice Questions (MCQs):** Provide 5-8 MCQs. Each question must have options (A, B, C, D) and indicate the correct answer with an explanation.
2. **Short Answer Questions:** Provide 5 questions focusing on definitions, formulas, or quick explanations, with complete answers.
3. **Long/Analytical Questions:** Provide 3 detailed questions requiring deep explanations, steps, proofs, or examples, with detailed model answers.

Ensure:
- Math formulas are formatted in LaTeX ($$...$$).
- Answers are strictly derived from the text.
- Do not invent outside facts.

Source Document Excerpts:
${context}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Generate interactive flashcards.
 */
async function generateFlashcards(context: string): Promise<Flashcard[]> {
  const prompt = `You are a study helper. Generate a set of 12-18 study flashcards based ONLY on the provided context.
Output must be a valid JSON array of objects. Do not wrap it in markdown code fences or write any explanation.
Each object in the array must strictly match this schema:
{
  "id": "string (unique code, e.g., fc-1, fc-2)",
  "front": "string (the question, term, formula, or concept to remember)",
  "back": "string (the short definition, explanation, answer, or equation)",
  "category": "string (the topic or chapter name)"
}

Ensure all flashcards represent high-yield exam concepts and formulas from the notes. Keep math in LaTeX style.

Source Document Excerpts:
${context}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content?.trim() || '[]';
  try {
    // Strip markdown JSON wrappers if present
    const jsonStr = content.replace(/^```json/, '').replace(/```$/, '').trim();
    return JSON.parse(jsonStr) as Flashcard[];
  } catch {
    console.error('Failed to parse flashcards JSON:', content);
    return [];
  }
}

/**
 * Generate mock exam paper and answer key.
 */
async function generateMockExam(context: string): Promise<{ exam: string; key: string }> {
  const prompt = `You are a university professor. Generate a realistic, formal Exam Paper and a corresponding Answer Key based ONLY on the provided material.
The paper should have total marks (e.g. 100 marks), duration (e.g. 3 hours), and instructions.
Format the output into two sections separated by a unique delimiter "===ANSWER_KEY_START===".

Example structure of output:
# University Final Practice Exam: [Topic Name]
**Duration:** 3 Hours  
**Total Marks:** 100 Marks  
**Instructions:** Answer all questions...
[Exams questions here...]

===ANSWER_KEY_START===
# Practice Exam - Comprehensive Answer Key & Grading Rubric
[Answers and marking instructions here...]

Ensure:
- Questions cover all core sections: Section A (MCQs/True-False), Section B (Short Definitions/Calculations), Section C (Long Essays/Problems).
- Keep math in LaTeX ($$...$$).
- Answers must be 100% grounded in the source text.

Source Document Excerpts:
${context}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content || '';
  const parts = content.split('===ANSWER_KEY_START===');
  
  return {
    exam: parts[0]?.trim() || 'Failed to generate exam paper.',
    key: parts[1]?.trim() || 'No answer key generated.'
  };
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

  // 3. Generate all assets in parallel to save time
  const [notes, qna, flashcards, examData] = await Promise.all([
    generateRevisionNotes(contextText),
    generateQuestionBank(contextText),
    generateFlashcards(contextText),
    generateMockExam(contextText),
  ]);

  return {
    revisionNotes: notes,
    questionBank: qna,
    flashcards,
    mockExam: examData.exam,
    answerKey: examData.key,
    uncertainSections: ocrUncertainties,
    updatedAt: new Date().toISOString(),
  };
}
