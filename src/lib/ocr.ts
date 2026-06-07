import { openai } from './openai';

/**
 * Perform OCR on an image buffer using OpenAI's Vision capabilities (gpt-4o-mini).
 * Extracts text, math formulas, headings, definitions, and highlights.
 * Flags unclear handwriting or blurry sections with [OCR_UNCERTAIN: reason].
 */
export async function performOCR(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const base64Image = imageBuffer.toString('base64');
  const imageUrl = `data:${mimeType};base64,${base64Image}`;

  const prompt = `Perform OCR on this study notes image. 
Extract all text, headings, list points, definitions, formulas, examples, and key points accurately.
Follow these formatting rules strictly:
1. Format mathematical equations using LaTeX syntax enclosed in double dollar signs (e.g., $$E = mc^2$$ or $$\\int_0^\\infty e^{-x^2} dx$$).
2. Use Markdown headings (#, ##, ###) to represent logical divisions in the notes.
3. Keep the layout and organization structure similar to the source notes.
4. IMPORTANT: If there are any parts of the notes that are handwritten, blurry, cut-off, or otherwise illegible, DO NOT guess or hallucinate. Instead, insert a special tag: [OCR_UNCERTAIN: brief description of what is illegible or missing, e.g., handwritten term here, or blurry equation].
5. Do not include any introductory remarks, conversation, or wrapping blocks. Return ONLY the clean extracted Markdown text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('[OCR Error]', error);
    throw new Error('Failed to perform OCR on image notes. Please check the API configuration and file format.');
  }
}
