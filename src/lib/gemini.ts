import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Ensure the Google Generative AI SDK picks up the correct environment variable
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
}

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  console.warn("GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) is missing from environment variables.");
}

export async function generateChatResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  temperature?: number
): Promise<string> {
  const systemMessage = messages.find((m) => m.role === 'system');
  const otherMessages = messages.filter((m) => m.role !== 'system');

  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    system: systemMessage?.content,
    messages: otherMessages as Array<{ role: 'user' | 'assistant'; content: string }>,
    temperature: temperature ?? 0.2,
  });
  
  return text || '';
}

