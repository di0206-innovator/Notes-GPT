/**
 * Client-Side Parser & OCR Engine.
 * Extracts text from PDFs (via PDF.js) and Scanned Note Images (via Tesseract.js)
 * running entirely inside the browser.
 */

import { createWorker } from 'tesseract.js';

export interface LocalExtractedDoc {
  text: string;
  pageTexts: string[];
  totalPages: number;
}

/**
 * Extract text from PDF client-side using PDF.js.
 */
export async function parsePDFClient(file: File, onProgress?: (msg: string) => void): Promise<LocalExtractedDoc> {
  if (typeof window === 'undefined') {
    throw new Error('PDF parsing is only supported in browser environments.');
  }

  onProgress?.('Reading PDF buffer...');
  const arrayBuffer = await file.arrayBuffer();
  
  onProgress?.('Loading PDF library...');
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

  onProgress?.('Loading PDF document...');
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const totalPages = pdf.numPages;
  const pageTexts: string[] = [];
  let fullText = '';

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(`Extracting text from page ${i} of ${totalPages}...`);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
      
    pageTexts.push(pageText);
    fullText += pageText + '\n\f';
  }

  onProgress?.('PDF parsing complete!');
  return {
    text: fullText,
    pageTexts,
    totalPages,
  };
}

/**
 * Perform local OCR on image notes client-side using Tesseract.js.
 */
export async function performLocalOCR(file: File, onProgress?: (msg: string) => void): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('OCR is only supported in browser environments.');
  }

  onProgress?.('Initializing local OCR engine (English)...');
  // Initialize tesseract worker with language and progress logger
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m && m.status === 'recognizing') {
        onProgress?.(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      } else if (m && typeof m.status === 'string') {
        onProgress?.(`${m.status.charAt(0).toUpperCase() + m.status.slice(1)}...`);
      }
    }
  });
  
  try {
    onProgress?.('Running OCR text extraction...');
    const result = await worker.recognize(file);
    
    onProgress?.('Finishing OCR...');
    return result.data.text || '';
  } catch (error) {
    console.error('Local OCR failed:', error);
    throw new Error('Local OCR failed to read the image. Please upload a clearer image.');
  } finally {
    await worker.terminate();
  }
}
