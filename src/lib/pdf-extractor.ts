import * as pdfParseModule from 'pdf-parse';

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
  const pdfParse: any = pdfParseModule;
  const PDFParseClass = pdfParse.PDFParse || pdfParse.default?.PDFParse;

  if (!PDFParseClass) {
    throw new Error('Could not resolve PDFParse class from pdf-parse dependency.');
  }

  const parser = new PDFParseClass({ data: buffer });

  
  try {
    const result = await parser.getText();
    const text = result.text;
    const totalPages = result.total;
    const pageTexts = result.pages.map((p: any) => p.text.trim());

    // Heuristic: If total extracted text length is extremely low compared to the number of pages,
    // it is likely a scanned document (images instead of text).
    const totalLength = text.replace(/\s+/g, '').length;
    const isScanned = totalLength < 50 * totalPages; // less than 50 non-whitespace chars per page on average

    return {
      text,
      pageTexts,
      totalPages,
      filename,
      isScanned,
    };
  } finally {
    // Release parser worker resources to prevent memory leaks
    await parser.destroy().catch(() => {});
  }
}

