export interface TextChunk {
  content: string;
  documentId: string;
  chunkIndex: number;
  pageNumber: number;
  filename: string;
}

const DEFAULT_CHUNK_SIZE = 500; // ~500 words
const DEFAULT_CHUNK_OVERLAP = 100; // ~100 words overlap

/**
 * Split text into overlapping chunks for embedding.
 * Uses a simple word-based splitter with overlap.
 */
export function chunkText(
  text: string,
  documentId: string,
  filename: string,
  pageTexts: string[],
  options: { chunkSize?: number; chunkOverlap?: number } = {}
): TextChunk[] {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap || DEFAULT_CHUNK_OVERLAP;

  const chunks: TextChunk[] = [];

  // Build a page-offset map so we can tag each chunk with its page number
  const pageOffsets: { start: number; end: number; page: number }[] = [];
  let offset = 0;
  for (let i = 0; i < pageTexts.length; i++) {
    const pageText = pageTexts[i];
    pageOffsets.push({
      start: offset,
      end: offset + pageText.length,
      page: i + 1,
    });
    offset += pageText.length + 1; // +1 for separator
  }

  // Clean and split text into words
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const words = cleanText.split(' ');

  let chunkIndex = 0;
  let wordStart = 0;

  while (wordStart < words.length) {
    const wordEnd = Math.min(wordStart + chunkSize, words.length);
    const chunkContent = words.slice(wordStart, wordEnd).join(' ');

    // Determine which page this chunk belongs to (approximate)
    const chunkCharStart = words.slice(0, wordStart).join(' ').length;
    let pageNumber = 1;
    for (const po of pageOffsets) {
      if (chunkCharStart >= po.start && chunkCharStart < po.end) {
        pageNumber = po.page;
        break;
      }
    }

    if (chunkContent.trim().length > 20) {
      // Skip very short chunks
      chunks.push({
        content: chunkContent,
        documentId,
        chunkIndex,
        pageNumber,
        filename,
      });
      chunkIndex++;
    }

    // Move forward by (chunkSize - overlap) words
    wordStart += chunkSize - chunkOverlap;
  }

  return chunks;
}
