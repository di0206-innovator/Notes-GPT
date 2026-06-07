import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Ensure the Google Generative AI SDK picks up the correct environment variable
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
}

/**
 * Perform OCR on an image buffer using Google's Vision capabilities (gemini-2.5-flash).
 * Extracts text, math formulas, headings, definitions, and highlights.
 * Flags unclear handwriting or blurry sections with [OCR_UNCERTAIN: reason].
 */
export async function performOCR(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const prompt = `Perform OCR on this study notes image. 
Extract all text, headings, list points, definitions, formulas, examples, and key points accurately.
Follow these formatting rules strictly:
1. Format mathematical equations using LaTeX syntax enclosed in double dollar signs (e.g., $$E = mc^2$$ or $$\\int_0^\\infty e^{-x^2} dx$$).
2. Use Markdown headings (#, ##, ###) to represent logical divisions in the notes.
3. Keep the layout and organization structure similar to the source notes.
4. IMPORTANT: If there are any parts of the notes that are handwritten, blurry, cut-off, or otherwise illegible, DO NOT guess or hallucinate. Instead, insert a special tag: [OCR_UNCERTAIN: brief description of what is illegible or missing, e.g., handwritten term here, or blurry equation].
5. Do not include any introductory remarks, conversation, or wrapping blocks. Return ONLY the clean extracted Markdown text.`;

  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              image: imageBuffer,
              mediaType: mimeType,
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    return text?.trim() || '';
  } catch (error) {
    console.error('[OCR Error]', error);
    throw new Error('Failed to perform OCR on image notes. Please check the API configuration and file format.');
  }
}

