import * as pdfParse from 'pdf-parse';

export interface ExtractedDocument {
  text: string;
  pageTexts: string[];
  totalPages: number;
  filename: string;
}

/**
 * Extract text from a PDF buffer.
 * Returns the full text and per-page text arrays.
 */
export async function extractTextFromPDF(
  buffer: Buffer,
  filename: string
): Promise<ExtractedDocument> {
  // pdf-parse v2 exports as a namespace; use the default or named export
  const parse = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default ?? pdfParse;
  const data = await parse(buffer);

  // Split by form feed characters for per-page text
  const rawPages = data.text
    .split('\f')
    .filter((p: string) => p.trim().length > 0);

  const pageTexts =
    rawPages.length > 0 ? rawPages.map((p: string) => p.trim()) : [data.text];

  return {
    text: data.text,
    pageTexts,
    totalPages: data.numpages ?? pageTexts.length,
    filename,
  };
}
