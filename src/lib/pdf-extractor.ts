import * as pdfParse from 'pdf-parse';

export interface ExtractedDocument {
  text: string;
  pageTexts: string[];
  totalPages: number;
  filename: string;
  isScanned: boolean;
}

/**
 * Extract text from a PDF buffer.
 * Returns the full text, per-page text arrays, and whether it's detected as scanned.
 */
export async function extractTextFromPDF(
  buffer: Buffer,
  filename: string
): Promise<ExtractedDocument> {
  // pdf-parse v2 exports as a namespace; use the default or named export
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parse = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default ?? pdfParse;
  const data = await parse(buffer);

  // Split by form feed characters for per-page text
  const rawPages = data.text
    .split('\f')
    .filter((p: string) => p.trim().length > 0);

  const pageTexts =
    rawPages.length > 0 ? rawPages.map((p: string) => p.trim()) : [data.text];

  // Heuristic: If total extracted text length is extremely low compared to the number of pages,
  // it is likely a scanned document (images instead of text).
  const totalLength = data.text.replace(/\s+/g, '').length;
  const totalPages = data.numpages ?? pageTexts.length;
  const isScanned = totalLength < 50 * totalPages; // less than 50 non-whitespace chars per page on average

  return {
    text: data.text,
    pageTexts,
    totalPages,
    filename,
    isScanned,
  };
}

