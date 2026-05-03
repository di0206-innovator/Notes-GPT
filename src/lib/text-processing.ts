/**
 * Re-export from the canonical modules so legacy import paths still work.
 * The real implementations live in pdf-extractor.ts and chunker.ts.
 */
export { extractTextFromPDF as extractText } from './pdf-extractor';
export { chunkText, type TextChunk } from './chunker';
